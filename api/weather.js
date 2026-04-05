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
    process.env.AVWX_KEY_5,
    process.env.AVWX_KEY_6,
    process.env.AVWX_KEY_7,
    process.env.AVWX_KEY_8,
    process.env.AVWX_KEY_9,
].filter(Boolean);

const DAILY_LIMIT    = parseInt(process.env.AVWX_DAILY_LIMIT    || '4000', 10);
const IP_HOURLY_LIMIT = parseInt(process.env.IP_HOURLY_LIMIT    || '200',  10);

function setCors(res) {
    const allowed = process.env.ALLOWED_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowed || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-code');
    if (allowed) res.setHeader('Vary', 'Origin');
}

function getTodayKey() {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

function getHourKey() {
    const d = new Date();
    return `${getTodayKey()}:${String(d.getUTCHours()).padStart(2,'0')}`;
}

// ── Access Code Validation ────────────────────────────────────────────────
async function validateAccessCode(code) {
    if (!code) return false;
    const key = code.toString().toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 20);
    if (key.length < 4) return false;
    try {
        const user = await kv.get(`efb:users:${key}`);
        if (!(user && user.active)) return false;
        // Increment per-user daily call counter (fire and forget)
        const dateKey = getTodayKey();
        kv.incr(`efb:users:${key}:calls:${dateKey}`).catch(() => {});
        kv.expire(`efb:users:${key}:calls:${dateKey}`, 172800).catch(() => {});
        return true;
    } catch(e) {
        console.error('[Access] Redis lookup failed:', e.message);
        return true; // Fail open on Redis errors — don't block real users
    }
}

// ── Per-IP Rate Limiting ──────────────────────────────────────────────────
async function checkIpRateLimit(ip) {
    const rateLimitKey = `efb:ratelimit:${ip}:${getHourKey()}`;
    try {
        const count = await kv.incr(rateLimitKey);
        if (count === 1) await kv.expire(rateLimitKey, 7200); // 2h TTL
        return count <= IP_HOURLY_LIMIT;
    } catch(e) {
        console.error('[RateLimit] Redis error:', e.message);
        return true; // Fail open on Redis errors
    }
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
}

// ── Admin Anomaly Event Logger ────────────────────────────────────────────
async function logApiEvent(type, keyIndex, station, ms, detail) {
    try {
        const event = JSON.stringify({
            ts:      Date.now(),
            type,                                              // timeout|error|slow|rotation|exhausted
            key:     keyIndex != null ? `#${keyIndex + 1}` : null,
            station: station || null,
            ms:      ms != null ? Math.round(ms) : null,
            detail:  detail || null
        });
        await kv.lpush('efb:api_events', event);
        await kv.ltrim('efb:api_events', 0, 199);             // keep last 200
        await kv.expire('efb:api_events', 172800);            // 48 h TTL
    } catch (e) { console.warn('[logApiEvent] Redis write failed:', e.message); }
}

// ── AVWX Key Management ───────────────────────────────────────────────────
async function getKeyUsage(keyIndex) {
    const today = getTodayKey();
    const count = await kv.get(`avwx:usage:${today}:key${keyIndex + 1}`);
    return count ? parseInt(count, 10) : 0;
}

async function incrementKeyUsage(keyIndex) {
    const today = getTodayKey();
    const keyUsageKey = `avwx:usage:${today}:key${keyIndex + 1}`;
    const totalKey    = `avwx:total:${today}`;
    await kv.incr(keyUsageKey);
    await kv.incr(totalKey);
    await kv.expire(keyUsageKey, 172800);
    await kv.expire(totalKey,    172800);
}

async function selectBestKey() {
    const today = getTodayKey();
    // Round-robin index stored in Redis so all instances stay in sync
    const rrKey  = `avwx:rr:${today}`;
    const usages = await Promise.all(API_KEYS.map((_, i) => getKeyUsage(i)));

    // Try up to N keys starting from the round-robin position
    const startRaw = await kv.get(rrKey);
    const start    = startRaw ? parseInt(startRaw, 10) % API_KEYS.length : 0;

    for (let offset = 0; offset < API_KEYS.length; offset++) {
        const i = (start + offset) % API_KEYS.length;
        if (usages[i] < DAILY_LIMIT) {
            // Advance the pointer for the next caller
            await kv.set(rrKey, (i + 1) % API_KEYS.length, { ex: 172800 });
            return i;
        }
    }
    return -1; // all keys exhausted
}

async function fetchWithKey(keyIndex, url, station) {
    const key = API_KEYS[keyIndex];
    if (!key) throw new Error(`[AVWX] Invalid API key index: ${keyIndex}`);
    console.log(`[AVWX] Using Key #${keyIndex + 1} for ${url}`);

    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 9000);
    const t0  = Date.now();

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${key}` },
            signal:  controller.signal
        });
        clearTimeout(tId);
        const elapsed = Date.now() - t0;

        if (!response.ok) {
            const status = response.status;
            console.error(`[AVWX] Key #${keyIndex + 1} failed with status ${status}`);
            if (status === 429) {
                const today = getTodayKey();
                await kv.set(`avwx:usage:${today}:key${keyIndex + 1}`, DAILY_LIMIT);
            }
            await logApiEvent('error', keyIndex, station, elapsed, `HTTP ${status}`);
            throw new Error(`HTTP ${status}`);
        }

        if (elapsed > 4000) {
            await logApiEvent('slow', keyIndex, station, elapsed, null);
        }

        return response.json();
    } catch (err) {
        clearTimeout(tId);
        if (err.name === 'AbortError') {
            await logApiEvent('timeout', keyIndex, station, 9000, 'request aborted after 9s');
            throw new Error('AVWX request timed out');
        }
        throw err;
    }
}

async function fetchWithRotation(url, station) {
    let keyIndex = await selectBestKey();
    if (keyIndex === -1) {
        await logApiEvent('exhausted', null, station, null, 'all keys at daily limit');
        throw new Error("All API keys exhausted for today");
    }
    try {
        const data  = await fetchWithKey(keyIndex, url, station);
        await incrementKeyUsage(keyIndex);
        const usage = await getKeyUsage(keyIndex);
        return { ...data, _meta: { key_used: keyIndex+1, key_usage: usage, key_limit: DAILY_LIMIT, key_remaining: DAILY_LIMIT - usage } };
    } catch (err) {
        console.log(`[AVWX] Key #${keyIndex + 1} failed, trying fallback...`);
        for (let i = 0; i < API_KEYS.length; i++) {
            if (i === keyIndex) continue;
            const usage = await getKeyUsage(i);
            if (usage >= DAILY_LIMIT) continue;
            try {
                await logApiEvent('rotation', keyIndex, station, null, `fell back to key #${i + 1}`);
                const data     = await fetchWithKey(i, url, station);
                await incrementKeyUsage(i);
                const newUsage = await getKeyUsage(i);
                return { ...data, _meta: { key_used: i+1, key_usage: newUsage, key_limit: DAILY_LIMIT, key_remaining: DAILY_LIMIT - newUsage } };
            } catch (e) {
                console.error(`[AVWX] Key #${i + 1} also failed`);
                continue;
            }
        }
        await logApiEvent('exhausted', null, station, null, 'all keys tried and failed');
        throw new Error("All API keys exhausted or failed");
    }
}

// ── Main Handler ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { station, type } = req.query;
    if (!station) return res.status(400).json({ error: 'Station is required' });

    // ── 1. Access Code Check ──────────────────────────────────────────────
    // Skip validation only if ACCESS_GATE_ENABLED is not explicitly 'true'
    if (process.env.ACCESS_GATE_ENABLED === 'true') {
        const accessCode = req.headers['x-access-code'];
        const isValid    = await validateAccessCode(accessCode);
        if (!isValid) {
            console.warn(`[Access] Rejected request — code: ${accessCode || 'none'}, station: ${station}`);
            return res.status(403).json({ error: 'Invalid or missing access code' });
        }
    }

    // ── 2. Per-IP Rate Limit ──────────────────────────────────────────────
    const clientIp = getClientIp(req);
    const allowed  = await checkIpRateLimit(clientIp);
    if (!allowed) {
        console.warn(`[RateLimit] Blocked IP: ${clientIp}`);
        return res.status(429).json({ error: 'Rate limit exceeded. Try again in an hour.' });
    }

    // ── 3. Fetch weather data ─────────────────────────────────────────────
    try {
        let endpoint = '';
        if      (type === 'station') endpoint = `https://avwx.rest/api/station/${station}`;
        else if (type === 'metar')   endpoint = `https://avwx.rest/api/metar/${station}`;
        else if (type === 'taf')     endpoint = `https://avwx.rest/api/taf/${station}`;
        else if (type === 'notam')   endpoint = `https://avwx.rest/api/notam/${station}`;
        else if (type === 'near')    endpoint = `https://avwx.rest/api/station/near/${station}`;
        else if (type === 'search')  endpoint = `https://avwx.rest/api/search/station?text=${station}`;
        else return res.status(400).json({ error: 'Invalid type parameter' });

        const data = await fetchWithRotation(endpoint, station);
        res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');
        return res.status(200).json(data);
    } catch (error) {
        console.error('[AVWX] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch weather data', details: error.message });
    }
}
