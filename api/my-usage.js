// ── Per-user API usage ────────────────────────────────────────────────────
// Returns the caller's own consumption for the day and current hour, plus
// the configured limits, so the client can render a quota chip / progress
// bar on the dashboard without exposing other users' data.
//
// All counters are already incremented by /api/weather and /api/atis — we
// just read them here. No mutations.

import { Redis } from '@upstash/redis';

const kv = new Redis({
    url:   process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

const ACCESS_HOURLY_LIMIT = parseInt(process.env.ACCESS_HOURLY_LIMIT || '1000', 10);

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

function normaliseCode(code) {
    return (code || '').toString().toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 20);
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const code = normaliseCode(req.headers['x-access-code']);
    if (!code || code.length < 4) {
        return res.status(200).json({
            authenticated: false,
            hourly: { used: 0, limit: ACCESS_HOURLY_LIMIT, pct: 0 },
            daily:  { used: 0 },
        });
    }

    try {
        const today    = getTodayKey();
        const hourKey  = getHourKey();
        const [hourly, daily] = await Promise.all([
            kv.get(`efb:ratelimit:user:${code}:${hourKey}`),
            kv.get(`efb:users:${code}:calls:${today}`),
        ]);
        const hourlyUsed = parseInt(hourly, 10) || 0;
        const dailyUsed  = parseInt(daily,  10) || 0;
        const pct        = Math.min(100, Math.round((hourlyUsed / ACCESS_HOURLY_LIMIT) * 100));
        const now        = new Date();
        const nextHour   = new Date(Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
            now.getUTCHours() + 1, 0, 0));
        return res.status(200).json({
            authenticated: true,
            hourly: {
                used:      hourlyUsed,
                limit:     ACCESS_HOURLY_LIMIT,
                pct,
                resets_at: nextHour.toISOString(),
                resets_in_ms: nextHour.getTime() - now.getTime(),
            },
            daily: {
                used: dailyUsed,
                date: today,
            },
        });
    } catch (err) {
        console.error('[my-usage] Redis error:', err.message);
        return res.status(200).json({
            authenticated: true,
            hourly: { used: 0, limit: ACCESS_HOURLY_LIMIT, pct: 0 },
            daily:  { used: 0 },
            error:  'usage unavailable',
        });
    }
}
