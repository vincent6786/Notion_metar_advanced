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

    const { password, action } = req.body || {};
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

    // ── Events: return recent API anomaly log from Redis ──────────────────
    if (action === 'events') {
        try {
            const raw    = await kv.lrange('efb:api_events', 0, 99);
            const events = (Array.isArray(raw) ? raw : [])
                .map(r => { try { return JSON.parse(r); } catch { return null; } })
                .filter(Boolean);
            return res.json({ events });
        } catch (error) {
            console.error('[API Stats] Events fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch events' });
        }
    }

    try {
        const today    = getTodayKey();
        const keyCount = Object.keys(process.env)
            .filter(k => /^AVWX_KEY_\d+$/.test(k) && process.env[k])
            .length;

        const usages = await Promise.all(
            Array.from({ length: keyCount }, (_, i) =>
                kv.get(`avwx:usage:${today}:key${i + 1}`).then(v => parseInt(v, 10) || 0)
            )
        );

        const keys = usages.map((u, i) => ({
            id:         i + 1,
            usage:      u,
            limit:      DAILY_LIMIT,
            remaining:  DAILY_LIMIT - u,
            percentage: Math.round((u / DAILY_LIMIT) * 100)
        }));

        const totalLimit = DAILY_LIMIT * keyCount;
        const totalUsage = keys.reduce((sum, k) => sum + k.usage, 0);

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
