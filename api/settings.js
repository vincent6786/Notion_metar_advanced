import { Redis } from '@upstash/redis';

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

function isValidPin(pin) {
    return typeof pin === 'string' && /^\d{4,6}$/.test(pin);
}

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods',
        'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        switch (req.method) {

            // ── GET single value or ALL values ───────────────
            case 'GET': {
                const { pin, key } = req.query;
                if (!isValidPin(pin)) {
                    return res.status(400).json({ error: 'Invalid PIN' });
                }

                // Single key
                if (key) {
                    const value = await kv.get(`efb:${pin}:${key}`);
                    return res.json({ value: value ?? null });
                }

                // All keys for this PIN (restore flow)
                const allKeys = await kv.keys(`efb:${pin}:*`);
                if (allKeys.length === 0) {
                    return res.json({ found: false, settings: {} });
                }

                const values = await Promise.all(
                    allKeys.map(k => kv.get(k))
                );

                const settings = {};
                allKeys.forEach((k, i) => {
                    const shortKey = k.replace(`efb:${pin}:`, '');
                    if (!shortKey.startsWith('_')) {
                        settings[shortKey] = values[i];
                    }
                });

                return res.json({ found: true, settings });
            }

            // ── POST save value ───────────────────────────────
            case 'POST': {
                const { pin, key, value } = req.body;
                if (!isValidPin(pin)) {
                    return res.status(400).json({ error: 'Invalid PIN' });
                }
                if (key === undefined || value === undefined) {
                    return res.status(400).json({ 
                        error: 'Missing key or value' 
                    });
                }
                if (key.startsWith('_')) {
                    return res.status(400).json({ error: 'Reserved key' });
                }

                await kv.set(`efb:${pin}:${key}`, value);
                await kv.set(
                    `efb:${pin}:_lastUpdated`,
                    new Date().toISOString()
                );
                return res.json({ success: true });
            }

            // ── DELETE single key or entire profile ───────────
            case 'DELETE': {
                const { pin, key } = req.query;
                if (!isValidPin(pin)) {
                    return res.status(400).json({ error: 'Invalid PIN' });
                }

                if (key) {
                    await kv.del(`efb:${pin}:${key}`);
                    return res.json({ success: true });
                }

                // Wipe entire profile
                const allKeys = await kv.keys(`efb:${pin}:*`);
                if (allKeys.length > 0) {
                    await Promise.all(allKeys.map(k => kv.del(k)));
                }
                return res.json({ success: true });
            }

            default:
                return res.status(405).json({ 
                    error: 'Method not allowed' 
                });
        }
    } catch (err) {
        console.error('Settings API Error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
