import { Redis } from '@upstash/redis';

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

const DAILY_LIMIT    = parseInt(process.env.AVWX_DAILY_LIMIT || '4000', 10);
const ADMIN_PASSWORD = process.env.API_ADMIN_PASSWORD;

function setCors(res) {
    const allowed = process.env.ALLOWED_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowed || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-code');
    if (allowed) res.setHeader('Vary', 'Origin');
}

function getTodayKey() {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { password } = req.body || {};
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const today  = getTodayKey();
        const key1   = await kv.get(`avwx:usage:${today}:key1`) || 0;
        const key2   = await kv.get(`avwx:usage:${today}:key2`) || 0;
        const key3   = await kv.get(`avwx:usage:${today}:key3`) || 0;
        const key4   = await kv.get(`avwx:usage:${today}:key4`) || 0;
        const total  = await kv.get(`avwx:total:${today}`)      || 0;

        const keys = [key1, key2, key3, key4].map((usage, i) => {
            const u = parseInt(usage, 10);
            return { id: i+1, usage: u, limit: DAILY_LIMIT, remaining: DAILY_LIMIT - u, percentage: Math.round((u / DAILY_LIMIT) * 100) };
        });

        const totalLimit = DAILY_LIMIT * 4;
        const totalUsage = parseInt(total, 10);

        return res.json({
            date: today,
            keys,
            aggregate: {
                total_usage:     totalUsage,
                total_limit:     totalLimit,
                total_remaining: totalLimit - totalUsage,
                percentage:      Math.round((totalUsage / totalLimit) * 100)
            }
        });
    } catch (error) {
        console.error('[API Stats] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch stats' });
    }
}
