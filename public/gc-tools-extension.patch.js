/**
 * GREAT CIRCLE DISTANCE CALCULATOR — tools-extension.js patch
 *
 * HOW TO INTEGRATE:
 *
 * 1. Find the existing `calculateGreatCircle()` function (~line 603) and
 *    replace it (and the surrounding comment block) with this entire file's
 *    content.
 *
 * 2. In `openTool()`, add one branch to the tool-init block (after the
 *    e6b-trainer branch, around line 358):
 *
 *      } else if (toolName === 'great-circle') {
 *          gcInitMap();
 *      }
 *
 * 3. Add the gcMapInstance / gcArcLayer / gcMarkers declarations near the
 *    top of the file (after toolsExtensionState block, ~line 15):
 *
 *      let gcMapInstance  = null;
 *      let gcArcLayer     = null;
 *      let gcFromMarker   = null;
 *      let gcToMarker     = null;
 */

// ============================================================================
// GREAT CIRCLE — Global state  (paste near top of file)
// ============================================================================

let gcMapInstance  = null;   // Leaflet map instance
let gcArcLayer     = null;   // Polyline layer for the great circle arc
let gcFromMarker   = null;   // Departure marker
let gcToMarker     = null;   // Destination marker


// ============================================================================
// GREAT CIRCLE — Input helpers
// ============================================================================

/**
 * Real-time ICAO/IATA/coord resolver — shows airport name under each input.
 * Called via oninput on the gc-from / gc-to fields.
 */
function gcResolveInput(inputId, nameId) {
    const inputEl = document.getElementById(inputId);
    const nameEl  = document.getElementById(nameId);
    if (!inputEl || !nameEl) return;

    // Force uppercase on ICAO/IATA inputs (not needed for coordinate strings)
    const raw = inputEl.value;
    const val = raw.trim();

    // Check if it looks like coordinates — don't uppercase those
    const looksLikeCoords = /^-?\d/.test(val);
    if (!looksLikeCoords) inputEl.value = raw.toUpperCase();

    if (!val) {
        nameEl.textContent = '';
        return;
    }

    // Try coordinate parse
    const coordMatch = val.match(/^(-?\d{1,3}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
    if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lon = parseFloat(coordMatch[2]);
        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            nameEl.textContent = '✓ Coordinates';
            nameEl.style.color = 'var(--success)';
            return;
        }
    }

    // Try airport lookup (needs 3+ chars)
    if (val.length >= 3) {
        const airport = lookupAirport(val.toUpperCase());
        if (airport && airport.name) {
            const tag = airport.icao ? ` (${airport.icao})` : (airport.iata ? ` (${airport.iata})` : '');
            nameEl.textContent = `✓ ${airport.name}${tag}`;
            nameEl.style.color = 'var(--success)';
        } else {
            nameEl.textContent = val.length >= 3 ? '✗ Not found' : '';
            nameEl.style.color = '#ff453a';
        }
    } else {
        nameEl.textContent = '';
    }
}

/**
 * Swap FROM and TO inputs (including their resolved name labels).
 */
function gcSwap() {
    const fromEl = document.getElementById('gc-from');
    const toEl   = document.getElementById('gc-to');
    if (!fromEl || !toEl) return;

    const tmp    = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value   = tmp;

    gcResolveInput('gc-from', 'gc-from-name');
    gcResolveInput('gc-to',   'gc-to-name');
}


// ============================================================================
// GREAT CIRCLE — Core calculation
// ============================================================================

function calculateGreatCircle() {
    const fromRaw = (document.getElementById('gc-from')?.value || '').trim();
    const toRaw   = (document.getElementById('gc-to')?.value   || '').trim();

    // ── Show/hide error banner helper ────────────────────────────────────────
    const showError = (msg) => {
        const el = document.getElementById('gc-error');
        if (el) { el.textContent = msg; el.style.display = 'block'; }
        const res = document.getElementById('gc-result');
        if (res) res.style.display = 'none';
    };
    const hideError = () => {
        const el = document.getElementById('gc-error');
        if (el) el.style.display = 'none';
    };

    if (!fromRaw || !toRaw) {
        showError('Enter departure and destination airports or coordinates.');
        return;
    }

    const from = lookupAirport(fromRaw);
    const to   = lookupAirport(toRaw);

    if (!from) { showError(`Could not find airport or parse coordinates: "${fromRaw}"`); return; }
    if (!to)   { showError(`Could not find airport or parse coordinates: "${toRaw}"`);   return; }

    hideError();

    // ── Haversine distance ───────────────────────────────────────────────────
    const R    = 6371.0;  // Earth radius km
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat   * Math.PI / 180;
    const lon1 = from.lon * Math.PI / 180;
    const lon2 = to.lon   * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));  // angular distance (radians)

    const distKm = R * c;
    const distNM = distKm / 1.852;
    const distMi = distKm / 1.60934;

    // ── Initial true bearing (departure) ────────────────────────────────────
    const y1  = Math.sin(dLon) * Math.cos(lat2);
    const x1  = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const initialBearing = (Math.atan2(y1, x1) * 180 / Math.PI + 360) % 360;

    // ── Final true bearing (arrival heading) ────────────────────────────────
    // = reverse bearing from destination back to origin, flipped 180°
    const y2  = Math.sin(-dLon) * Math.cos(lat1);
    const x2  = Math.cos(lat2)  * Math.sin(lat1) - Math.sin(lat2) * Math.cos(lat1) * Math.cos(-dLon);
    const finalBearing = (Math.atan2(y2, x2) * 180 / Math.PI + 360) % 360;

    // ── Update result cards ─────────────────────────────────────────────────
    const fmt = (n, decimals = 0) => n.toLocaleString('en-US', { maximumFractionDigits: decimals });

    document.getElementById('gc-nm').textContent      = fmt(distNM, 1);
    document.getElementById('gc-km').textContent      = fmt(distKm, 1);
    document.getElementById('gc-mi').textContent      = fmt(distMi, 1);
    document.getElementById('gc-initial').textContent = fmt(initialBearing, 1) + '°';
    document.getElementById('gc-final').textContent   = fmt(finalBearing,   1) + '°';

    // Route label
    const fromLabel = from.icao || from.iata || `${from.lat.toFixed(2)},${from.lon.toFixed(2)}`;
    const toLabel   = to.icao   || to.iata   || `${to.lat.toFixed(2)},${to.lon.toFixed(2)}`;
    const routeEl   = document.getElementById('gc-route-label');
    if (routeEl) routeEl.textContent = `${fromLabel} → ${toLabel}  ·  ${fmt(distNM, 1)} NM  ·  Initial track ${fmt(initialBearing, 1)}°T`;

    // ── Show results panel, then render map ─────────────────────────────────
    const resultEl = document.getElementById('gc-result');
    if (resultEl) resultEl.style.display = 'block';

    // Slight delay so the div is fully visible before Leaflet measures it
    setTimeout(() => gcRenderMap(from, to, lat1, lon1, lat2, lon2, c), 60);
}


// ============================================================================
// GREAT CIRCLE — Leaflet map
// ============================================================================

/**
 * Initialize the Leaflet map on first use.
 * Called from openTool('great-circle') so the container is visible.
 */
function gcInitMap() {
    if (gcMapInstance) {
        // Map already exists — just re-measure the container size
        setTimeout(() => gcMapInstance.invalidateSize(), 80);
        return;
    }
    const el = document.getElementById('gc-map');
    if (!el) return;

    gcMapInstance = L.map('gc-map', {
        center:             [20, 100],
        zoom:               2,
        zoomControl:        true,
        attributionControl: true,
        worldCopyJump:      true
    });

    // CartoDB Dark Matter — fits the app's dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains:  'abcd',
        maxZoom:     18
    }).addTo(gcMapInstance);
}

/**
 * Compute 100 intermediate points along the great circle arc using
 * spherical linear interpolation (SLERP). Handles antimeridian crossing
 * by ensuring no two consecutive longitudes jump by more than 180°.
 */
function gcComputeArcPoints(lat1, lon1, lat2, lon2, angDist, n) {
    n = n || 100;
    const pts = [];
    const sinD = Math.sin(angDist);

    if (sinD < 1e-10) {
        // Points are coincident or antipodal — straight line
        pts.push([lat1 * 180 / Math.PI, lon1 * 180 / Math.PI]);
        pts.push([lat2 * 180 / Math.PI, lon2 * 180 / Math.PI]);
        return pts;
    }

    for (let i = 0; i <= n; i++) {
        const f = i / n;
        const A = Math.sin((1 - f) * angDist) / sinD;
        const B = Math.sin(f        * angDist) / sinD;
        const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
        const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
        const z = A * Math.sin(lat1)                  + B * Math.sin(lat2);
        pts.push([
            Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI,
            Math.atan2(y, x)                          * 180 / Math.PI
        ]);
    }

    // Unwrap longitude to prevent antimeridian zig-zag in Leaflet
    for (let i = 1; i < pts.length; i++) {
        let diff = pts[i][1] - pts[i - 1][1];
        if (diff >  180) pts[i][1] -= 360;
        if (diff < -180) pts[i][1] += 360;
    }

    return pts;
}

/**
 * Draw (or redraw) the great circle arc and airport markers on the map.
 */
function gcRenderMap(from, to, lat1r, lon1r, lat2r, lon2r, angDist) {
    gcInitMap();  // no-op if already initialized
    if (!gcMapInstance) return;

    // Clear previous layers
    if (gcArcLayer)   { gcMapInstance.removeLayer(gcArcLayer);   gcArcLayer   = null; }
    if (gcFromMarker) { gcMapInstance.removeLayer(gcFromMarker); gcFromMarker = null; }
    if (gcToMarker)   { gcMapInstance.removeLayer(gcToMarker);   gcToMarker   = null; }

    gcMapInstance.invalidateSize();

    // ── Draw arc ─────────────────────────────────────────────────────────────
    const arcPts = gcComputeArcPoints(lat1r, lon1r, lat2r, lon2r, angDist);

    gcArcLayer = L.polyline(arcPts, {
        color:   '#0a84ff',
        weight:  2.5,
        opacity: 0.9,
        dashArray: null
    }).addTo(gcMapInstance);

    // ── Custom dot icons ─────────────────────────────────────────────────────
    const makeIcon = (color) => L.divIcon({
        className: '',
        html: `<div style="
            width:12px; height:12px;
            background:${color};
            border:2.5px solid #fff;
            border-radius:50%;
            box-shadow:0 0 4px rgba(0,0,0,0.6);
        "></div>`,
        iconSize:   [12, 12],
        iconAnchor: [6, 6]
    });

    const fromLabel = from.name || `${from.lat.toFixed(4)}, ${from.lon.toFixed(4)}`;
    const toLabel   = to.name   || `${to.lat.toFixed(4)}, ${to.lon.toFixed(4)}`;

    gcFromMarker = L.marker([from.lat, from.lon], { icon: makeIcon('#0a84ff') })
        .addTo(gcMapInstance)
        .bindTooltip(fromLabel, { direction: 'top', offset: [0, -8] });

    gcToMarker = L.marker([to.lat, to.lon], { icon: makeIcon('#32d74b') })
        .addTo(gcMapInstance)
        .bindTooltip(toLabel, { direction: 'top', offset: [0, -8] });

    // ── Fit map to arc bounds ────────────────────────────────────────────────
    try {
        gcMapInstance.fitBounds(gcArcLayer.getBounds(), { padding: [30, 30], maxZoom: 8 });
    } catch (e) {
        gcMapInstance.setView([from.lat, from.lon], 4);
    }
}
