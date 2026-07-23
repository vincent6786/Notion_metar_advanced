// ================================================================
// METAR GO — SIGMET / AIRMET Proxy API
// GET /api/sigmet?bbox=lon0,lat0,lon1,lat1
//
// Server-side proxy to aviationweather.gov (free, no API key). The browser
// used to hit AWC directly, which is CORS-exposed and — worse — a blocked or
// failed fetch was indistinguishable from "no active SIGMETs". Going through
// the serverless function removes the CORS surface and returns a real HTTP
// status the client can act on. Coverage is US airspace only (AWC airsigmet).
// ================================================================

function setCors(res) {
    const allowed = process.env.ALLOWED_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowed || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-code');
    if (allowed) res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' });

    // Validate bbox: exactly four finite numbers (lon0,lat0,lon1,lat1)
    const parts = (req.query.bbox || '').toString().split(',');
    if (parts.length !== 4 || parts.some(p => !Number.isFinite(parseFloat(p)))) {
        return res.status(400).json({ error: 'bbox required as lon0,lat0,lon1,lat1' });
    }
    const bbox = parts.map(p => parseFloat(p).toFixed(2)).join(',');

    try {
        const url = `https://aviationweather.gov/api/data/airsigmet?format=json&bbox=${encodeURIComponent(bbox)}`;
        const awc = await fetch(url);
        if (!awc.ok) throw new Error(`AWC HTTP ${awc.status}`);
        const data  = await awc.json();
        const items = Array.isArray(data) ? data : [];

        // Light server-side cache — SIGMET/AIRMET data changes slowly
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        return res.status(200).json(items);
    } catch (err) {
        console.error('[SIGMET] Error:', err.message);
        return res.status(502).json({ error: 'Failed to fetch SIGMET/AIRMET', details: err.message });
    }
}
