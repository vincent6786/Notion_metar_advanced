import { Redis } from '@upstash/redis';

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

const ADMIN_PASSWORD = process.env.API_ADMIN_PASSWORD;

function setCors(res) {
    const allowed = process.env.ALLOWED_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowed || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-code');
    if (allowed) res.setHeader('Vary', 'Origin');
}

function getTodayKey() {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

const VALIDATE_HOURLY_LIMIT = parseInt(process.env.VALIDATE_HOURLY_LIMIT || '60', 10);

function sanitizeCode(raw) {
    return (raw || '').toString().toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 20);
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
}

function getHourKey() {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}:${String(d.getUTCHours()).padStart(2,'0')}`;
}

async function checkValidateRateLimit(ip) {
    const key = `efb:validatelimit:${ip}:${getHourKey()}`;
    try {
        const count = await kv.incr(key);
        if (count === 1) await kv.expire(key, 7200);
        return count <= VALIDATE_HOURLY_LIMIT;
    } catch(e) {
        return true; // fail open
    }
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { action, code, name, password } = req.body || {};

    // ── VALIDATE — called on every app launch & before API calls ─────────
    if (action === 'validate') {
        if (!code) return res.status(400).json({ valid: false, error: 'Code required' });
        const ip = getClientIp(req);
        const rateLimitOk = await checkValidateRateLimit(ip);
        if (!rateLimitOk) return res.status(429).json({ valid: false, error: 'Too many attempts' });
        const key = sanitizeCode(code);
        if (key.length < 4) return res.status(400).json({ valid: false, error: 'Invalid code format' });

        const user = await kv.get(`efb:users:${key}`);
        if (!user || !user.active) {
            return res.status(403).json({ valid: false });
        }

        return res.json({ valid: true, name: user.name });
    }

    // ── Everything below requires admin password ──────────────────────────
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // ── CREATE — generate a new access code ───────────────────────────────
    if (action === 'create') {
        if (!code || !name) return res.status(400).json({ error: 'Code and name required' });
        const key = sanitizeCode(code);
        if (key.length < 4) return res.status(400).json({ error: 'Code must be at least 4 characters' });

        const existing = await kv.get(`efb:users:${key}`);
        if (existing) return res.status(409).json({ error: 'Code already exists' });

        const userData = {
            name: (name || '').toString().slice(0, 40),
            created: new Date().toISOString(),
            active: true
        };
        await kv.set(`efb:users:${key}`, userData);
        await kv.sadd('efb:users:_registry', key);
        return res.json({ success: true, code: key });
    }

    // ── LIST — get all users with today's call counts ─────────────────────
    if (action === 'list') {
        const codes = await kv.smembers('efb:users:_registry');
        if (!codes || codes.length === 0) return res.json({ users: [] });

        const today = getTodayKey();
        const users = await Promise.all(codes.map(async (c) => {
            const user = await kv.get(`efb:users:${c}`);
            const calls = await kv.get(`efb:users:${c}:calls:${today}`);
            return { code: c, ...(user || {}), calls_today: parseInt(calls || 0, 10) };
        }));
        return res.json({ users: users.filter(u => u.name).sort((a,b) => a.code.localeCompare(b.code)) });
    }

    // ── UPDATE — edit a user's name ───────────────────────────────────────
    if (action === 'update') {
        if (!code) return res.status(400).json({ error: 'Code required' });
        const key = sanitizeCode(code);
        const user = await kv.get(`efb:users:${key}`);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const updates = {};
        if (name !== undefined) updates.name = (name || '').toString().slice(0, 40);
        await kv.set(`efb:users:${key}`, { ...user, ...updates });
        return res.json({ success: true });
    }

    // ── REVOKE — disable a user's access ─────────────────────────────────
    if (action === 'revoke') {
        if (!code) return res.status(400).json({ error: 'Code required' });
        const key = sanitizeCode(code);
        const user = await kv.get(`efb:users:${key}`);
        if (!user) return res.status(404).json({ error: 'User not found' });
        await kv.set(`efb:users:${key}`, { ...user, active: false });
        return res.json({ success: true });
    }

    // ── RESTORE — re-enable a revoked user ────────────────────────────────
    if (action === 'restore') {
        if (!code) return res.status(400).json({ error: 'Code required' });
        const key = sanitizeCode(code);
        const user = await kv.get(`efb:users:${key}`);
        if (!user) return res.status(404).json({ error: 'User not found' });
        await kv.set(`efb:users:${key}`, { ...user, active: true });
        return res.json({ success: true });
    }

    // ── DELETE — permanently remove a user ───────────────────────────────
    if (action === 'delete') {
        if (!code) return res.status(400).json({ error: 'Code required' });
        const key = sanitizeCode(code);
        await kv.del(`efb:users:${key}`);
        await kv.srem('efb:users:_registry', key);
        // Also clean up usage keys (best effort)
        const today = getTodayKey();
        kv.del(`efb:users:${key}:calls:${today}`).catch(() => {});
        return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
}
