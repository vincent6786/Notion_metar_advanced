# METAR GO

<div align="center">
  <img src="appicon.png" alt="METAR GO Logo" width="120"/>
  
  ### Cloud Edition · v3.3.0
  
  **Aviation Weather & Electronic Flight Bag**
  
  A comprehensive web-based aviation weather application providing real-time METAR, TAF, and EFB tools for pilots.
</div>

---

## 📋 Overview

METAR GO is a modern, cloud-based aviation weather application designed specifically for pilots. It provides real-time weather information, runway analysis, wind calculations, and essential Electronic Flight Bag (EFB) tools in a sleek, mobile-optimized interface.

The application integrates with the AVWX API to fetch current aviation weather data and presents it in an intuitive, pilot-friendly format with visual aids like wind roses, runway diagrams, and flight category indicators.

---

## ✨ Features

### 🌤️ Weather Information
- **Real-time METAR & TAF**: Fetch current weather observations and terminal area forecasts
- **Flight Category Display**: VFR, MVFR, IFR, LIFR color-coded indicators
- **NOTAM Integration**: View current notices to airmen for selected airports
- **Nearby Stations**: GPS-based location services to find nearest airports
- **Weather History**: Track recent airport searches

### 🛫 Runway & Wind Analysis
- **Interactive Wind Rose**: Visual representation of wind direction and runway alignment
- **Runway Selector**: Smart runway selection based on current wind conditions
- **Crosswind Calculator**: Real-time crosswind and headwind component calculations
- **Magnetic Variation**: Automatic adjustment for magnetic declination
- **Runway Visualization**: Graphical runway display with wind overlay

### 🔧 EFB Tools
Comprehensive pilot tools accessible through an extensible tools system:
- Flight planning calculators
- Performance calculations
- Weight & balance tools
- Aviation references
- NO-GO check tools for safety minimums

### 📱 Mobile-First Design
- **Progressive Web App**: Add to home screen on iOS/Android
- **Responsive Layout**: Optimized for all screen sizes
- **Offline Capability**: Basic functionality when network unavailable
- **Touch-Optimized**: Gesture-based navigation and controls
- **Safe Area Support**: Full iPhone notch and home indicator support

### ⚙️ Advanced Features
- **Cloud Sync**: Save and sync settings across devices with PIN protection
- **Dashboard Mode**: Consolidated weather view with enhanced visuals
- **AWOS/ASOS Integration**: Direct access to automated weather stations
- **Customizable Units**: Switch between metric and imperial measurements
- **Dark Mode**: Optimized for cockpit use with reduced eye strain
- **Time Display**: UTC with local time offset

---

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3**: Modern, semantic markup with CSS Grid and Flexbox
- **Vanilla JavaScript**: No framework dependencies for maximum performance
- **Canvas API**: Dynamic wind rose and runway visualizations
- **LocalStorage**: Client-side caching and preference storage

### Backend (Serverless)
- **Node.js**: Runtime environment
- **Vercel Serverless Functions**: API endpoints and proxy services
- **Upstash Redis**: Distributed KV store for settings sync and API rate limiting

### APIs & Services
- **AVWX REST API**: Aviation weather data (METAR, TAF, station info)
- **Geolocation API**: Browser-based position services
- **AWOS Network**: Automated weather observation stations

---

## 📁 Project Structure

```
metar-plus/
├── index.html              # Main application interface
├── styles.css              # Global styles and themes
├── maintenance.html        # Maintenance mode page
│
├── app.js                  # Core application logic
├── core.js                 # Weather parsing and display
├── init.js                 # Initialization and startup
├── tools-extension.js      # Modular EFB tools system
│
├── api/                    # Serverless functions
│   ├── weather.js         # Weather data proxy with API key rotation
│   ├── settings.js        # Cloud settings sync (GET/POST/DELETE)
│   ├── awos.js           # AWOS data proxy with styling
│   ├── api-stats.js      # API usage statistics
│   ├── status.js         # Service health check
│   └── stream.js         # Real-time data streaming
│
├── package.json           # Dependencies and metadata
├── vercel.json           # Deployment configuration
│
└── assets/
    ├── appicon.png       # Application icon
    └── plane.png         # UI graphics
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18.x or higher
- Vercel account (for deployment)
- Upstash Redis database
- AVWX API key(s)

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd metar-plus
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the project root:

```env
# Upstash Redis (for settings sync)
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_token

# AVWX API Keys (supports multiple for rotation)
AVWX_KEY_1=your_primary_api_key
AVWX_KEY_2=your_secondary_api_key
AVWX_KEY_3=your_tertiary_api_key
AVWX_KEY_4=your_quaternary_api_key

# API Rate Limiting
AVWX_DAILY_LIMIT=4000
```

4. **Run locally with Vercel CLI**
```bash
npx vercel dev
```

The application will be available at `http://localhost:3000`

---

## 🌐 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy to Vercel**
```bash
vercel
```

3. **Configure environment variables** in Vercel dashboard:
   - Go to your project settings
   - Add all environment variables from `.env`
   - Redeploy if needed

4. **Custom domain** (optional):
   - Add your domain in Vercel project settings
   - Update DNS records as instructed

---

## 🔌 API Endpoints

### Weather Data
```
GET /api/weather?station=KJFK&type=metar
GET /api/weather?station=KJFK&type=taf
GET /api/weather?station=KJFK&type=station
GET /api/weather?station=KJFK&type=notam
GET /api/weather?station=37.7749,-122.4194&type=near
GET /api/weather?station=kennedy&type=search
```

**Response includes metadata:**
```json
{
  "...weather data...",
  "_meta": {
    "key_used": 1,
    "key_usage": 245,
    "key_limit": 4000,
    "key_remaining": 3755
  }
}
```

### Settings Sync (Cloud Storage)
```
GET    /api/settings?pin=1234&key=theme
GET    /api/settings?pin=1234              # Get all settings
POST   /api/settings {pin, key, value}     # Save setting
DELETE /api/settings?pin=1234&key=theme    # Delete setting
DELETE /api/settings?pin=1234              # Delete all settings
```

### AWOS Data
```
GET /api/awos
```
Returns styled AWOS data from configured station (currently KMHR).

### Service Status
```
GET /api/status
```

### API Statistics
```
GET /api/api-stats
```

---

## 🎯 Usage

### Basic Workflow

1. **Search for an airport**
   - Enter ICAO code (e.g., KJFK) in search box
   - Or use GPS location button to find nearby airports

2. **View weather information**
   - METAR tab: Current observations
   - TAF tab: Forecast information
   - Dashboard: Combined view with enhanced visuals

3. **Analyze runway conditions**
   - Select runway from dropdown
   - View wind rose visualization
   - Check crosswind/headwind components

4. **Access EFB tools**
   - Navigate to Tools tab
   - Select tool from available options
   - Use full-screen mode for better visibility

5. **Sync settings** (optional)
   - Open settings panel
   - Create 4-6 digit PIN
   - Backup or restore settings across devices

### Keyboard Shortcuts
- `Enter` in search box: Load weather data
- Click time badge: Toggle UTC/Local time
- Click flight category badge: View legend

---

## ⚙️ Configuration

### API Key Rotation
The application implements intelligent API key rotation to maximize daily quotas:
- Automatically tracks usage per key
- Selects key with lowest usage
- Falls back to alternative keys on rate limit
- Marks exhausted keys for next day

### Customization Options
- **Units**: Metric / Imperial / Aviation standard
- **Time Display**: UTC or Local with offset
- **Dashboard Mode**: Enhanced vs. standard view
- **Runway Preferences**: Saved per airport
- **Theme**: Optimized dark mode for cockpit use

### LocalStorage Keys
```javascript
efb_recent_history      // Recent airport searches
efb_pref_rwy_<ICAO>    // Preferred runway per airport
efb_settings_pin        // Cloud sync PIN
efb_last_station        // Last searched station
```

---

## 🔒 Security & Privacy

- **PIN Protection**: 4-6 digit PIN for cloud settings sync
- **Client-Side First**: Sensitive preferences stored locally
- **No User Tracking**: No analytics or tracking scripts
- **Secure Storage**: Upstash Redis with encrypted connections
- **CORS Enabled**: API endpoints accessible from authorized origins

---

## 📊 Performance

- **Caching Strategy**: 
  - API responses cached for 2 minutes (`s-maxage=120`)
  - Stale-while-revalidate for optimal UX
  
- **Bundle Size**: 
  - No external frameworks
  - Optimized vanilla JavaScript
  - Minimal dependencies

- **Load Time**:
  - Launch screen with progressive loading
  - Lazy-loaded tool modules
  - Offline-first approach

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] METAR data loads correctly
- [ ] TAF data displays properly
- [ ] Wind rose renders accurately
- [ ] Runway selection works
- [ ] Crosswind calculations correct
- [ ] GPS location functional
- [ ] Cloud sync saves/restores
- [ ] Offline mode graceful
- [ ] PWA installable
- [ ] Mobile responsive

### API Rate Limit Testing
Monitor API usage through the stats endpoint:
```bash
curl https://your-domain.vercel.app/api/api-stats
```

---

## 🐛 Troubleshooting

### Common Issues

**Weather data not loading**
- Check API keys are configured in Vercel environment
- Verify station code is valid ICAO identifier
- Check browser console for errors
- Confirm API quota not exceeded

**GPS not working**
- Ensure HTTPS connection (required for geolocation)
- Check browser location permissions
- Try manual station entry as fallback

**Settings not syncing**
- Verify Upstash Redis credentials
- Check PIN is 4-6 digits
- Ensure network connectivity
- Clear browser cache and retry

**Wind rose not displaying**
- Verify station has runway data
- Check magnetic variation available
- Inspect canvas element in dev tools

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Additional EFB tools and calculators
- Enhanced weather visualizations
- Performance optimizations
- Accessibility improvements
- Internationalization (i18n)
- Unit tests and E2E testing

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🙏 Acknowledgments

- **AVWX**: Aviation weather data API
- **Upstash**: Serverless Redis database
- **Vercel**: Hosting and serverless functions
- **AWOS Network**: Automated weather stations

---

## 📞 Support

For issues, questions, or feature requests, please contact the development team.

---

<div align="center">
  
  **Built with ☁️ for pilots, by pilots**
  
  *Safe flights and clear skies!*
  
</div>
