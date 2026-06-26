// ── D-ATIS proxy (atis.guru) ──────────────────────────────────────────────
// Server-side proxy for atis.guru so the browser doesn't have to deal with
// CORS or the source's UA gating, and so we can share the existing
// access-code + rate-limit machinery used by /api/weather.
//
// This is intentionally an UNOFFICIAL preview source. The frontend renders
// every response with a "Unofficial — source: atis.guru" footer. We return
// HTTP 200 with { error: 'D-ATIS unavailable', ... } when the upstream
// gives us nothing usable — the dashboard's red ERROR card is reserved for
// truly broken responses, not "this airport isn't in the feed".

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

// Mirror of api/weather.js checkRateLimit, scoped here so the file is
// self-contained on Vercel deploy.
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
        return { allowed: true };  // fail open
    }
}

// Pull an ATIS letter (Information ALPHA / Z) out of a free-text body.
// Most D-ATIS broadcasts include exactly one letter in this format.
function extractLetter(text) {
    if (!text) return null;
    const m = text.match(/INFORMATION\s+([A-Z])\b/i) || text.match(/ATIS\s+([A-Z])\b/);
    return m ? m[1].toUpperCase() : null;
}

// Decode numeric / named HTML entities. atis.guru's <pre> block preserves
// whitespace via &#xA; / &#x9; / &#xD;, which our previous tag-stripper
// passed through as literal text — making the output look like garbage.
function decodeHtmlEntities(s) {
    if (!s) return '';
    return s
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
            try { return String.fromCodePoint(parseInt(hex, 16)); } catch(e) { return ''; }
        })
        .replace(/&#(\d+);/g, (_, dec) => {
            try { return String.fromCodePoint(parseInt(dec, 10)); } catch(e) { return ''; }
        })
        .replace(/&amp;/g,  '&')
        .replace(/&lt;/g,   '<')
        .replace(/&gt;/g,   '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g,  "'")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

// Convert atis.guru's HTML page into clean plain text. Preserves the
// per-section linebreaks (Arrival ATIS / Departure ATIS / METAR / TAF) by
// turning block-level tags into newlines BEFORE stripping the remaining
// markup.
function htmlToText(html) {
    let s = String(html || '');
    s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
    s = s.replace(/<style[\s\S]*?<\/style>/gi,  ' ');
    // Block elements → newline so we don't run sections together.
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<\/(p|div|section|article|h[1-6]|li|tr|pre|table)\s*>/gi, '\n');
    s = s.replace(/<(p|div|section|article|h[1-6]|li|tr|pre|table)\b[^>]*>/gi, '\n');
    // Remove the rest of the tags.
    s = s.replace(/<[^>]+>/g, ' ');
    // Decode entities AFTER tag strip so &#xA; becomes a real newline.
    s = decodeHtmlEntities(s);
    // Normalise: collapse runs of spaces/tabs inside a line, keep newlines.
    s = s.split('\n')
         .map(line => line.replace(/[\t ]+/g, ' ').trim())
         .filter(line => line.length > 0)
         .join('\n');
    return s;
}

// Parse an atis.guru station page into structured ATIS sections.
// Layouts seen so far:
//
//   (a) RCTP-style — split arrival + departure:
//         Arrival ATIS
//         2026-06-26 06:55 UTC
//         RCTP ARR ATIS Q
//         <body>
//         Departure ATIS …
//
//   (b) US FAA-style — single combined broadcast, no Arrival/Departure split:
//         ATIS
//         <yyyy-mm-dd hh:mm UTC>
//         KDFW ATIS INFORMATION L 1853Z
//         <body>
//
// The parser tries both, and falls back to scraping whatever clean text we
// can find if neither matches.
function parseAtisPage(html, station) {
    const text = htmlToText(html);
    if (!text) return null;

    // Drop the page chrome before the first ATIS-related heading and stop at
    // the trailing "An unhandled error" footer atis.guru injects.
    let clipped = text;
    const errIdx = clipped.indexOf('An unhandled error');
    if (errIdx !== -1) clipped = clipped.slice(0, errIdx);

    // Locate every recognised section heading, keep the ones we care about,
    // then slice the page between them. We accept several wordings:
    //   "Arrival ATIS"      → arrival
    //   "Departure ATIS"    → departure
    //   "ATIS" / "D-ATIS"   → single (only if no arrival/departure heading)
    //   "METAR" / "TAF"     → end-of-ATIS markers (we render these elsewhere)
    const headings = [];
    // Match a section heading only when it's the entire trimmed line, otherwise
    // "ATIS.guru Home" or "D-ATIS for KDFW" would erroneously match.
    const headingRe = /^(Arrival\s+D?-?ATIS|Departure\s+D?-?ATIS|Combined\s+D?-?ATIS|D-?ATIS|ATIS|METAR|TAF)\s*$/gim;
    let m;
    while ((m = headingRe.exec(clipped)) !== null) {
        // Normalise the heading name into a small set of canonical tags.
        let raw = m[1].toUpperCase().replace(/\s+/g, ' ');
        let name;
        if      (/^ARRIVAL/.test(raw))   name = 'ARRIVAL';
        else if (/^DEPARTURE/.test(raw)) name = 'DEPARTURE';
        else if (/^COMBINED/.test(raw))  name = 'SINGLE';
        else if (/^METAR/.test(raw))     name = 'METAR';
        else if (/^TAF/.test(raw))       name = 'TAF';
        else                             name = 'SINGLE';   // "ATIS" / "D-ATIS"
        headings.push({ name, start: m.index, headerEnd: m.index + m[0].length });
    }

    function bodyOf(i) {
        const next = headings[i + 1];
        const end  = next ? next.start : clipped.length;
        return clipped.slice(headings[i].headerEnd, end).trim();
    }

    function parseBlock(body) {
        if (!body) return null;
        const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        // First line is often the issued timestamp like "2026-06-26 06:55 UTC".
        let issued = null;
        if (/^\d{4}-\d{2}-\d{2}\b/.test(lines[0])) {
            issued = lines.shift();
        }

        // The next line typically reads "<STATION> ARR ATIS Q",
        // "<STATION> DEP ATIS L", or "<STATION> ATIS INFORMATION L 1853Z"
        // depending on the source layout. Pull out the ATIS letter and
        // consume the header so it doesn't repeat in the body.
        let letter = null;
        if (lines.length > 0) {
            const head = lines[0];
            const lm = head.match(/\bATIS\s+INFORMATION\s+([A-Z])\b/i)
                    || head.match(/\bINFORMATION\s+([A-Z])\b/i)
                    || head.match(/\bATIS\s+([A-Z])\b/);
            if (lm) {
                letter = lm[1].toUpperCase();
                lines.shift();
            }
        }

        const textOut = lines.join('\n').trim();
        return textOut ? { issued, letter, text: textOut } : null;
    }

    let arrival = null, departure = null, single = null;
    for (let i = 0; i < headings.length; i++) {
        const h = headings[i];
        if      (h.name === 'ARRIVAL'   && !arrival)   arrival   = parseBlock(bodyOf(i));
        else if (h.name === 'DEPARTURE' && !departure) departure = parseBlock(bodyOf(i));
        else if (h.name === 'SINGLE'    && !single)    single    = parseBlock(bodyOf(i));
        // METAR / TAF headings just delimit the end of the ATIS region.
    }

    if (arrival || departure) {
        // Split format wins. Suppress the "single" candidate if we also matched
        // an explicit Arrival/Departure heading (otherwise we'd duplicate).
        return { arrival, departure };
    }
    if (single) {
        return { arrival: null, departure: null, single };
    }

    // Nothing matched a known heading. Last-ditch fallback: try to recover an
    // ATIS letter from anywhere in the cleaned text, drop obvious page chrome,
    // and return whatever remains as a single block. This handles atis.guru
    // pages where the layout doesn't match anything above but the broadcast
    // text is still there.
    const letter = extractLetter(clipped);
    if (letter) {
        // Trim leading nav/title chrome heuristically: keep from the first
        // line that mentions the station ICAO or "ATIS"/"INFORMATION".
        const lines = clipped.split('\n');
        const startIdx = lines.findIndex(l =>
            (station && l.toUpperCase().includes(station)) ||
            /\bATIS\b/i.test(l) ||
            /\bINFORMATION\b/i.test(l)
        );
        const body = (startIdx === -1 ? clipped : lines.slice(startIdx).join('\n')).trim();
        return { arrival: null, departure: null, single: { letter, text: body, issued: null } };
    }
    return null;
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const station = (req.query.station || '').toString().toUpperCase().slice(0, 4);
    if (!station || !/^[A-Z0-9]{3,4}$/.test(station)) {
        return res.status(400).json({ error: 'Station is required (3–4 letter ICAO/IATA)' });
    }

    // 1. Access code check (same gate the weather route uses).
    const accessCode = req.headers['x-access-code'];
    if (process.env.ACCESS_GATE_ENABLED === 'true') {
        const valid = await validateAccessCode(accessCode);
        if (!valid) {
            console.warn(`[ATIS][Access] Rejected — code: ${accessCode || 'none'}, station: ${station}`);
            return res.status(403).json({ error: 'Invalid or missing access code' });
        }
    }

    // 2. Rate limit (per-user, with per-IP backstop).
    const ip = getClientIp(req);
    const rl = await checkRateLimit(accessCode, ip);
    if (!rl.allowed) {
        console.warn(`[ATIS][RateLimit] Blocked by ${rl.by}: ${rl.count} > ${rl.limit}`);
        return res.status(429).json({
            error: `Rate limit exceeded (${rl.by}). Try again in an hour.`,
            limit: rl.limit,
        });
    }

    // 3. Proxy to atis.guru. Use a full real-browser header set — the source
    // appears to gate non-browser User-Agents (and clearly identifying bot
    // strings) via Cloudflare. A "compatible; bot" UA returns 403 even though
    // the same URL works fine in Chrome / Safari.
    const upstream = `https://atis.guru/atis/${station}`;
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 9000);
    try {
        const r = await fetch(upstream, {
            headers: {
                'User-Agent':                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept':                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language':           'en-US,en;q=0.9',
                'Accept-Encoding':           'gzip, deflate, br',
                'Cache-Control':             'no-cache',
                'Pragma':                    'no-cache',
                'Sec-Fetch-Dest':            'document',
                'Sec-Fetch-Mode':            'navigate',
                'Sec-Fetch-Site':            'none',
                'Sec-Fetch-User':            '?1',
                'Upgrade-Insecure-Requests': '1',
                'Referer':                   'https://atis.guru/',
            },
            redirect: 'follow',
            signal:   controller.signal,
        });
        clearTimeout(tId);

        // Soft-fail upstream errors so the frontend can show a friendly
        // "D-ATIS unavailable" card instead of a red ERROR state. Forward
        // the upstream status so the client can distinguish "source down"
        // (5xx), "blocked by Cloudflare" (403), and "airport not in feed"
        // (404 or empty body).
        if (!r.ok) {
            console.warn(`[ATIS] ${station} upstream HTTP ${r.status}`);
            return res.status(200).json({
                error:    'D-ATIS unavailable',
                detail:   `upstream HTTP ${r.status}`,
                station,
                status:   r.status,
                source:   'atis.guru',
                fetched:  Date.now(),
            });
        }

        const body   = await r.text();
        const parsed = parseAtisPage(body, station);

        if (!parsed || (!parsed.arrival && !parsed.departure && !parsed.single)) {
            // Log a snippet so we can diagnose new layouts from Vercel logs
            // without flooding stdout.
            console.warn(`[ATIS] ${station} parse miss (body ${body.length}B). First 240 chars:`, body.slice(0, 240).replace(/\s+/g, ' '));
            return res.status(200).json({
                error:    'D-ATIS unavailable',
                detail:   'upstream returned a page but no ATIS section was recognised',
                station,
                bytes:    body.length,
                source:   'atis.guru',
                fetched:  Date.now(),
            });
        }

        // Compose a flat "raw" string for legacy renderers / quick copy-paste,
        // but always send the structured fields too so the frontend can lay it
        // out properly (arrival letter badge + departure letter badge).
        const flat = [];
        if (parsed.arrival)   flat.push(`ARRIVAL ATIS ${parsed.arrival.letter || ''}\n${parsed.arrival.text}`.trim());
        if (parsed.departure) flat.push(`DEPARTURE ATIS ${parsed.departure.letter || ''}\n${parsed.departure.text}`.trim());
        if (parsed.single)    flat.push(parsed.single.text);

        // The primary "letter" exposed at the top level is the arrival letter
        // (what most pilots want to know first), falling back to departure or
        // the single-broadcast letter.
        const primaryLetter =
            parsed.arrival?.letter ||
            parsed.single?.letter  ||
            parsed.departure?.letter ||
            null;

        return res.status(200).json({
            station,
            letter:    primaryLetter,
            issued:    parsed.arrival?.issued || parsed.departure?.issued || null,
            arrival:   parsed.arrival   || null,
            departure: parsed.departure || null,
            single:    parsed.single    || null,
            raw:       flat.join('\n\n'),
            source:    'atis.guru',
            fetched:   Date.now(),
        });
    } catch(err) {
        clearTimeout(tId);
        const msg = err.name === 'AbortError' ? 'upstream timeout' : (err.message || 'upstream error');
        console.warn(`[ATIS] ${station} failed:`, msg);
        return res.status(200).json({
            error:   'D-ATIS unavailable',
            station,
            detail:  msg,
            source:  'atis.guru',
            fetched: Date.now(),
        });
    }
}
