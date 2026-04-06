# METAR GO

<div align="center">
  <img src="https://raw.githubusercontent.com/vincent6786/Notion_metar_advanced/main/app-icon.png" alt="METAR GO Logo" width="120"/>
  
  ### Training Edition · v4.7.12
  
  **Aviation Weather Viewer & Electronic Flight Bag**
  
  A Progressive Web App for pilots — real-time METAR/TAF, runway wind analysis, SIGMET/AIRMET, live ATC audio, and a full suite of 12 aviation tools. Built for student pilots and flight training.
</div>

---

## 📋 Overview

METAR GO is a mobile-first aviation weather app built entirely in vanilla JS/HTML/CSS and deployed as a PWA on Vercel. It fetches live weather from multiple sources, decodes and visualises it for quick cockpit decision-making, and bundles 12 aviation tools in an overlay panel. All settings — favorites, theme, personal minimums, resources — sync across devices via PIN-based cloud backup.

Primary coverage airports: **RCTP, RCSS** (Taiwan), plus airports in Japan, Korea, Hong Kong, and **KMHR** (US training base).

---

## ✨ Features

### 🌤️ Weather Data
- **METAR & TAF** from AVWX with 9-key round-robin rotation and 10-minute client-side caching
- **24-hour meteogram** from Open-Meteo — temperature, dewpoint, wind arrows, weather icons
- **Open-Meteo Location Detail panel** — tap **+ MORE** next to the Advisory badge for visibility, cloud cover, humidity, CAPE (convective risk), precipitation, and FL340 jet-stream winds
- **Winds Aloft** table — 925 / 850 / 700 / 500 hPa pressure-level data from Open-Meteo with ISA deviation
- **NOTAMs** — colour-coded Critical / Caution / Info from aviationweather.gov
- **SIGMET / AIRMET** — US data from AWC; non-US airports link to the relevant national authority with checked-at timestamps and manual refresh
- **Flight category badges** — VFR / MVFR / IFR / LIFR with tap-to-open legend
- **Trend indicators** — ↗ ↘ → comparing current reading against ~1 hour ago for wind, visibility, and ceiling
- **Ceiling card** — correctly identifies the actual ceiling layer (BKN/OVC/VV), not just the lowest cloud entry
- **Raw METAR highlights** — gusts (red), low visibility (purple), thunderstorm/heavy precip (orange)
- **SPECI / COR badge** — animated badge on special or corrected observations

### 🛫 Runway & Wind Analysis
- **Interactive wind rose** — headwind (green) / tailwind (red) relative to selected runway; auto-picks optimal headwind runway by evaluating both ends of every runway pair
- **Runway wind components** — headwind/tailwind and crosswind for every runway; ⚠ LIMIT badge when personal crosswind limit is exceeded
- **Magnetic variation** — from AVWX station record
- **Sky cover visualisation** — animated cloud icons scaled to coverage (FEW → OVC), sorted by altitude

### 📡 ATC & Communications
- **Live ATC audio** — in-app streams for RCTP (5), RCSS (3), and other Taiwan airports via TWATC.net; LiveATC.net search for all others
- **CRAFT clearance scratchpad** — auto-saves between sessions
- **Airport frequencies** — three-layer fallback: built-in DB (8,341 airports from OurAirports) → AVWX → aviationweather.gov
- **ATIS/AWOS phone numbers** — built-in for Taiwan airports; AirNav link for others
- **Emergency squawk codes** — always-visible quick reference (7700, 7600, 7500, 1200, 2000)
- **US airport resources** — AirNav, iFlightPlanner (Sectional + IFR Low), 1800wxbrief links auto-update per ICAO

### ℹ️ Info Tab
- **Pressure Altitude, Density Altitude, ISA Deviation** cards with tap-to-detail formula breakdowns (×30 ft/hPa, ×120 ft/°C)
- **Sunrise / Sunset** — NOAA algorithm, tap to toggle UTC ↔ local
- **Relative Humidity** — orange (< 30% dry), blue (> 80% humid), fog risk indicator

### 🛠 Aviation Tools (12 tools in overlay panel)

| Tool | Description |
|------|-------------|
| **Unit Converter** | 10 categories — distance, altitude, speed, temp, pressure, fuel volume, weight, fuel flow, energy, power |
| **E6B Flight Computer** | Density altitude, TAS, cloud base, freezing level from indicated altitude / IAS / QNH / OAT / dewpoint |
| **METAR Decoder** | In-app field-by-field METAR decoder via e6bx.com; auto-fills from the currently loaded airport |
| **Great Circle Distance** | Two ICAO codes → great circle distance + initial track bearing with Leaflet map |
| **Crosswind Calculator** | Visual compass (drag) + type-in mode; headwind/tailwind + crosswind with gust components |
| **VFR Airspace Minimums** | Quick-reference card — visibility and cloud clearance by FAA airspace class (B/C/D/E/G) |
| **Weather Terms** | Searchable METAR weather codes, intensity prefixes, descriptors, wind barb SVG examples |
| **Abbreviations** | Searchable dictionary — ICAO/FAA/general aviation acronyms (~1,496 entries) |
| **My Resources** | Personal reference library — save custom links, notes up to 20 items, cloud-synced |
| **Morse Code Trainer** | Learn, Listen, Quiz, Words modes — includes VOR idents (TPE, LAX, SFO…), adjustable WPM |
| **E6B Trainer** | Interactive UND E6B simulator — wind correction, fuel burn, time/distance |
| **Training Area** | 6-topic 1:60 Rule & Wind Triangle trainer with REF / CALC / EXAMPLES / QUIZ modes |

#### Training Area Topics
| Topic | Content |
|-------|---------|
| **Course Correction** | Track Error (TE), Closing Angle (CA), Direct-to-Waypoint (TE+CA), Double Track Error |
| **Wind Correction** | CWC / LWC with sine shortcuts, WCA formula, ground speed estimation |
| **Top of Descent** | TOD distance (ΔAlt ÷ 300 for 3°), height-at-range glideslope checks |
| **Rate of Descent** | V/S from FPA (GS × 5 shortcut), gradient → V/S, constant-rate descent planning |
| **Wind Triangle** | Vector solver in 3 modes: Find TH/GS, Find TT/GS, Find Wind; live canvas visualisation + variation → MH/MC |
| **Altitude** | PA (field elevation + QNH correction), True Altitude (0.4%/°C air column), Density Altitude (PA + ISA dev × 120 ft/°C) |

### 🎨 Themes
Six app-wide themes — selection persists and syncs to cloud backup:

| Theme | Style |
|-------|-------|
| **Default** | Dark (#000 background, blue accent) |
| **Cockpit Night** | Monochrome red-on-black for night vision preservation |
| **Sectional (VFR)** | Warm parchment tones inspired by FAA Sectional Charts |
| **IFR Enroute** | Deep navy inspired by IFR Low Altitude Enroute Charts |
| **Phosphor (CRT)** | Green-on-black retro terminal with text glow |
| **High Contrast** | Maximum readability — white-on-black, 2px borders |

### 📊 Multi-Airport Dashboard
- Track up to 8 airports simultaneously with auto-refresh every 5 minutes
- Two card styles: **Raw** (highlighted METAR string) or **Detailed** (decoded wind, vis, cloud, temp, pressure, RH, TAF badge)
- IATA-to-ICAO auto-resolution (e.g. JFK → KJFK)
- Tap any card to load full data; drag handles to reorder
- Cloud-synced airport list

### 🌍 World Clock
- Live local times with UTC offset for any ICAO code
- Timezone auto-resolved from coordinates
- Optional cloud sync of city list

### ⚙️ Settings & Cloud Backup
- **PIN-based cloud sync** (4–6 digits) via Upstash Redis — no account needed
- Synced keys: favorites, default airport, preferred runway, theme, personal minimums, multi-airport list, world clock cities, unit preferences, My Resources
- **IndexedDB + localStorage dual persistence** with iOS purge recovery and 23-hour keep-alive (single timer, no stacking)
- **Per-user access codes** with admin panel (in-app + admin.html)
- **Per-IP rate limiting** on PIN attempts and weather API calls

### 👥 Admin Panel (admin.html + in-app)
- Live user search by name or code
- Status filter chips — All / Active / Revoked with live counts
- Sort by Code, Name, Most Calls, Newest
- API key usage dashboard with per-key progress bars
- Tool visibility toggles — hide/show tools per-deployment
- User drawer: edit name, copy invite message, revoke/restore/delete with proper error handling

### 📱 Progressive Web App
- **Service worker** with static asset precaching and network-first API cache (all 6 API routes correctly routed)
- **Swipe navigation** between tabs with gesture lock (distinguishes horizontal swipe from vertical scroll)
- **Safe area support** — notch, home indicator, landscape insets
- **Offline mode** — cached data served with age badge and retry banner
- **Auto-refresh** — 10-minute interval + `visibilitychange` refresh on app reopen (force-refresh if > 1hr stale)

### 🔄 Personal Minimums & GO/NO-GO
- Four profiles: **SOLO**, **DUAL**, **CUSTOM**, **KMHR**
- Crosswind, ceiling, and visibility limits per profile
- Live GO ✅ / NO-GO ⛔ check against current METAR
- Optional red NO-GO banner at top of screen

---

## 🛠️ Technology Stack

### Frontend
- **Vanilla JS / HTML5 / CSS3** — zero framework dependencies
- **Canvas API** — wind rose, crosswind compass, meteogram, wind triangle visualisation
- **Leaflet.js** — Great Circle distance map
- **Web Audio API** — Morse code trainer tones
- **CSS custom properties** — theme engine (`:root` variables overridden per theme class)
- **IndexedDB + localStorage** — dual-layer client persistence

### Backend (Serverless on Vercel)
- **Node.js** serverless functions (7 API routes)
- **Upstash Redis** — cloud settings, API key rotation pointer, rate limiting, API stats, access code registry

### Data Sources

| Source | Data |
|--------|------|
| **AVWX API** (9 free-tier keys, round-robin) | METAR, TAF, station info, frequencies, nearby stations |
| **Open-Meteo** | 24h meteogram, pressure-level winds aloft |
| **aviationweather.gov** | NOTAMs, SIGMET/AIRMET, frequency fallback |
| **OurAirports CSV** | Built-in frequency database (8,341 airports, ~24,913 entries) |
| **TWATC.net** | Live ATC audio streams (Taiwan) |

### Automation
- **bump.js** + GitHub Actions (`bump-version.yml`) — git tag triggers version bump across `index.html`, `sw.js`, `core.js` and auto-commits to main

---

## 📁 Project Structure

```
metar-go/
├── index.html                # Main application (single-page)
├── styles.css                # Global styles + 6 theme definitions
├── manifest.json             # PWA manifest
├── sw.js                     # Service worker (precache + API cache, all 7 routes)
├── maintenance.html          # Maintenance mode landing page
├── admin.html                # Standalone admin panel (search, filter, sort)
│
├── init.js                   # Boot sequence, launch screen flash prevention
├── core.js                   # Storage, cloud sync, weather parsing, display, admin panel
├── app.js                    # UI logic, tabs, themes, minimums, dashboard, swipe nav
├── tools-extension.js        # 12-tool overlay system
├── gc-tools-extension_patch.js  # Great Circle tool Leaflet patch
│
├── airport-db.js             # Airport coordinate/runway database
├── airportfrequencies.js     # Frequency database (8,341 airports, ~24,913 entries)
├── metar-db.js               # METAR abbreviations (~1,496 entries)
│
├── weather.js                # API: weather proxy + AVWX key rotation
├── settings.js               # API: cloud settings CRUD + registry
├── access.js                 # API: access code validation + admin actions
├── awos.js                   # API: AWOS data proxy (KMHR)
├── api-stats.js              # API: daily usage stats per key
├── status.js                 # API: health check
├── stream.js                 # API: ATC audio stream proxy
│
├── bump.js                   # Version bump automation script
├── package.json              # Dependencies (@upstash/redis)
└── vercel.json               # Route rewrites for API endpoints
```

> **Note:** Image assets (`app-icon.png`, `plane.png`) must use `raw.githubusercontent.com` URLs in production — local paths break on deployed Vercel builds.

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Vercel account
- Upstash Redis database
- At least 1 AVWX API key (supports up to 9)

### Environment Variables (Vercel)

```env
# Upstash Redis
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# AVWX API keys (round-robin, 1–9)
AVWX_KEY_1=...
AVWX_KEY_2=...
# ... up to AVWX_KEY_9
AVWX_DAILY_LIMIT=4000   # per-key daily cap

# Access control
ACCESS_GATE_ENABLED=true
ADMIN_ACCESS_CODE=...
ADMIN_PASSCODE=...
IP_HOURLY_LIMIT=200
VALIDATE_HOURLY_LIMIT=60

# CORS
ALLOWED_ORIGIN=https://your-domain.vercel.app

# Maintenance mode (optional)
MAINTENANCE_MODE=false
MAINTENANCE_BYPASS_KEY=...
```

### Local Development

```bash
git clone <repo-url>
cd metar-go
npm install
npx vercel dev    # runs at http://localhost:3000
```

### Deploy & Version Bump

```bash
git add -A && git commit -m "feat: description of changes"
git push origin main
git tag v4.5.0 && git push origin v4.5.0   # triggers bump.js via GitHub Actions
```

The GitHub Action (`bump-version.yml`) updates the version strings in `index.html` (×4), `core.js`, and `sw.js` automatically, then commits back to main.

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/weather?station=RCTP&type=metar` | GET | METAR / TAF / station / nearby / search via AVWX |
| `/api/settings?pin=1234` | GET | Restore all cloud settings for a PIN |
| `/api/settings` | POST | Save a single setting `{pin, key, value}` |
| `/api/settings?pin=1234` | DELETE | Delete all cloud data for a PIN |
| `/api/access` | POST | Validate / create / list / update / revoke / delete access codes |
| `/api/awos` | GET | KMHR AWOS data |
| `/api/api-stats` | POST | Daily AVWX key usage stats (admin password required) |
| `/api/status` | GET | Health check + key availability |
| `/api/stream` | GET | ATC audio stream proxy |

---

## 📝 Changelog

### v4.7.12 — Runway Fix & Open-Meteo Detail Panel
- **Fix:** Runway auto-selection now evaluates **both ends** of every runway pair. Previously only `ident1` was scored, which could result in selecting a tailwind runway when the opposite end had a clear headwind advantage. The cosine headwind calculation now runs for both `ident1` and `ident2`, and the higher-scoring end is selected.
- **Feature:** **Open-Meteo Location Detail panel** — a `+ MORE` button appears next to the `⚠️ ADVISORY only` badge on the 24H Trend. Tapping opens a bottom-sheet showing the current-hour model snapshot: estimated visibility (SM), cloud cover (%), relative humidity (%), CAPE with colour-coded convective risk (amber >500 J/kg, red >1,000 J/kg), precipitation rate (mm/h), and FL340 jet-stream wind & temperature.
- Expanded Open-Meteo API request to fetch `relative_humidity_2m`, `cloud_cover`, `cape`, `precipitation`, `visibility`, `windspeed_250hPa`, `winddirection_250hPa`, `temperature_250hPa` alongside existing data — single API call, no additional network requests.

### v4.5.0 — Bug Fix & Admin Overhaul
- **Fix:** Ceiling card (`mCeil`) now correctly shows the actual ceiling layer (BKN/OVC/VV) instead of always defaulting to the lowest cloud entry
- **Fix:** Service worker now correctly routes `/api/access` and `/api/api-stats` through network-first strategy (was treated as static asset cache — could serve stale validation responses)
- **Fix:** `Storage._startKeepAlive()` no longer stacks intervals on repeated `setMode()` calls
- **Fix:** In-app admin `drawerToggleStatus` and `drawerDelete` now check API response before closing — previously silently succeeded even on server errors
- **Fix:** `secureFetch` client cache threshold aligned to 10 min (was 5 min, comment said 10 min — every auto-refresh was a wasted network call)
- **Fix:** Training Area — Ceiling calculator uses field elevation for Pressure Altitude (was incorrectly using indicated altitude when both were entered)
- **Fix:** Training Area — Quiz score now resets on topic switch; quiz mode entry always shows "Start Quiz" fresh
- **Fix:** Training Area — Wind example corrected: 360°−220°=**140°**, not 40°
- **Fix:** Training Area — Sine shortcut range corrected to 20°–80° (formula breaks down at 10°)
- **Improvement:** Training Area quiz — Enter key submits answer; correct answers auto-advance after 1.4s
- **Improvement:** Admin panel (`admin.html`) — live search, status filter chips, sort controls, user count badge, hot-call highlighting
- **Improvement:** `renderHistory` slice cap fixed 6→5 to match `addToHistory` max

### v4.4.0 — My Resources + METAR Decoder
- My Resources tool — save links and notes, cloud-synced, up to 20 items
- METAR Decoder powered by e6bx.com with auto-fill from loaded airport

### v4.3.x — Training Area
- Training Area tool with 6 topics (Course, Wind, TOD, ROD, Wind Triangle, Altitude)
- REF / CALC / EXAMPLES / QUIZ modes per topic
- Wind triangle canvas visualisation with 3 solve modes

### v4.2.x — Theme System
- Six CSS themes with cloud backup via `efb_theme`
- Admin tool visibility system via Redis `efb:config:hidden_tools`

---

## ⚠️ Known Constraints & Design Decisions

- **AVWX free-tier keys** — the app rotates across up to 9 keys and falls back to local databases where possible. When all keys are exhausted, weather data is unavailable until midnight UTC reset.
- **iOS Safari canvas** — discards draws on `display:none` elements; wind rose and meteogram canvas components use a 50–80ms deferred redraw after tab switches.
- **`position:fixed` inside `display:none` parents** — formula modals are direct children of `<body>` to avoid this.
- **Service worker cache versioning** — `CACHE_VERSION` in `sw.js`, `APP_VERSION` in `index.html`, and `version` in `core.js` WHATS_NEW must stay in sync. `bump.js` automates this on git tag.
- **Cloud restore on `online` event** — currently restores cloud settings on network reconnect. If local changes were made while offline, this may overwrite them. Mitigation: guard with time-since-last-load check before calling `cloudRestoreAll()`.

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🙏 Acknowledgments

- **[AVWX](https://avwx.rest)** — Aviation weather data API
- **[Open-Meteo](https://open-meteo.com)** — Open-source NWP model data
- **[aviationweather.gov](https://aviationweather.gov)** — FAA/NOAA NOTAMs, SIGMET/AIRMET, frequencies
- **[TWATC.net](https://twatc.net)** — Taiwan ATC live audio streams
- **[LiveATC.net](https://www.liveatc.net)** — Global ATC audio
- **[OurAirports](https://ourairports.com)** — Airport frequency CSV data
- **[Upstash](https://upstash.com)** — Serverless Redis
- **[Vercel](https://vercel.com)** — Hosting and serverless functions
- **[Leaflet](https://leafletjs.com)** — Interactive maps
- **[UND](https://www.und.edu)** — E6B Trainer simulator
- **[e6bx.com](https://e6bx.com)** — METAR Decoder

---

<div align="center">
  
  **Built with ☁️ for pilots, by pilots**
  
  *Safe flights and clear skies!*
  
</div>
