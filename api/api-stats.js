import { Redis } from '@upstash/redis';

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

const DAILY_LIMIT = parseInt(process.env.AVWX_DAILY_LIMIT || '4000', 10);
const ADMIN_PASSWORD = process.env.API_ADMIN_PASSWORD;

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');  // ← add POST
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getTodayKey() {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    const { password } = req.body;  // ← change from req.query to req.body
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const today = getTodayKey();
        
        // Fetch usage for all 4 keys
        const key1 = await kv.get(`avwx:usage:${today}:key1`) || 0;
        const key2 = await kv.get(`avwx:usage:${today}:key2`) || 0;
        const key3 = await kv.get(`avwx:usage:${today}:key3`) || 0;
        const key4 = await kv.get(`avwx:usage:${today}:key4`) || 0;
        const total = await kv.get(`avwx:total:${today}`) || 0;
        
        // Calculate aggregate stats
        const keys = [
            { 
                id: 1, 
                usage: parseInt(key1, 10), 
                limit: DAILY_LIMIT,
                remaining: DAILY_LIMIT - parseInt(key1, 10),
                percentage: Math.round((parseInt(key1, 10) / DAILY_LIMIT) * 100)
            },
            { 
                id: 2, 
                usage: parseInt(key2, 10), 
                limit: DAILY_LIMIT,
                remaining: DAILY_LIMIT - parseInt(key2, 10),
                percentage: Math.round((parseInt(key2, 10) / DAILY_LIMIT) * 100)
            },
            { 
                id: 3, 
                usage: parseInt(key3, 10), 
                limit: DAILY_LIMIT,
                remaining: DAILY_LIMIT - parseInt(key3, 10),
                percentage: Math.round((parseInt(key3, 10) / DAILY_LIMIT) * 100)
            },
            { 
                id: 4, 
                usage: parseInt(key4, 10), 
                limit: DAILY_LIMIT,
                remaining: DAILY_LIMIT - parseInt(key4, 10),
                percentage: Math.round((parseInt(key4, 10) / DAILY_LIMIT) * 100)
            }
        ];
        
        const totalLimit = DAILY_LIMIT * 4;
        const totalUsage = parseInt(total, 10);
        
        return res.json({
            date: today,
            keys,
            aggregate: {
                total_usage: totalUsage,
                total_limit: totalLimit,
                total_remaining: totalLimit - totalUsage,
                percentage: Math.round((totalUsage / totalLimit) * 100)
            }
        });
        
    } catch (error) {
        console.error('[API Stats] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch stats' });
    }
}
