import { Redis } from '@upstash/redis';

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

// How long cloud settings persist without activity (1 year rolling TTL)
const SETTINGS_TTL    = 365 * 24 * 60 * 60;
// PIN brute-force guard: max attempts per IP per hour
const PIN_HOURLY_LIMIT = parseInt(process.env.PIN_HOURLY_LIMIT || '30', 10);

function isValidPin(pin) {
    return typeof pin === 'string' && /^\d{4,6}$/.test(pin);
}

function setCors(res) {
    const allowed = process.env.ALLOWED_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowed || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-code');
    if (allowed) res.setHeader('Vary', 'Origin');
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
}

function getHourKey() {
    const d = new Date();
    const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    return `${date}:${String(d.getUTCHours()).padStart(2,'0')}`;
}

async function checkPinRateLimit(ip) {
    const key = `efb:pinlimit:${ip}:${getHourKey()}`;
    try {
        const count = await kv.incr(key);
        if (count === 1) await kv.expire(key, 7200); // 2h TTL
        return count <= PIN_HOURLY_LIMIT;
    } catch(e) {
        return true; // fail open on Redis errors
    }
}

// Registry helpers — track which keys a PIN has so we never need kv.keys()
const registryKey = (pin) => `efb:${pin}:_registry`;

// Known cloud-backed keys — used to recover old backups that pre-date registry tracking
const KNOWN_KEYS = [
    'efb_default_station',
    'efb_favorites',
    'efb_mins_active_profile',
    'efb_mins_custom',
    'efb_night_mode',
    'efb_multi_dashboard_enabled',
];

async function registryAdd(pin, key) {
    await kv.sadd(registryKey(pin), key);
    await kv.expire(registryKey(pin), SETTINGS_TTL);
}

async function registryRemove(pin, key) {
    await kv.srem(registryKey(pin), key);
}

async function registryList(pin) {
    return (await kv.smembers(registryKey(pin))) || [];
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Rate limit all PIN-touching requests
    const ip = getClientIp(req);
    const allowed = await checkPinRateLimit(ip);
    if (!allowed) return res.status(429).json({ error: 'Too many requests. Try again later.' });

    try {
        switch (req.method) {

            case 'GET': {
                const { pin, key } = req.query;
                if (!isValidPin(pin)) return res.status(400).json({ error: 'Invalid PIN' });

                // Single-key fetch (used by updateLastSyncTime, cloudLoad)
                if (key) {
                    const value = await kv.get(`efb:${pin}:${key}`);
                    return res.json({ value: value ?? null });
                }

                // Full restore — use registry instead of kv.keys()
                const keys = await registryList(pin);
                const userKeys = keys.filter(k => !k.startsWith('_'));

                // Registry may be empty for older backups (created before registry tracking).
                // Attempt to recover by scanning known keys and rebuilding the registry.
                if (userKeys.length === 0) {
                    const lastUpdated = await kv.get(`efb:${pin}:_lastUpdated`);
                    if (!lastUpdated) return res.json({ found: false, settings: {} });

                    // Probe all known keys and rebuild registry on-the-fly
                    const recovered = {};
                    const rebuiltKeys = [];
                    for (const k of KNOWN_KEYS) {
                        const val = await kv.get(`efb:${pin}:${k}`);
                        if (val !== null) {
                            recovered[k] = val;
                            rebuiltKeys.push(k);
                        }
                    }
                    // Write recovered keys back into registry so future restores are fast
                    if (rebuiltKeys.length > 0) {
                        await kv.sadd(registryKey(pin), ...rebuiltKeys);
                        await kv.expire(registryKey(pin), SETTINGS_TTL);
                    }
                    const hadData = Object.keys(recovered).length > 0;
                    return res.json({ found: true, settings: recovered, migrated: !hadData });
                }

                const values = await Promise.all(userKeys.map(k => kv.get(`efb:${pin}:${k}`)));
                const settings = {};
                userKeys.forEach((k, i) => { settings[k] = values[i]; });
                return res.json({ found: true, settings });
            }

            case 'POST': {
                const { pin, key, value } = req.body;
                if (!isValidPin(pin))                        return res.status(400).json({ error: 'Invalid PIN' });
                if (key === undefined || value === undefined) return res.status(400).json({ error: 'Missing key or value' });
                if (key.startsWith('_'))                     return res.status(400).json({ error: 'Reserved key' });

                // Store value + rolling TTL + update registry
                await kv.set(`efb:${pin}:${key}`, value, { ex: SETTINGS_TTL });
                await kv.set(`efb:${pin}:_lastUpdated`, new Date().toISOString(), { ex: SETTINGS_TTL });
                await registryAdd(pin, key);
                return res.json({ success: true });
            }

            case 'DELETE': {
                const { pin, key } = req.query;
                if (!isValidPin(pin)) return res.status(400).json({ error: 'Invalid PIN' });

                if (key) {
                    await kv.del(`efb:${pin}:${key}`);
                    await registryRemove(pin, key);
                    return res.json({ success: true });
                }

                // Full profile delete — use registry to find all keys
                const keys = await registryList(pin);
                const allRedisKeys = [
                    ...keys.map(k => `efb:${pin}:${k}`),
                    `efb:${pin}:_lastUpdated`,
                    registryKey(pin),
                ];
                if (allRedisKeys.length > 0) await Promise.all(allRedisKeys.map(k => kv.del(k)));
                return res.json({ success: true });
            }

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (err) {
        console.error('Settings API Error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
