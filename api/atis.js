// ── D-ATIS proxy (datis.clowd.io) ─────────────────────────────────────────
// As of v5.1.7 we no longer scrape atis.guru server-side — Cloudflare keeps
// 403-ing Vercel's egress IPs regardless of UA / Sec-Fetch headers. atis.guru
// is now loaded by the client browser in an iframe, which uses the user's
// residential IP and just works.
//
// What's left here: a thin proxy to datis.clowd.io — a documented community
// FAA D-ATIS mirror. JSON-only, permissive CORS, no UA gating. US airports
// only. We proxy through the backend (rather than have the client hit it
// directly) so we keep the existing access-code gate and per-user / per-IP
// hourly rate limit consistent across all weather data routes.

import { Redis } from '@upstash/redis';

const kv = new Redis({
    url:   process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

const ACCESS_HOURLY_LIMIT = parseInt(process.env.ACCESS_HOURLY_LIMIT || '1000', 10);
const IP_HOURLY_LIMIT     = parseInt(process.env.IP_HOURLY_LIMIT     || '600',  10);

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
function getClientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    if (fwd) return fwd.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
}

async function validateAccessCode(code) {
    if (!code) return false;
    const key = code.toString().toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 20);
    if (key.length < 4) return false;
    try {
        const user = await kv.get(`efb:users:${key}`);
        return !!(user && user.active);
    } catch(e) {
        console.error('[ATIS][Access] Redis lookup failed:', e.message);
        return true;  // fail open
    }
}

async function checkRateLimit(accessCode, ip) {
    const hourKey = getHourKey();
    try {
        const code = (accessCode || '').toString().toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 20);
        if (code.length >= 4) {
            const k = `efb:ratelimit:user:${code}:${hourKey}`;
            const c = await kv.incr(k);
            if (c === 1) await kv.expire(k, 7200);
            if (c > ACCESS_HOURLY_LIMIT) {
                return { allowed: false, by: 'user', count: c, limit: ACCESS_HOURLY_LIMIT };
            }
        }
        const ipK = `efb:ratelimit:ip:${ip}:${hourKey}`;
        const ipC = await kv.incr(ipK);
        if (ipC === 1) await kv.expire(ipK, 7200);
        if (ipC > IP_HOURLY_LIMIT) {
            return { allowed: false, by: 'ip', count: ipC, limit: IP_HOURLY_LIMIT };
        }
        return { allowed: true };
    } catch(e) {
        console.error('[ATIS][RateLimit] Redis error:', e.message);
        return { allowed: true };
    }
}

function extractLetter(text) {
    if (!text) return null;
    const m = text.match(/INFORMATION\s+([A-Z])\b/i) || text.match(/ATIS\s+([A-Z])\b/);
    return m ? m[1].toUpperCase() : null;
}

// Wrap datis.clowd.io into the same { arrival, departure, single, raw }
// shape the frontend already knows how to render.
function shapeClowdResponse(station, items) {
    let arrival = null, departure = null, single = null;
    for (const it of items) {
        if (!it || !it.datis) continue;
        const block = {
            letter: (it.code || extractLetter(it.datis) || null),
            issued: null,
            text:   it.datis.trim(),
        };
        const type = (it.type || '').toLowerCase();
        if      (type === 'arr' && !arrival)    arrival   = block;
        else if (type === 'dep' && !departure)  departure = block;
        else if (!single)                       single    = block;
    }
    if (!arrival && !departure && !single) return null;
    const flat = [];
    if (arrival)   flat.push(`ARRIVAL ATIS ${arrival.letter || ''}\n${arrival.text}`.trim());
    if (departure) flat.push(`DEPARTURE ATIS ${departure.letter || ''}\n${departure.text}`.trim());
    if (single)    flat.push(single.text);
    return {
        station,
        letter:   arrival?.letter || single?.letter || departure?.letter || null,
        issued:   null,
        arrival, departure, single,
        raw:      flat.join('\n\n'),
        source:   'datis.clowd.io',
        fetched:  Date.now(),
    };
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const station = (req.query.station || '').toString().toUpperCase().slice(0, 4);
    if (!station || !/^[A-Z0-9]{3,4}$/.test(station)) {
        return res.status(400).json({ error: 'Station is required (3–4 letter ICAO/IATA)' });
    }

    const accessCode = req.headers['x-access-code'];
    if (process.env.ACCESS_GATE_ENABLED === 'true') {
        const valid = await validateAccessCode(accessCode);
        if (!valid) {
            return res.status(403).json({ error: 'Invalid or missing access code' });
        }
    }

    const rl = await checkRateLimit(accessCode, getClientIp(req));
    if (!rl.allowed) {
        return res.status(429).json({
            error: `Rate limit exceeded (${rl.by}). Try again in an hour.`,
            limit: rl.limit,
        });
    }

    // Try sources in priority order. atis.info is the official successor to
    // datis.clowd.io (FAA D-ATIS aggregator, same project relocated). We try
    // it first, then fall back to clowd.io (still online, may keep working
    // for a while), aggregating any diagnostics for the unavailable card.
    const diag = { tried: [] };

    const infoResult = await tryAtisInfo(station, diag);
    if (infoResult) return res.status(200).json({ ...infoResult, _diag: diag });

    const clowdResult = await tryClowdIo(station, diag);
    if (clowdResult) return res.status(200).json({ ...clowdResult, _diag: diag });

    return res.status(200).json({
        error:   'D-ATIS unavailable',
        station,
        detail:  diag.tried.map(t => `${t.source}: ${t.detail || 'no data'}`).join(' · '),
        status:  diag.tried.find(t => typeof t.status === 'number')?.status || null,
        source:  null,
        fetched: Date.now(),
        _diag:   diag,
    });
}

// ── Source: atis.info ────────────────────────────────────────────────────
// Successor to datis.clowd.io for FAA D-ATIS aggregation. Same project,
// new home. Tried first.
//
// Expected response shape (inherited from the clowd.io implementation):
//   GET /api/<ICAO>
//   → 200 [{ airport, type: "arr"|"dep"|"combined", code, datis }, ...]
//   → 404 / {error:"..."} for unknown ICAO
// If atis.info uses a different shape, the parser falls through and we try
// clowd.io. The Vercel logs will show the body snippet so we can adapt.
async function tryAtisInfo(station, diag) {
    const url = `https://atis.info/api/${station}`;
    const t0 = Date.now();
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 7000);
    try {
        const r = await fetch(url, {
            headers: {
                'Accept':     'application/json',
                'User-Agent': 'Mozilla/5.0 METAR-GO-EFB',
            },
            signal: ctrl.signal,
        });
        clearTimeout(tid);
        const ms = Date.now() - t0;
        if (!r.ok) {
            diag.tried.push({ source: 'atis.info', status: r.status, detail: `HTTP ${r.status}`, ms });
            return null;
        }
        const text = await r.text();
        let data;
        try { data = JSON.parse(text); } catch(e) {
            console.warn(`[ATIS] ${station} atis.info non-JSON response. First 240:`, text.slice(0, 240).replace(/\s+/g, ' '));
            diag.tried.push({ source: 'atis.info', status: 200, detail: 'non-JSON response', ms });
            return null;
        }
        if (!data || (!Array.isArray(data) && data.error)) {
            diag.tried.push({ source: 'atis.info', status: 200, detail: (data && data.error) || 'no data', ms });
            return null;
        }
        const items  = Array.isArray(data) ? data : [data];
        const shaped = shapeClowdResponse(station, items);   // identical shape to clowd.io
        if (!shaped) {
            console.warn(`[ATIS] ${station} atis.info items but no usable datis:`, JSON.stringify(items).slice(0, 240));
            diag.tried.push({ source: 'atis.info', status: 200, detail: 'no usable datis text', ms });
            return null;
        }
        // Tag the source so the frontend label updates correctly.
        shaped.source = 'atis.info';
        diag.tried.push({ source: 'atis.info', status: 200, detail: 'ok', ms });
        return shaped;
    } catch(err) {
        clearTimeout(tid);
        const detail = err.name === 'AbortError' ? 'timeout' : (err.message || 'fetch error');
        console.warn(`[ATIS] ${station} atis.info failed:`, detail);
        diag.tried.push({ source: 'atis.info', detail, ms: Date.now() - t0 });
        return null;
    }
}

// ── Source: datis.clowd.io ───────────────────────────────────────────────
// Fallback for when atis.info is down or returns nothing. Same JSON shape.
async function tryClowdIo(station, diag) {
    const url = `https://datis.clowd.io/api/${station}`;
    const t0 = Date.now();
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 7000);
    try {
        const r = await fetch(url, {
            headers: {
                'Accept':     'application/json',
                'User-Agent': 'Mozilla/5.0 METAR-GO-EFB',
            },
            signal: ctrl.signal,
        });
        clearTimeout(tid);
        const ms = Date.now() - t0;
        if (!r.ok) {
            diag.tried.push({ source: 'datis.clowd.io', status: r.status, detail: `HTTP ${r.status}`, ms });
            return null;
        }
        const data = await r.json().catch(() => null);
        if (!data || (!Array.isArray(data) && data.error)) {
            diag.tried.push({ source: 'datis.clowd.io', status: 200, detail: (data && data.error) || 'no data', ms });
            return null;
        }
        const items  = Array.isArray(data) ? data : [data];
        const shaped = shapeClowdResponse(station, items);
        if (!shaped) {
            diag.tried.push({ source: 'datis.clowd.io', status: 200, detail: 'no usable datis text', ms });
            return null;
        }
        diag.tried.push({ source: 'datis.clowd.io', status: 200, detail: 'ok', ms });
        return shaped;
    } catch(err) {
        clearTimeout(tid);
        const detail = err.name === 'AbortError' ? 'timeout' : (err.message || 'fetch error');
        console.warn(`[ATIS] ${station} clowd.io failed:`, detail);
        diag.tried.push({ source: 'datis.clowd.io', detail, ms: Date.now() - t0 });
        return null;
    }
}
