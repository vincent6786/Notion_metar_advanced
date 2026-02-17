import { Redis } from '@upstash/redis';

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

// API Keys from environment
const API_KEYS = [
    process.env.AVWX_KEY_1,
    process.env.AVWX_KEY_2,
    process.env.AVWX_KEY_3,
    process.env.AVWX_KEY_4,
].filter(Boolean);

const DAILY_LIMIT = parseInt(process.env.AVWX_DAILY_LIMIT || '4000', 10);

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Get today's date key (UTC)
function getTodayKey() {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// Get usage for a specific key
async function getKeyUsage(keyIndex) {
    const today = getTodayKey();
    const count = await kv.get(`avwx:usage:${today}:key${keyIndex + 1}`);
    return count ? parseInt(count, 10) : 0;
}

// Increment usage for a key
async function incrementKeyUsage(keyIndex) {
    const today = getTodayKey();
    const keyUsageKey = `avwx:usage:${today}:key${keyIndex + 1}`;
    const totalKey = `avwx:total:${today}`;
    
    await kv.incr(keyUsageKey);
    await kv.incr(totalKey);
    
    // Set expiry (48 hours)
    await kv.expire(keyUsageKey, 172800);
    await kv.expire(totalKey, 172800);
}

// Select best key (lowest usage under limit)
async function selectBestKey() {
    const usages = await Promise.all(
        API_KEYS.map((_, i) => getKeyUsage(i))
    );
    
    let bestIndex = -1;
    let lowestUsage = DAILY_LIMIT;
    
    for (let i = 0; i < API_KEYS.length; i++) {
        if (usages[i] < DAILY_LIMIT && usages[i] < lowestUsage) {
            lowestUsage = usages[i];
            bestIndex = i;
        }
    }
    
    return bestIndex; // Returns -1 if all exhausted
}

// Fetch with specific key using Bearer auth (your original method)
async function fetchWithKey(keyIndex, url) {
    const key = API_KEYS[keyIndex];
    
    console.log(`[AVWX] Using Key #${keyIndex + 1} for ${url}`);
    
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${key}` }
    });
    
    if (!response.ok) {
        const status = response.status;
        console.error(`[AVWX] Key #${keyIndex + 1} failed with status ${status}`);
        
        // If 429 (rate limit), mark this key as exhausted
        if (status === 429) {
            const today = getTodayKey();
            await kv.set(`avwx:usage:${today}:key${keyIndex + 1}`, DAILY_LIMIT);
        }
        
        throw new Error(`HTTP ${status}`);
    }
    
    return response.json();
}

// Smart rotation with usage tracking
async function fetchWithRotation(url) {
    // Try to select best key based on usage
    let keyIndex = await selectBestKey();
    
    if (keyIndex === -1) {
        // All keys exhausted, throw error
        throw new Error("All API keys exhausted for today");
    }
    
    // Try primary key
    try {
        const data = await fetchWithKey(keyIndex, url);
        await incrementKeyUsage(keyIndex);
        
        // Add metadata about which key was used
        const usage = await getKeyUsage(keyIndex);
        return {
            ...data,
            _meta: {
                key_used: keyIndex + 1,
                key_usage: usage,
                key_limit: DAILY_LIMIT,
                key_remaining: DAILY_LIMIT - usage
            }
        };
    } catch (err) {
        // Primary key failed, try next available
        console.log(`[AVWX] Key #${keyIndex + 1} failed, trying fallback...`);
        
        // Find next available key
        for (let i = 0; i < API_KEYS.length; i++) {
            if (i === keyIndex) continue; // Skip the one that just failed
            
            const usage = await getKeyUsage(i);
            if (usage >= DAILY_LIMIT) continue; // Skip exhausted keys
            
            try {
                const data = await fetchWithKey(i, url);
                await incrementKeyUsage(i);
                
                const newUsage = await getKeyUsage(i);
                return {
                    ...data,
                    _meta: {
                        key_used: i + 1,
                        key_usage: newUsage,
                        key_limit: DAILY_LIMIT,
                        key_remaining: DAILY_LIMIT - newUsage
                    }
                };
            } catch (e) {
                console.error(`[AVWX] Key #${i + 1} also failed`);
                continue;
            }
        }
        
        // All keys failed
        throw new Error("All API keys exhausted or failed");
    }
}

// Main handler
export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    const { station, type } = req.query;
    
    if (!station) {
        return res.status(400).json({ error: 'Station is required' });
    }
    
    try {
        let endpoint = '';
        
        // Build endpoint based on type (your original endpoint logic)
        if (type === 'station') {
            endpoint = `https://avwx.rest/api/station/${station}`;
        } else if (type === 'metar') {
            endpoint = `https://avwx.rest/api/metar/${station}`;
        } else if (type === 'taf') {
            endpoint = `https://avwx.rest/api/taf/${station}`;
        } else if (type === 'notam') {
            endpoint = `https://avwx.rest/api/notam/${station}`;
        } else if (type === 'near') {
            endpoint = `https://avwx.rest/api/station/near/${station}`;
        } else if (type === 'search') {
            endpoint = `https://avwx.rest/api/search/station?text=${station}`;
        } else {
            return res.status(400).json({ error: 'Invalid type parameter' });
        }
        
        // Fetch with smart rotation and tracking
        const data = await fetchWithRotation(endpoint);
        
        // Set cache headers (your original caching)
        res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');
        
        return res.status(200).json(data);
        
    } catch (error) {
        console.error('[AVWX] Error:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch weather data',
            details: error.message
        });
    }
}
