# METAR GO

<div align="center">
  <img src="https://raw.githubusercontent.com/vincent6786/Notion_metar_advanced/main/app-icon.png" alt="METAR GO Logo" width="120"/>
  
  ### Theme Edition · v4.2.1
  
  **Aviation Weather Viewer & Electronic Flight Bag**
  
  A Progressive Web App for pilots — real-time METAR/TAF, runway wind analysis, SIGMET/AIRMET, live ATC audio, and a full suite of aviation tools. Built for student pilots and flight training.
</div>

---

## 📋 Overview

METAR GO is a mobile-first aviation weather app built entirely in vanilla JS/HTML/CSS and deployed as a PWA on Vercel. It fetches live weather from multiple sources, decodes and visualises it for quick cockpit decision-making, and bundles 9 aviation tools in an overlay panel. All settings — favorites, theme, personal minimums — sync across devices via PIN-based cloud backup.

Primary coverage airports: **RCTP, RCSS** (Taiwan), plus airports in Japan, Germany, the UK, and **KMHR** (US training base).

---

## ✨ Features

### 🌤️ Weather Data
- **METAR & TAF** from AVWX with 9-key round-robin rotation and 10-minute caching
- **24-hour meteogram** from Open-Meteo — temperature, dewpoint, wind arrows, weather icons (tap any hour column for detail)
- **Winds Aloft** table — 925 / 850 / 700 hPa pressure-level data from Open-Meteo
- **NOTAMs** — colour-coded Critical / Caution / Info from aviationweather.gov
- **SIGMET / AIRMET** — US data from AWC; non-US airports link to the relevant national authority with checked-at timestamps and manual refresh
- **Flight category badges** — VFR / MVFR / IFR / LIFR with tap-to-open legend
- **Trend indicators** — ↗ ↘ → comparing current reading against ~1 hour ago for wind, visibility, and ceiling
- **Raw METAR highlights** — gusts (red), low visibility (purple), thunderstorm/heavy precip (orange)

### 🛫 Runway & Wind Analysis
- **Interactive wind rose** — headwind (green) / tailwind (red) relative to selected runway; auto-picks optimal headwind runway
- **Runway wind components** — headwind/tailwind and crosswind for every runway; ⚠ LIMIT badge when personal crosswind limit is exceeded
- **Magnetic variation** — from AVWX station record with NOAA WMM API fallback
- **Sky cover visualisation** — animated cloud icons scaled to coverage (FEW → OVC), sorted by altitude

### 📡 ATC & Communications
- **Live ATC audio** — in-app streams for RCTP (5), RCSS (3), and other Taiwan airports via TWATC.net; LiveATC.net search for all others
- **Audio state preservation** across auto-refresh cycles
- **CRAFT clearance scratchpad** — auto-saves between sessions
- **Airport frequencies** — three-layer fallback: built-in DB (8,341 airports from OurAirports) → AVWX → aviationweather.gov
- **ATIS/AWOS phone numbers** — built-in for Taiwan airports; AirNav link for others
- **Emergency squawk codes** — always-visible quick reference (7700, 7600, 7500, 1200, 2000)
- **US airport resources** — AirNav, iFlightPlanner (Sectional + IFR Low), 1800wxbrief links auto-update per ICAO

### ℹ️ Info Tab
- **Pressure Altitude, Density Altitude, ISA Deviation** cards with tap-to-detail formula breakdowns (×30 ft/hPa, ×120 ft/°C)
- **Sunrise / Sunset** — NOAA algorithm, tap to toggle UTC ↔ local
- **Relative Humidity** — orange (< 30% dry), blue (> 80% humid), fog risk indicator

### 🛠 Aviation Tools (9 tools in overlay panel)
| Tool | Description |
|------|-------------|
| **Unit Converter** | 10 categories — distance, altitude, speed, temp, pressure, fuel volume, weight, fuel flow, energy, power |
| **E6B Flight Computer** | Density altitude, TAS, cloud base, freezing level from indicated altitude / IAS / QNH / OAT / dewpoint |
| **E6B Trainer** | Interactive UND simulator — wind correction, fuel burn, time/distance |
| **Great Circle Distance** | Enter two ICAO codes → great circle distance + initial track bearing with Leaflet map |
| **Crosswind Calculator** | Visual compass (drag) + type-in mode; headwind/tailwind + crosswind with gust components |
| **VFR Airspace Minimums** | Quick-reference card — visibility and cloud clearance by FAA airspace class |
| **Weather Terms** | Searchable METAR weather codes, intensity prefixes, descriptors, wind barb SVG examples |
| **Abbreviations** | Searchable dictionary — ICAO/FAA/general aviation acronyms (~1,496 entries from metar-db.js) |
| **Morse Code Trainer** | Learn, Listen, Quiz, Words modes — includes VOR idents (TPE, LAX, SFO…), adjustable WPM |

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
- Synced keys: favorites, default airport, preferred runway, theme, personal minimums, multi-airport list, world clock cities, unit preferences
- **IndexedDB + localStorage dual persistence** with iOS purge recovery and 23-hour keep-alive
- **Per-user access codes** with admin panel (in-app + admin.html)
- **Per-IP rate limiting** on PIN attempts

### 📱 Progressive Web App
- **Service worker** with static asset precaching and API cache fallback
- **Swipe navigation** between tabs with gesture lock (distinguishes horizontal swipe from vertical scroll)
- **Liquid glass mode** when launched from iOS home screen (backdrop blur + subtle gradients)
- **Safe area support** — notch, home indicator, landscape insets
- **Offline mode** — cached data served with age badge and retry banner

### 🔄 Personal Minimums & GO/NO-GO
- Four profiles: **SOLO**, **DUAL**, **CUSTOM**, **KMHR**
- Crosswind, ceiling, and visibility limits per profile
- Live GO ✅ / NO-GO ⛔ check against current METAR
- Optional red NO-GO banner at top of screen

---

## 🛠️ Technology Stack

### Frontend
- **Vanilla JS / HTML5 / CSS3** — zero framework dependencies
- **Canvas API** — wind rose, crosswind compass
- **Leaflet.js** — Great Circle distance map
- **CSS custom properties** — theme engine (`:root` variables overridden per theme class)
- **IndexedDB + localStorage** — dual-layer client persistence

### Backend (Serverless on Vercel)
- **Node.js** serverless functions (7 API routes)
- **Upstash Redis** — cloud settings, API key rotation pointer, rate limiting, API stats

### Data Sources
| Source | Data |
|--------|------|
| **AVWX API** (9 free-tier keys, round-robin) | METAR, TAF, station info, frequencies |
| **Open-Meteo** | 24h meteogram, pressure-level winds aloft |
| **aviationweather.gov** | NOTAMs, SIGMET/AIRMET, frequency fallback |
| **OurAirports CSV** | Built-in frequency database (8,341 airports) |
| **NOAA WMM API** | Magnetic variation fallback |
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
├── sw.js                     # Service worker (precache + API cache)
├── maintenance.html          # Maintenance mode landing page
├── admin.html                # Standalone admin panel
│
├── init.js                   # Boot sequence, launch screen
├── core.js                   # Storage, cloud sync, weather parsing, display
├── app.js                    # UI logic, tabs, themes, minimums, dashboard
├── tools-extension.js        # 9-tool overlay system (converter, E6B, crosswind…)
├── gc-tools-extension_patch.js  # Great Circle tool Leaflet patch
│
├── airport-db.js             # Airport coordinate/runway database
├── airportfrequencies.js     # Frequency database (8,341 airports)
├── metar-db.js               # METAR abbreviations (~1,496 entries)
│
├── weather.js                # API: weather proxy + AVWX key rotation
├── settings.js               # API: cloud settings CRUD + registry
├── access.js                 # API: access code validation + rate limiting
├── awos.js                   # API: AWOS data proxy (KMHR)
├── api-stats.js              # API: daily usage stats per key
├── status.js                 # API: health check
├── stream.js                 # API: ATC audio stream proxy
│
├── bump.js                   # Version bump automation script
├── package.json              # Dependencies (@upstash/redis)
├── vercel.json               # Route rewrites for API endpoints
│
├── plane.png                 # Wind rose aircraft icon
└── diamond.png               # UI decorative asset
```

> **Note:** Image assets (`app-icon.png`, `plane.png`, `diamond.png`) must use `raw.githubusercontent.com` URLs in production — local paths break on deployed builds.

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

# Access control
ACCESS_GATE_ENABLED=true
ADMIN_ACCESS_CODE=...
ADMIN_PASSCODE=...
IP_HOURLY_LIMIT=100

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
git add -A && git commit -m "v4.2.1 — theme system + help update"
git push origin main
git tag v4.2.1 && git push origin v4.2.1   # triggers bump.js via GitHub Actions
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/weather?station=RCTP&type=metar` | GET | METAR/TAF/station/NOTAM/nearby/search via AVWX |
| `/api/settings?pin=1234` | GET | Restore all cloud settings |
| `/api/settings` | POST | Save a single setting `{pin, key, value}` |
| `/api/settings?pin=1234` | DELETE | Delete all cloud data for PIN |
| `/api/access` | POST | Validate access code |
| `/api/awos` | GET | KMHR AWOS data |
| `/api/api-stats` | GET | Daily AVWX key usage (admin) |
| `/api/status` | GET | Health check |
| `/api/stream` | GET | ATC audio stream proxy |

---

## ⚠️ Known Constraints

- **AVWX free-tier keys fail frequently** — the app rotates across 9 keys and falls back to local databases where possible
- **iOS Safari discards canvas draws on `display:none` elements** — wind rose and canvas components initialise only when their tab is visible
- **`position:fixed` inside `display:none` parents** — all modals are direct children of `<body>`
- **Service worker cache versions** must stay in sync across `sw.js`, `core.js`, and `index.html` — `bump.js` automates this

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

---

<div align="center">
  
  **Built with ☁️ for pilots, by pilots**
  
  *Safe flights and clear skies!*
  
</div>
