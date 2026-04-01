// ================================================================
// METAR GO — NOTAM Proxy API
// GET /api/notam?station=KMHR
//
// Routes by ICAO prefix:
//   K / P (US airspace) → notams.aim.faa.gov (official FAA, most complete)
//   All others          → aviationweather.gov (international fallback)
//
// Normalises both sources to the same shape so renderNotams() in
// core.js doesn't need to know which source was used.
// ================================================================

function setCors(res) {
    const allowed = process.env.ALLOWED_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowed || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-code');
    if (allowed) res.setHeader('Vary', 'Origin');
}

function isUSAirspace(icao) {
    const c = (icao || '').charAt(0).toUpperCase();
    return c === 'K' || c === 'P';
}

// ── Fetch from notams.aim.faa.gov (US airports) ──────────────────
async function fetchFromAIM(icao) {
    const body = new URLSearchParams({
        icaoLocation:         icao,
        notamType:            'N',
        radiusSearchEnabled:  'false',
        latitudeDirection:    'N',
        longitudeDirection:   'W',
        latitudeDegrees:      '',
        latitudeMinutes:      '',
        latitudeSeconds:      '',
        longitudeDegrees:     '',
        longitudeMinutes:     '',
        longitudeSeconds:     '',
        radius:               '100',
        expand:               'true',
        sortColumns:          '5 false,14 false,2 false,1 false',
        sortDirection:        'Asc',
        expandedNOTAMIds:     '',
        pageSize:             '50',
        offset:               '0',
        formatType:           'ICAO',
        showRouteNotams:      'false',
        publicPortalType:     'AIRAC',
    });

    const res = await fetch('https://notams.aim.faa.gov/notamSearch/search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
    });

    if (!res.ok) throw new Error(`AIM HTTP ${res.status}`);
    const data = await res.json();

    // notamList is the array; totalNotamCount is a top-level field
    const list = data.notamList || [];

    // Normalise to the same shape renderNotams() already handles
    return list.map(n => ({
        traditional:  n.icaoMessage || n.traditionalMessage || n.message || '',
        notamNumber:  n.notamNumber  || '',
        startDate:    n.startDate    || n.issueDate || '',
        endDate:      n.endDate      || '',
        icaoLocation: n.location     || icao,
        source:       'AIM',
    }));
}

// ── Fetch from aviationweather.gov (international fallback) ──────
async function fetchFromAWC(icao) {
    const url = `https://aviationweather.gov/api/data/notam?icaos=${icao}&format=json`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`AWC HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) return [];

    return data.map(n => ({
        traditional:  n.traditional || n.text || '',
        notamNumber:  n.notamNumber  || '',
        startDate:    n.startDate    || '',
        endDate:      n.endDate      || '',
        icaoLocation: n.icaoLocation || icao,
        source:       'AWC',
    }));
}

// ── Main handler ──────────────────────────────────────────────────
export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' });

    const raw  = (req.query.station || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    if (!raw || raw.length < 3)  return res.status(400).json({ error: 'station required (3-4 chars)' });

    try {
        let notams;
        if (isUSAirspace(raw)) {
            // Try AIM first; fall back to AWC on error
            try {
                notams = await fetchFromAIM(raw);
            } catch (aimErr) {
                console.warn(`[NOTAM] AIM failed for ${raw} (${aimErr.message}), falling back to AWC`);
                notams = await fetchFromAWC(raw);
            }
        } else {
            notams = await fetchFromAWC(raw);
        }

        // Light server-side cache hint — NOTAMs change infrequently
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        return res.status(200).json(notams);
    } catch (err) {
        console.error(`[NOTAM] Error for ${raw}:`, err.message);
        return res.status(502).json({ error: 'Failed to fetch NOTAMs', details: err.message });
    }
}
