/**
 * METAR GO - Tools Extension
 * Modular tools system for aviation calculations and references
 */

// ============================================================================
// TOOLS EXTENSION STATE & NAVIGATION
// ============================================================================

let toolsExtensionState = {
    isOpen: false,
    currentTool: null,
    previousTab: 'tools',
    isFullScreen: false
};

// Great Circle map state
let gcMapInstance  = null;
let gcArcLayer     = null;
let gcFromMarker   = null;
let gcToMarker     = null;

/**
 * Toggle full-screen mode (mobile optimization)
 */
function toggleFullScreen() {
    const panel = document.getElementById('tools-extension-panel');
    const header = document.querySelector('.header'); // Main app header
    const bottomNav = document.querySelector('.bottom-nav'); // Main app navigation
    const fullscreenBtn = document.getElementById('fullscreen-toggle');
    const fullscreenIcon = document.getElementById('fullscreen-icon');
    const extensionHeader = document.getElementById('tools-extension-header');
    const toolsMenu = document.getElementById('tools-menu');
    
    toolsExtensionState.isFullScreen = !toolsExtensionState.isFullScreen;
    
    if (toolsExtensionState.isFullScreen) {
        // Enter full-screen mode
        document.body.classList.add('fullscreen-mode');
        
        if (panel) {
            panel.style.position = 'fixed';
            panel.style.top = '0';
            panel.style.left = '0';
            panel.style.right = '0';
            panel.style.bottom = '0';
            panel.style.zIndex = '9999';
            panel.style.background = 'var(--bg)';
            panel.style.overflowY = 'auto';
            panel.style.WebkitOverflowScrolling = 'touch'; // Smooth scrolling on iOS
            
            // ONLY add safe area padding in full-screen mode
            panel.style.paddingTop = 'env(safe-area-inset-top)';
            panel.style.paddingBottom = 'calc(env(safe-area-inset-bottom) + 20px)';
            panel.style.paddingLeft = 'max(16px, env(safe-area-inset-left))';
            panel.style.paddingRight = 'max(16px, env(safe-area-inset-right))';
        }
        
        // Hide main app header/nav if they exist
        if (header) header.style.display = 'none';
        if (bottomNav) bottomNav.style.display = 'none';
        
        // Update extension header for full-screen
        if (extensionHeader) {
            extensionHeader.style.position = 'sticky';
            extensionHeader.style.top = '0';
            extensionHeader.style.background = 'var(--bg)';
            extensionHeader.style.zIndex = '100';
            extensionHeader.style.paddingTop = '12px';
            extensionHeader.style.paddingBottom = '12px';
            // No negative margins - let it sit naturally with safe area padding
        }
        
        // Add top margin to content to prevent header overlap
        if (toolsMenu) {
            toolsMenu.style.marginTop = '0'; // Header already has margin-bottom from HTML
        }
        
        // Change icon to exit full-screen
        if (fullscreenIcon) fullscreenIcon.textContent = '✕';
        
        console.log('Entered full-screen mode with safe area support');
    } else {
        // Exit full-screen mode
        document.body.classList.remove('fullscreen-mode');
        
        if (panel) {
            panel.style.position = '';
            panel.style.top = '';
            panel.style.left = '';
            panel.style.right = '';
            panel.style.bottom = '';
            panel.style.zIndex = '';
            panel.style.background = '';
            panel.style.overflowY = '';
            panel.style.WebkitOverflowScrolling = '';
            
            // Remove safe area padding when exiting full-screen
            panel.style.paddingTop = '';
            panel.style.paddingBottom = '';
            panel.style.paddingLeft = '';
            panel.style.paddingRight = '';
        }
        
        // Restore main app header/nav
        if (header) header.style.display = '';
        if (bottomNav) bottomNav.style.display = '';
        
        // Restore extension header
        if (extensionHeader) {
            extensionHeader.style.position = '';
            extensionHeader.style.top = '';
            extensionHeader.style.background = '';
            extensionHeader.style.zIndex = '';
            extensionHeader.style.paddingTop = '';
            extensionHeader.style.paddingBottom = '';
        }
        
        // Remove top margin from content
        if (toolsMenu) {
            toolsMenu.style.marginTop = '';
        }
        
        // Change icon back to full-screen
        if (fullscreenIcon) fullscreenIcon.textContent = '⛶';
        
        console.log('Exited full-screen mode');
    }
}

/**
 * Show/hide full-screen button based on screen size
 */
function updateFullScreenButtonVisibility() {
    const fullscreenBtn = document.getElementById('fullscreen-toggle');
    if (fullscreenBtn) {
        // Show on mobile (screen width < 768px), hide on desktop
        const isMobile = window.innerWidth < 768;
        fullscreenBtn.style.display = isMobile ? 'block' : 'none';
    }
}

// Initialize full-screen button visibility on load and resize
window.addEventListener('resize', updateFullScreenButtonVisibility);
document.addEventListener('DOMContentLoaded', updateFullScreenButtonVisibility);

/**
 * Disable horizontal scrolling on main app elements
 */
function disableHorizontalScroll() {
    // Disable horizontal scrolling on tabs
    const tabs = document.querySelector('.tabs');
    if (tabs) {
        tabs.style.overflowX = 'hidden';
    }
    
    // Disable horizontal scrolling on quick select row
    const quickSelect = document.querySelector('.quick-select-row');
    if (quickSelect) {
        quickSelect.style.overflowX = 'hidden';
    }
    
    // Disable horizontal scrolling on meteogram containers
    const meteogramContainers = document.querySelectorAll('.meteogram-container');
    meteogramContainers.forEach(container => {
        container.style.overflowX = 'hidden';
    });
    
    console.log('Horizontal scrolling disabled');
}

/**
 * Re-enable horizontal scrolling on main app elements
 */
function enableHorizontalScroll() {
    // Re-enable horizontal scrolling on tabs
    const tabs = document.querySelector('.tabs');
    if (tabs) {
        tabs.style.overflowX = 'auto';
    }
    
    // Re-enable horizontal scrolling on quick select row
    const quickSelect = document.querySelector('.quick-select-row');
    if (quickSelect) {
        quickSelect.style.overflowX = 'auto';
    }
    
    // Re-enable horizontal scrolling on meteogram containers
    const meteogramContainers = document.querySelectorAll('.meteogram-container');
    meteogramContainers.forEach(container => {
        container.style.overflowX = 'auto';
    });
    
    console.log('Horizontal scrolling re-enabled');
}

/**
 * Open the tools extension panel
 */
function openToolsExtension() {
    console.log('Opening tools extension...');
    
    // Keep main tools tab visible (don't hide it)
    const toolsTab = document.getElementById('tab-tools');
    const toolsExtension = document.getElementById('tools-extension-panel');
    
    console.log('toolsTab:', toolsTab);
    console.log('toolsExtension:', toolsExtension);
    
    if (toolsTab && toolsExtension) {
        // Disable horizontal scrolling on main app
        disableHorizontalScroll();
        
        // Keep the tools tab visible (don't hide or remove active class)
        
        // Show the extension panel as an overlay
        toolsExtension.style.display = 'block';
        toolsExtension.classList.add('active');
        
        // Position as overlay on top of tools tab
        toolsExtension.style.position = 'fixed';
        toolsExtension.style.top = '0';
        toolsExtension.style.left = '0';
        toolsExtension.style.right = '0';
        toolsExtension.style.bottom = '0';
        toolsExtension.style.zIndex = '3000';
        toolsExtension.style.background = 'var(--bg)';
        toolsExtension.style.overflowY = 'auto';
        toolsExtension.style.WebkitOverflowScrolling = 'touch';
        
        // Add safe area padding for iPhone notch/dynamic island
        toolsExtension.style.paddingTop = 'env(safe-area-inset-top)';
        toolsExtension.style.paddingBottom = 'env(safe-area-inset-bottom)';
        toolsExtension.style.paddingLeft = 'max(16px, env(safe-area-inset-left))';
        toolsExtension.style.paddingRight = 'max(16px, env(safe-area-inset-right))';
        
        toolsExtensionState.isOpen = true;
        toolsExtensionState.previousTab = 'tools';
        toolsExtensionState.isFullScreen = false;
        
        // Show the tools menu by default
        showToolsMenu();
        
        // Hide full-screen button (not needed in overlay mode)
        const fullscreenBtn = document.getElementById('fullscreen-toggle');
        if (fullscreenBtn) {
            fullscreenBtn.style.display = 'none';
        }
        
        console.log('Extension opened successfully as overlay');
    } else {
        console.error('Elements not found!');
        if (!toolsTab) console.error('tab-tools not found');
        if (!toolsExtension) console.error('tools-extension-panel not found');
    }
}

/**
 * Close the tools extension panel and return to main tools tab
 */
function closeToolsExtension() {
    console.log('Closing tools extension...');
    
    // Exit full-screen mode if active
    if (toolsExtensionState.isFullScreen) {
        toggleFullScreen();
    }
    
    const toolsTab = document.getElementById('tab-tools');
    const toolsExtension = document.getElementById('tools-extension-panel');
    
    if (toolsTab && toolsExtension) {
        // Re-enable horizontal scrolling on main app
        enableHorizontalScroll();
        
        // Hide the extension panel and reset overlay styling
        toolsExtension.style.display = 'none';
        toolsExtension.classList.remove('active');
        
        // Reset overlay positioning
        toolsExtension.style.position = '';
        toolsExtension.style.top = '';
        toolsExtension.style.left = '';
        toolsExtension.style.right = '';
        toolsExtension.style.bottom = '';
        toolsExtension.style.zIndex = '';
        toolsExtension.style.background = '';
        toolsExtension.style.overflowY = '';
        toolsExtension.style.WebkitOverflowScrolling = '';
        
        // Reset safe area padding
        toolsExtension.style.paddingTop = '';
        toolsExtension.style.paddingBottom = '';
        toolsExtension.style.paddingLeft = '';
        toolsExtension.style.paddingRight = '';
        
        // Tools tab is already visible, no need to show it
        
        toolsExtensionState.isOpen = false;
        toolsExtensionState.currentTool = null;
        toolsExtensionState.isFullScreen = false;

        // Clean up abbreviations scroll listener and back-to-top button
        const aeroRoot = document.getElementById('aero-root');
        if (aeroRoot?._aeroScrollCleanup) { aeroRoot._aeroScrollCleanup(); }
        document.getElementById('aero-top-btn')?.remove();
        
        console.log('Extension closed, overlay removed');
    }
}

/**
 * Show the tools menu (main extension view)
 */
function showToolsMenu() {
    const menu = document.getElementById('tools-menu');
    const toolViews = document.querySelectorAll('.tool-view');
    
    if (menu) {
        menu.style.display = 'block';
        toolViews.forEach(view => view.style.display = 'none');
        toolsExtensionState.currentTool = null;
        
        // Update header
        updateExtensionHeader('Aviation Tools', false);
    }
}

/**
 * Open a specific tool
 */
function openTool(toolName) {
    const menu = document.getElementById('tools-menu');
    const toolView = document.getElementById(`tool-${toolName}`);
    
    if (menu && toolView) {
        menu.style.display = 'none';
        
        // Hide all tool views
        document.querySelectorAll('.tool-view').forEach(view => {
            view.style.display = 'none';
        });
        
        // Show selected tool
        toolView.style.display = 'block';
        toolsExtensionState.currentTool = toolName;
        
        // Update header with tool name
        const toolTitles = {
            'unit-converter': 'Unit Converter',
            'great-circle': 'Great Circle Distance',
            'abbreviations': 'Aviation Abbreviations',
            'weather-terms': 'Present Weather Terms',
            'e6b-calculator': 'E6B Flight Computer',
            'e6b-trainer': 'E6B Trainer (UND)',
            'crosswind': 'Crosswind Calculator'
        };
        updateExtensionHeader(toolTitles[toolName] || 'Tool', true);
        
        // Initialize specific tools
        if (toolName === 'unit-converter') {
            updateUnitSelectors(); // Initialize with default units
        } else if (toolName === 'weather-terms') {
            displayAllWeatherTerms(); // Show all terms by default
        } else if (toolName === 'abbreviations') {
            openAbbreviations(); // Load the abbreviations database
        } else if (toolName === 'e6b-calculator') {
            calcE6B(); // Initialize E6B calculations
        } else if (toolName === 'e6b-trainer') {
            openUNDE6B(); // Load UND E6B trainer
        } else if (toolName === 'crosswind') {
            cwInit();
        } else if (toolName === 'great-circle') {
            gcInitMap();
        }
    }
}

/**
 * Update the extension header
 */
function updateExtensionHeader(title, showBackButton) {
    const headerTitle = document.getElementById('extension-header-title');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    
    if (headerTitle) {
        headerTitle.textContent = title;
    }
    
    // Show/hide back button with opacity transition
    if (backToMenuBtn) {
        if (showBackButton) {
            backToMenuBtn.style.opacity = '1';
            backToMenuBtn.style.pointerEvents = 'auto';
        } else {
            backToMenuBtn.style.opacity = '0';
            backToMenuBtn.style.pointerEvents = 'none';
        }
    }
}

// ============================================================================
// UNIT CONVERTER TOOL
// ============================================================================

const unitConversions = {
    // Distance
    distance: {
        nm: { label: 'Nautical Miles (NM)', toMeters: 1852 },
        sm: { label: 'Statute Miles (SM)', toMeters: 1609.344 },
        km: { label: 'Kilometers (km)', toMeters: 1000 },
        m: { label: 'Meters (m)', toMeters: 1 },
        ft: { label: 'Feet (ft)', toMeters: 0.3048 }
    },
    // Altitude (same as distance but different context)
    altitude: {
        ft: { label: 'Feet (ft)', toMeters: 0.3048 },
        m: { label: 'Meters (m)', toMeters: 1 },
        fl: { label: 'Flight Level (FL)', toMeters: 30.48 }  // FL = ft/100
    },
    // Temperature
    temperature: {
        c: { label: 'Celsius (°C)' },
        f: { label: 'Fahrenheit (°F)' },
        k: { label: 'Kelvin (K)' }
    },
    // Speed
    speed: {
        kts: { label: 'Knots (kt)', toMPS: 0.514444 },
        mph: { label: 'Miles/Hour (mph)', toMPS: 0.44704 },
        kph: { label: 'Kilometers/Hour (km/h)', toMPS: 0.277778 },
        mps: { label: 'Meters/Second (m/s)', toMPS: 1 },
        fpm: { label: 'Feet/Minute (fpm)', toMPS: 0.00508 }
    },
    // Pressure
    pressure: {
        hpa: { label: 'Hectopascals (hPa)', toHPA: 1 },
        inhg: { label: 'Inches Mercury (inHg)', toHPA: 33.8639 },
        mb: { label: 'Millibars (mb)', toHPA: 1 },
        psi: { label: 'PSI (lb/in²)', toHPA: 68.9476 }
    },
    // Fuel Volume
    fuelVolume: {
        usgal: { label: 'US Gallons (gal)', toLiters: 3.78541 },
        impgal: { label: 'Imperial Gallons (gal)', toLiters: 4.54609 },
        liter: { label: 'Liters (L)', toLiters: 1 },
        quart: { label: 'Quarts (qt)', toLiters: 0.946353 }
    },
    // Weight (for fuel and cargo)
    weight: {
        lbs: { label: 'Pounds (lbs)', toKG: 0.453592 },
        kg: { label: 'Kilograms (kg)', toKG: 1 },
        tons: { label: 'Tons (US)', toKG: 907.185 },
        mt: { label: 'Metric Tons (t)', toKG: 1000 }
    },
    // Fuel Flow
    fuelFlow: {
        gph: { label: 'Gallons/Hour (GPH)', toLPH: 3.78541 },
        lph: { label: 'Liters/Hour (L/h)', toLPH: 1 },
        pph: { label: 'Pounds/Hour (PPH)', toLPH: 0 }  // Special case
    },
    // Energy
    energy: {
        j: { label: 'Joules (J)', toJoules: 1 },
        kj: { label: 'Kilojoules (kJ)', toJoules: 1000 },
        mj: { label: 'Megajoules (MJ)', toJoules: 1000000 },
        cal: { label: 'Calories (cal)', toJoules: 4.184 },
        kcal: { label: 'Kilocalories (kcal)', toJoules: 4184 },
        wh: { label: 'Watt-hours (Wh)', toJoules: 3600 },
        kwh: { label: 'Kilowatt-hours (kWh)', toJoules: 3600000 },
        btu: { label: 'BTU (British Thermal Unit)', toJoules: 1055.06 },
        ftlb: { label: 'Foot-pounds (ft·lb)', toJoules: 1.35582 }
    },
    // Power
    power: {
        w: { label: 'Watts (W)', toWatts: 1 },
        kw: { label: 'Kilowatts (kW)', toWatts: 1000 },
        mw: { label: 'Megawatts (MW)', toWatts: 1000000 },
        hp: { label: 'Horsepower (hp)', toWatts: 745.7 },
        ps: { label: 'Metric Horsepower (PS)', toWatts: 735.5 },
        btuh: { label: 'BTU/Hour (BTU/h)', toWatts: 0.293071 },
        ftlbs: { label: 'Foot-pounds/sec (ft·lb/s)', toWatts: 1.35582 }
    }
};

function convertUnit() {
    const category = document.getElementById('conv-category').value;
    const inputValue = parseFloat(document.getElementById('conv-input').value);
    const fromUnit = document.getElementById('conv-from').value;
    const toUnit = document.getElementById('conv-to').value;
    const resultEl = document.getElementById('conv-result');
    
    if (isNaN(inputValue)) {
        resultEl.textContent = '-- --';
        return;
    }
    
    let result;
    
    if (category === 'distance' || category === 'altitude') {
        const toMeters = unitConversions[category][fromUnit].toMeters;
        const fromMeters = unitConversions[category][toUnit].toMeters;
        result = (inputValue * toMeters) / fromMeters;
    } else if (category === 'temperature') {
        result = convertTemperature(inputValue, fromUnit, toUnit);
    } else if (category === 'speed') {
        const toMPS = unitConversions.speed[fromUnit].toMPS;
        const fromMPS = unitConversions.speed[toUnit].toMPS;
        result = (inputValue * toMPS) / fromMPS;
    } else if (category === 'pressure') {
        const toHPA = unitConversions.pressure[fromUnit].toHPA;
        const fromHPA = unitConversions.pressure[toUnit].toHPA;
        result = (inputValue * toHPA) / fromHPA;
    } else if (category === 'fuelVolume') {
        const toLiters = unitConversions.fuelVolume[fromUnit].toLiters;
        const fromLiters = unitConversions.fuelVolume[toUnit].toLiters;
        result = (inputValue * toLiters) / fromLiters;
    } else if (category === 'weight') {
        const toKG = unitConversions.weight[fromUnit].toKG;
        const fromKG = unitConversions.weight[toUnit].toKG;
        result = (inputValue * toKG) / fromKG;
    } else if (category === 'fuelFlow') {
        if (fromUnit === 'pph' || toUnit === 'pph') {
            // PPH requires fuel density - show note
            resultEl.innerHTML = '<div style="font-size:11px; color:var(--sub-text);">PPH conversion requires fuel density</div>';
            return;
        }
        const toLPH = unitConversions.fuelFlow[fromUnit].toLPH;
        const fromLPH = unitConversions.fuelFlow[toUnit].toLPH;
        result = (inputValue * toLPH) / fromLPH;
    } else if (category === 'energy') {
        const toJoules = unitConversions.energy[fromUnit].toJoules;
        const fromJoules = unitConversions.energy[toUnit].toJoules;
        result = (inputValue * toJoules) / fromJoules;
    } else if (category === 'power') {
        const toWatts = unitConversions.power[fromUnit].toWatts;
        const fromWatts = unitConversions.power[toUnit].toWatts;
        result = (inputValue * toWatts) / fromWatts;
    }
    
    // Format result
    const unitLabel = unitConversions[category][toUnit].label.split(' ')[0];
    const decimals = result < 10 ? 3 : result < 100 ? 2 : result < 1000 ? 1 : 0;
    resultEl.textContent = result.toFixed(decimals) + ' ' + unitLabel;
}

function convertTemperature(value, from, to) {
    let celsius;
    
    // Convert to Celsius first
    if (from === 'c') celsius = value;
    else if (from === 'f') celsius = (value - 32) * 5/9;
    else if (from === 'k') celsius = value - 273.15;
    
    // Convert from Celsius to target
    if (to === 'c') return celsius;
    else if (to === 'f') return celsius * 9/5 + 32;
    else if (to === 'k') return celsius + 273.15;
}

function updateUnitSelectors() {
    const category = document.getElementById('conv-category').value;
    const fromSelect = document.getElementById('conv-from');
    const toSelect = document.getElementById('conv-to');
    
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    const units = unitConversions[category];
    for (let unit in units) {
        fromSelect.innerHTML += `<option value="${unit}">${units[unit].label}</option>`;
        toSelect.innerHTML += `<option value="${unit}">${units[unit].label}</option>`;
    }
    
    // Set different defaults for to/from
    if (toSelect.options.length > 1) {
        toSelect.selectedIndex = 1;
    }
    
    convertUnit();
}


/**
 * Swap the FROM and TO unit selectors, and move the result into the input
 */
function swapUnits() {
    const fromSelect = document.getElementById('conv-from');
    const toSelect   = document.getElementById('conv-to');
    const inputEl    = document.getElementById('conv-input');
    const resultEl   = document.getElementById('conv-result');

    // Swap unit selections
    const prevFrom = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value   = prevFrom;

    // If there is a numeric result, move it into the input field
    const resultText = resultEl.textContent || '';
    const numMatch   = resultText.match(/^[\d.]+/);
    if (numMatch && inputEl.value !== '') {
        inputEl.value = parseFloat(numMatch[0]);
    }

    // Animate the swap button
    const btn = document.querySelector('button[onclick="swapUnits()"]');
    if (btn) {
        btn.style.transform = 'rotate(180deg)';
        setTimeout(() => { btn.style.transform = ''; }, 300);
    }

    convertUnit();
}

// ============================================================================
// GREAT CIRCLE DISTANCE CALCULATOR
// Depends on: airport-db.js (lookupAirport), Leaflet 1.9.4
// ============================================================================

function gcResolveInput(inputId, nameId) {
    const inputEl = document.getElementById(inputId);
    const nameEl  = document.getElementById(nameId);
    if (!inputEl || !nameEl) return;
    const raw = inputEl.value;
    const val = raw.trim();
    const looksLikeCoords = /^-?\d/.test(val);
    if (!looksLikeCoords) inputEl.value = raw.toUpperCase();
    if (!val) { nameEl.textContent = ''; return; }
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
    if (val.length >= 3) {
        const airport = lookupAirport(val.toUpperCase());
        if (airport && airport.name) {
            const tag = airport.icao ? ` (${airport.icao})` : (airport.iata ? ` (${airport.iata})` : '');
            nameEl.textContent = `✓ ${airport.name}${tag}`;
            nameEl.style.color = 'var(--success)';
        } else {
            nameEl.textContent = '✗ Not found';
            nameEl.style.color = '#ff453a';
        }
    } else {
        nameEl.textContent = '';
    }
}

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

function calculateGreatCircle() {
    const fromRaw = (document.getElementById('gc-from')?.value || '').trim();
    const toRaw   = (document.getElementById('gc-to')?.value   || '').trim();
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
    if (!fromRaw || !toRaw) { showError('Enter departure and destination airports or coordinates.'); return; }
    const from = lookupAirport(fromRaw);
    const to   = lookupAirport(toRaw);
    if (!from) { showError(`Could not find airport or parse coordinates: "${fromRaw}"`); return; }
    if (!to)   { showError(`Could not find airport or parse coordinates: "${toRaw}"`);   return; }
    hideError();
    const R    = 6371.0;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat   * Math.PI / 180;
    const lon1 = from.lon * Math.PI / 180;
    const lon2 = to.lon   * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distKm = R * c;
    const distNM = distKm / 1.852;
    const distMi = distKm / 1.60934;
    const y1 = Math.sin(dLon)*Math.cos(lat2);
    const x1 = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    const initialBearing = (Math.atan2(y1,x1)*180/Math.PI+360)%360;
    const y2 = Math.sin(-dLon)*Math.cos(lat1);
    const x2 = Math.cos(lat2)*Math.sin(lat1) - Math.sin(lat2)*Math.cos(lat1)*Math.cos(-dLon);
    const finalBearing = (Math.atan2(y2,x2)*180/Math.PI+360)%360;
    const fmt = (n,d=0) => n.toLocaleString('en-US',{maximumFractionDigits:d});
    document.getElementById('gc-nm').textContent      = fmt(distNM,1);
    document.getElementById('gc-km').textContent      = fmt(distKm,1);
    document.getElementById('gc-mi').textContent      = fmt(distMi,1);
    document.getElementById('gc-initial').textContent = fmt(initialBearing,1)+'°';
    document.getElementById('gc-final').textContent   = fmt(finalBearing,1)+'°';
    const fromLabel = from.icao||from.iata||`${from.lat.toFixed(2)},${from.lon.toFixed(2)}`;
    const toLabel   = to.icao||to.iata||`${to.lat.toFixed(2)},${to.lon.toFixed(2)}`;
    const routeEl = document.getElementById('gc-route-label');
    if (routeEl) routeEl.textContent = `${fromLabel} → ${toLabel}  ·  ${fmt(distNM,1)} NM  ·  Initial ${fmt(initialBearing,1)}°T`;
    const resultEl = document.getElementById('gc-result');
    if (resultEl) resultEl.style.display = 'block';
    setTimeout(() => gcRenderMap(from, to, lat1, lon1, lat2, lon2, c), 60);
}

function gcInitMap() {
    if (gcMapInstance) { setTimeout(() => gcMapInstance.invalidateSize(), 80); return; }
    const el = document.getElementById('gc-map');
    if (!el || typeof L === 'undefined') return;
    gcMapInstance = L.map('gc-map', { center:[20,100], zoom:2, zoomControl:true, attributionControl:true, worldCopyJump:true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:'&copy; <a href="https://carto.com/">CARTO</a>', subdomains:'abcd', maxZoom:18
    }).addTo(gcMapInstance);
}

function gcComputeArcPoints(lat1,lon1,lat2,lon2,angDist,n) {
    n = n||100;
    const pts = [];
    const sinD = Math.sin(angDist);
    if (sinD < 1e-10) {
        pts.push([lat1*180/Math.PI, lon1*180/Math.PI]);
        pts.push([lat2*180/Math.PI, lon2*180/Math.PI]);
        return pts;
    }
    for (let i=0; i<=n; i++) {
        const f=i/n;
        const A=Math.sin((1-f)*angDist)/sinD;
        const B=Math.sin(f*angDist)/sinD;
        const x=A*Math.cos(lat1)*Math.cos(lon1)+B*Math.cos(lat2)*Math.cos(lon2);
        const y=A*Math.cos(lat1)*Math.sin(lon1)+B*Math.cos(lat2)*Math.sin(lon2);
        const z=A*Math.sin(lat1)+B*Math.sin(lat2);
        pts.push([Math.atan2(z,Math.sqrt(x*x+y*y))*180/Math.PI, Math.atan2(y,x)*180/Math.PI]);
    }
    for (let i=1; i<pts.length; i++) {
        const diff = pts[i][1]-pts[i-1][1];
        if (diff>180) pts[i][1]-=360;
        if (diff<-180) pts[i][1]+=360;
    }
    return pts;
}

function gcRenderMap(from,to,lat1r,lon1r,lat2r,lon2r,angDist) {
    gcInitMap();
    if (!gcMapInstance) return;
    if (gcArcLayer)   { gcMapInstance.removeLayer(gcArcLayer);   gcArcLayer=null; }
    if (gcFromMarker) { gcMapInstance.removeLayer(gcFromMarker); gcFromMarker=null; }
    if (gcToMarker)   { gcMapInstance.removeLayer(gcToMarker);   gcToMarker=null; }
    gcMapInstance.invalidateSize();
    const arcPts = gcComputeArcPoints(lat1r,lon1r,lat2r,lon2r,angDist);
    gcArcLayer = L.polyline(arcPts,{color:'#0a84ff',weight:2.5,opacity:0.9}).addTo(gcMapInstance);
    const makeIcon = (color) => L.divIcon({
        className:'',
        html:`<div style="width:12px;height:12px;background:${color};border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.6);"></div>`,
        iconSize:[12,12], iconAnchor:[6,6]
    });
    gcFromMarker = L.marker([from.lat,from.lon],{icon:makeIcon('#0a84ff')})
        .addTo(gcMapInstance)
        .bindTooltip(from.name||`${from.lat.toFixed(4)},${from.lon.toFixed(4)}`,{direction:'top',offset:[0,-8]});
    gcToMarker = L.marker([to.lat,to.lon],{icon:makeIcon('#32d74b')})
        .addTo(gcMapInstance)
        .bindTooltip(to.name||`${to.lat.toFixed(4)},${to.lon.toFixed(4)}`,{direction:'top',offset:[0,-8]});
    try { gcMapInstance.fitBounds(gcArcLayer.getBounds(),{padding:[30,30],maxZoom:8}); }
    catch(e) { gcMapInstance.setView([from.lat,from.lon],4); }
}

// ============================================================================
// WEATHER TERMS DATABASE (METAR Abbreviations)
// Source: https://www.weather.gov/media/wrh/mesowest/metar_decode_key.pdf
// ============================================================================

const metarAbbreviations = [
  { code: "$", meaning: "maintenance check indicator", category: "system" },
  { code: "-", meaning: "light intensity", category: "intensity" },
  { code: "+", meaning: "heavy intensity", category: "intensity" },
  { code: "/", meaning: "indicator that visual range data follows; separator between temperature and dew point data", category: "symbol" },
  { code: "ACC", meaning: "altocumulus castellanus", category: "cloud" },
  { code: "ACFT MSHP", meaning: "aircraft mishap", category: "general" },
  { code: "ACSL", meaning: "altocumulus standing lenticular cloud", category: "cloud" },
  { code: "AO1", meaning: "automated station without precipitation discriminator", category: "automation" },
  { code: "AO2", meaning: "automated station with precipitation discriminator", category: "automation" },
  { code: "ALP", meaning: "airport location point", category: "general" },
  { code: "APCH", meaning: "approach", category: "general" },
  { code: "APRNT", meaning: "apparent", category: "general" },
  { code: "APRX", meaning: "approximately", category: "general" },
  { code: "ATCT", meaning: "airport traffic control tower", category: "facility" },
  { code: "AUTO", meaning: "fully automated report", category: "report_modifier" },
  { code: "B", meaning: "began", category: "time_event" },
  { code: "BC", meaning: "patches", category: "descriptor" },
  { code: "BKN", meaning: "broken", category: "sky_condition" },
  { code: "BL", meaning: "blowing", category: "descriptor" },
  { code: "BR", meaning: "mist", category: "weather" },
  { code: "C", meaning: "center (with reference to runway designation)", category: "runway" },
  { code: "CA", meaning: "cloud-air lightning", category: "lightning" },
  { code: "CB", meaning: "cumulonimbus cloud", category: "cloud" },
  { code: "CBMAM", meaning: "cumulonimbus mammatus cloud", category: "cloud" },
  { code: "CC", meaning: "cloud-cloud lightning", category: "lightning" },
  { code: "CCSL", meaning: "cirrocumulus standing lenticular cloud", category: "cloud" },
  { code: "cd", meaning: "candela", category: "unit" },
  { code: "CG", meaning: "cloud-ground lightning", category: "lightning" },
  { code: "CHI", meaning: "cloud-height indicator", category: "system" },
  { code: "CHINO", meaning: "sky condition at secondary location not available", category: "sensor_status" },
  { code: "CIG", meaning: "ceiling", category: "ceiling" },
  { code: "CLR", meaning: "clear", category: "sky_condition" },
  { code: "CONS", meaning: "continuous", category: "frequency" },
  { code: "COR", meaning: "correction to a previously disseminated observation", category: "report_modifier" },
  { code: "DOC", meaning: "Department of Commerce", category: "organization" },
  { code: "DOD", meaning: "Department of Defense", category: "organization" },
  { code: "DOT", meaning: "Department of Transportation", category: "organization" },
  { code: "DR", meaning: "low drifting", category: "descriptor" },
  { code: "DS", meaning: "duststorm", category: "weather" },
  { code: "DSIPTG", meaning: "dissipating", category: "trend" },
  { code: "DSNT", meaning: "distant", category: "location" },
  { code: "DU", meaning: "widespread dust", category: "weather" },
  { code: "DVR", meaning: "dispatch visual range", category: "visibility" },
  { code: "DZ", meaning: "drizzle", category: "precipitation" },
  { code: "E", meaning: "east, ended, estimated ceiling (SAO)", category: "direction_or_event" },
  { code: "FAA", meaning: "Federal Aviation Administration", category: "organization" },
  { code: "FC", meaning: "funnel cloud", category: "weather" },
  { code: "FEW", meaning: "few clouds", category: "sky_condition" },
  { code: "FG", meaning: "fog", category: "weather" },
  { code: "FIBI", meaning: "filed but impracticable to transmit", category: "general" },
  { code: "FIRST", meaning: "first observation after a break in coverage at manual station", category: "report_modifier" },
  { code: "FMH-1", meaning: "Federal Meteorological Handbook No.1, Surface Weather Observations & Reports (METAR)", category: "publication" },
  { code: "FMH2", meaning: "Federal Meteorological Handbook No.2, Surface Synoptic Codes", category: "publication" },
  { code: "FRQ", meaning: "frequent", category: "frequency" },
  { code: "FROPA", meaning: "frontal passage", category: "weather_event" },
  { code: "FT", meaning: "feet", category: "unit" },
  { code: "FU", meaning: "smoke", category: "weather" },
  { code: "FZ", meaning: "freezing", category: "descriptor" },
  { code: "FZRANO", meaning: "freezing rain sensor not available", category: "sensor_status" },
  { code: "G", meaning: "gust", category: "wind" },
  { code: "GR", meaning: "hail", category: "precipitation" },
  { code: "GS", meaning: "small hail and/or snow pellets", category: "precipitation" },
  { code: "HLSTO", meaning: "hailstone", category: "weather" },
  { code: "HZ", meaning: "haze", category: "weather" },
  { code: "IC", meaning: "ice crystals, in-cloud lightning", category: "weather_or_lightning" },
  { code: "ICAO", meaning: "International Civil Aviation Organization", category: "organization" },
  { code: "INCRG", meaning: "increasing", category: "trend" },
  { code: "INTMT", meaning: "intermittent", category: "frequency" },
  { code: "KT", meaning: "knots", category: "unit" },
  { code: "L", meaning: "left (with reference to runway designation)", category: "runway" },
  { code: "LAST", meaning: "last observation before a break in coverage at a manual station", category: "report_modifier" },
  { code: "LST", meaning: "Local Standard Time", category: "time" },
  { code: "LTG", meaning: "lightning", category: "lightning" },
  { code: "LWR", meaning: "lower", category: "trend" },
  { code: "M", meaning: "minus, less than", category: "modifier" },
  { code: "max", meaning: "maximum", category: "general" },
  { code: "METAR", meaning: "routine weather report provided at fixed intervals", category: "report_type" },
  { code: "MI", meaning: "shallow", category: "descriptor" },
  { code: "min", meaning: "minimum", category: "general" },
  { code: "MOV", meaning: "moved/moving/movement", category: "movement" },
  { code: "MT", meaning: "mountains", category: "location" },
  { code: "N", meaning: "north", category: "direction" },
  { code: "N/A", meaning: "not applicable", category: "general" },
  { code: "NCDC", meaning: "National Climatic Data Center", category: "organization" },
  { code: "NE", meaning: "northeast", category: "direction" },
  { code: "NOS", meaning: "National Ocean Survey", category: "organization" },
  { code: "NOSPECI", meaning: "no SPECI reports are taken at the station", category: "report_modifier" },
  { code: "NOTAM", meaning: "Notice to Airmen", category: "aviation" },
  { code: "NW", meaning: "northwest", category: "direction" },
  { code: "NWS", meaning: "National Weather Service", category: "organization" },
  { code: "OCNL", meaning: "occasional", category: "frequency" },
  { code: "OFCM", meaning: "Office of the Federal Coordinator for Meteorology", category: "organization" },
  { code: "OHD", meaning: "overhead", category: "location" },
  { code: "OVC", meaning: "overcast", category: "sky_condition" },
  { code: "OVR", meaning: "over", category: "location" },
  { code: "P", meaning: "indicates greater than the highest reportable value", category: "modifier" },
  { code: "PCPN", meaning: "precipitation", category: "weather" },
  { code: "PL", meaning: "ice pellets", category: "precipitation" },
  { code: "PK WND", meaning: "peak wind", category: "remark" },
  { code: "PNO", meaning: "precipitation amount not available", category: "sensor_status" },
  { code: "PO", meaning: "dust/sand whirls (dust devils)", category: "weather" },
  { code: "PRES", meaning: "pressure", category: "pressure" },
  { code: "PR", meaning: "partial", category: "descriptor" },
  { code: "PRESFR", meaning: "pressure falling rapidly", category: "pressure" },
  { code: "PRESRR", meaning: "pressure rising rapidly", category: "pressure" },
  { code: "PWINO", meaning: "precipitation identifier sensor not available", category: "sensor_status" },
  { code: "PY", meaning: "spray", category: "weather" },
  { code: "R", meaning: "right (with reference to runway designation), runway", category: "runway" },
  { code: "RA", meaning: "rain", category: "precipitation" },
  { code: "RTD", meaning: "Routine Delayed (late) observation", category: "report_modifier" },
  { code: "RV", meaning: "reportable value", category: "general" },
  { code: "RVR", meaning: "Runway Visual Range", category: "visibility" },
  { code: "RVRNO", meaning: "RVR system values not available", category: "sensor_status" },
  { code: "RY", meaning: "runway", category: "runway" },
  { code: "S", meaning: "snow, south", category: "weather_or_direction" },
  { code: "SA", meaning: "sand", category: "weather" },
  { code: "SCSL", meaning: "stratocumulus standing lenticular cloud", category: "cloud" },
  { code: "SCT", meaning: "scattered", category: "sky_condition" },
  { code: "SE", meaning: "southeast", category: "direction" },
  { code: "SFC", meaning: "surface", category: "location" },
  { code: "SG", meaning: "snow grains", category: "precipitation" },
  { code: "SH", meaning: "shower(s)", category: "descriptor" },
  { code: "SKC", meaning: "sky clear", category: "sky_condition" },
  { code: "SLP", meaning: "sea-level pressure", category: "pressure" },
  { code: "SLPNO", meaning: "sea-level pressure not available", category: "sensor_status" },
  { code: "SM", meaning: "statute miles", category: "unit" },
  { code: "SN", meaning: "snow", category: "precipitation" },
  { code: "SNINCR", meaning: "snow increasing rapidly", category: "trend" },
  { code: "SP", meaning: "snow pellets", category: "precipitation" },
  { code: "SPECI", meaning: "an unscheduled report taken when certain criteria have been met", category: "report_type" },
  { code: "SQ", meaning: "squalls", category: "weather" },
  { code: "SS", meaning: "sandstorm", category: "weather" },
  { code: "STN", meaning: "station", category: "facility" },
  { code: "SW", meaning: "snow shower, southwest", category: "weather_or_direction" },
  { code: "TCU", meaning: "towering cumulus", category: "cloud" },
  { code: "TS", meaning: "thunderstorm", category: "weather" },
  { code: "TSNO", meaning: "thunderstorm information not available", category: "sensor_status" },
  { code: "TWR", meaning: "tower", category: "facility" },
  { code: "UNKN", meaning: "unknown", category: "general" },
  { code: "UP", meaning: "unknown precipitation", category: "precipitation" },
  { code: "UTC", meaning: "Coordinated Universal Time", category: "time" },
  { code: "V", meaning: "variable", category: "modifier" },
  { code: "VA", meaning: "volcanic ash", category: "weather" },
  { code: "VC", meaning: "in the vicinity", category: "location" },
  { code: "VIS", meaning: "visibility", category: "visibility" },
  { code: "VISNO", meaning: "visibility at secondary location not available", category: "sensor_status" },
  { code: "VR", meaning: "visual range", category: "visibility" },
  { code: "VRB", meaning: "variable", category: "wind" },
  { code: "VV", meaning: "vertical visibility", category: "ceiling" },
  { code: "W", meaning: "west", category: "direction" },
  { code: "WG/SO", meaning: "Working Group for Surface Observations", category: "organization" },
  { code: "WMO", meaning: "World Meteorological Organization", category: "organization" },
  { code: "WND", meaning: "wind", category: "wind" },
  { code: "WSHFT", meaning: "wind shift", category: "remark" },
  { code: "Z", meaning: "zulu, i.e., Coordinated Universal Time", category: "time" }
];

// Category labels for display
const categoryLabels = {
    'precipitation': 'PRECIPITATION',
    'weather': 'WEATHER PHENOMENA',
    'descriptor': 'DESCRIPTORS',
    'intensity': 'INTENSITY',
    'sky_condition': 'SKY CONDITION',
    'cloud': 'CLOUD TYPES',
    'visibility': 'VISIBILITY',
    'wind': 'WIND',
    'direction': 'DIRECTIONS',
    'runway': 'RUNWAY',
    'report_type': 'REPORT TYPES',
    'report_modifier': 'REPORT MODIFIERS',
    'lightning': 'LIGHTNING',
    'location': 'LOCATION',
    'time': 'TIME',
    'unit': 'UNITS',
    'modifier': 'MODIFIERS',
    'frequency': 'FREQUENCY',
    'trend': 'TRENDS',
    'pressure': 'PRESSURE',
    'ceiling': 'CEILING',
    'facility': 'FACILITIES',
    'organization': 'ORGANIZATIONS',
    'automation': 'AUTOMATION',
    'sensor_status': 'SENSOR STATUS',
    'system': 'SYSTEM',
    'remark': 'REMARKS',
    'general': 'GENERAL',
    'aviation': 'AVIATION',
    'symbol': 'SYMBOLS',
    'direction_or_event': 'DIRECTION/EVENT',
    'weather_or_direction': 'WEATHER/DIRECTION',
    'weather_or_lightning': 'WEATHER/LIGHTNING',
    'weather_event': 'WEATHER EVENTS',
    'time_event': 'TIME EVENTS',
    'movement': 'MOVEMENT',
    'publication': 'PUBLICATIONS'
};

function searchWeatherTerms() {
    const searchInputEl = document.getElementById('wx-search');
    const searchInput = searchInputEl.value.trim().toUpperCase();
    const resultsEl = document.getElementById('wx-results');
    const clearBtn = document.getElementById('wx-clear-btn');
    
    // Show/hide clear button
    if (clearBtn) {
        clearBtn.style.display = searchInputEl.value ? 'block' : 'none';
    }
    
    if (!searchInput) {
        displayAllWeatherTerms();
        return;
    }
    
    // Find matching terms
    const matches = metarAbbreviations.filter(item => 
        item.code.toUpperCase().includes(searchInput) || 
        item.meaning.toUpperCase().includes(searchInput) ||
        item.category.toUpperCase().includes(searchInput)
    );
    
    if (matches.length === 0) {
        resultsEl.innerHTML = '<div style="color:var(--sub-text); padding:20px; text-align:center;">No matching weather terms found</div>';
        return;
    }
    
    // Display source link at top
    let html = `
        <div style="margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; padding:10px; background:#1c1c1e; border-radius:8px;">
            <div style="font-size:11px; color:var(--sub-text);">
                <strong style="color:var(--accent);">${matches.length}</strong> result${matches.length !== 1 ? 's' : ''} found
            </div>
            <button onclick="window.open('https://www.weather.gov/media/wrh/mesowest/metar_decode_key.pdf', '_blank')" 
                    class="tool-btn" 
                    style="background:var(--accent); border:none; color:#000; padding:4px 10px; font-size:10px; font-weight:700;">
                VIEW SOURCE PDF ↗
            </button>
        </div>
    `;
    
    matches.forEach(item => {
        html += `
            <div style="background:#1c1c1e; padding:12px; border-radius:8px; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                    <div style="font-size:14px; font-weight:800; color:var(--accent); font-family:'SF Mono',monospace;">${item.code}</div>
                    <div style="font-size:10px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:0.5px;">${item.category.replace(/_/g, ' ')}</div>
                </div>
                <div style="font-size:12px; color:#fff; line-height:1.5;">${item.meaning}</div>
            </div>
        `;
    });
    
    resultsEl.innerHTML = html;
}

function clearWeatherSearch() {
    const searchInput = document.getElementById('wx-search');
    const clearBtn = document.getElementById('wx-clear-btn');
    searchInput.value = '';
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    displayAllWeatherTerms();
}

function displayAllWeatherTerms() {
    const resultsEl = document.getElementById('wx-results');
    
    // Group by category
    const grouped = {};
    metarAbbreviations.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });
    
    let html = '';
    
    // Priority categories to show first
    const priorityCategories = [
        'precipitation', 'weather', 'descriptor', 'intensity', 
        'sky_condition', 'cloud', 'visibility', 'wind'
    ];
    
    // Display priority categories
    priorityCategories.forEach(category => {
        if (grouped[category]) {
            const label = categoryLabels[category] || category.toUpperCase();
            html += `<div style="font-size:13px; font-weight:700; color:var(--accent); margin:20px 0 12px 0;">${label}</div>`;
            
            grouped[category].forEach(item => {
                html += `
                    <div style="background:#1c1c1e; padding:10px; border-radius:6px; margin-bottom:6px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="font-size:13px; font-weight:800; color:var(--accent); font-family:'SF Mono',monospace; min-width:50px;">${item.code}</div>
                            <div style="flex:1;">
                                <div style="font-size:12px; color:#fff;">${item.meaning}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    });
    
    // Add "Show All Categories" button
    html += `
        <div style="margin-top:20px; text-align:center;">
            <button onclick="displayAllCategories()" class="tool-btn" style="background:#1c1c1e; border:1px solid #333; color:var(--accent); padding:10px 20px; font-size:12px; font-weight:700;">
                SHOW ALL CATEGORIES ↓
            </button>
        </div>
    `;
    
    resultsEl.innerHTML = html;
}

function displayAllCategories() {
    const resultsEl = document.getElementById('wx-results');
    
    // Group by category
    const grouped = {};
    metarAbbreviations.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });
    
    let html = '';
    
    // Sort categories alphabetically
    const sortedCategories = Object.keys(grouped).sort();
    
    sortedCategories.forEach(category => {
        const label = categoryLabels[category] || category.toUpperCase();
        html += `<div style="font-size:13px; font-weight:700; color:var(--accent); margin:20px 0 12px 0;">${label} (${grouped[category].length})</div>`;
        
        grouped[category].forEach(item => {
            html += `
                <div style="background:#1c1c1e; padding:10px; border-radius:6px; margin-bottom:6px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="font-size:13px; font-weight:800; color:var(--accent); font-family:'SF Mono',monospace; min-width:50px;">${item.code}</div>
                        <div style="flex:1;">
                            <div style="font-size:12px; color:#fff;">${item.meaning}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    });
    
    // Add button to return to main view
    html += `
        <div style="margin-top:20px; text-align:center;">
            <button onclick="displayAllWeatherTerms()" class="tool-btn" style="background:#1c1c1e; border:1px solid #333; color:var(--accent); padding:10px 20px; font-size:12px; font-weight:700;">
                ← BACK TO MAIN VIEW
            </button>
        </div>
    `;
    
    resultsEl.innerHTML = html;
}

// ============================================================================
// WEATHER TERMS - SOURCES MENU & GFA VIEWER
// ============================================================================

/**
 * Toggle the sources menu visibility
 */
function toggleSourcesMenu() {
    const menu = document.getElementById('sources-menu');
    if (menu) {
        if (menu.style.display === 'none' || !menu.style.display) {
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    }
}

/**
 * Open the AWC GFA Symbols page in a new window
 */
// ============================================================================
// WEATHER SYMBOLS DATABASE
// Sources: NOAA Legends PDF & Aviation Weather GFA
// ============================================================================

const weatherSymbols = [
    // ========== FLIGHT CATEGORIES ==========
    { symbol: '🟢', code: 'VFR', name: 'Visual Flight Rules', category: 'flight_category', 
      description: 'Ceiling greater than 3,000 feet AGL and visibility greater than 5 statute miles', color: '#34c759' },
    { symbol: '🔵', code: 'MVFR', name: 'Marginal Visual Flight Rules', category: 'flight_category',
      description: 'Ceiling 1,000 to 3,000 feet AGL and/or visibility 3 to 5 statute miles', color: '#5ac8fa' },
    { symbol: '🔴', code: 'IFR', name: 'Instrument Flight Rules', category: 'flight_category',
      description: 'Ceiling 500 to below 1,000 feet AGL and/or visibility 1 to less than 3 statute miles', color: '#ff453a' },
    { symbol: '🟣', code: 'LIFR', name: 'Low Instrument Flight Rules', category: 'flight_category',
      description: 'Ceiling below 500 feet AGL and/or visibility less than 1 statute mile', color: '#bf5af2' },
    
    // ========== CLOUD COVERAGE ==========
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`, 
      code: 'SKC', name: 'Sky Clear', category: 'cloud_coverage',
      description: 'Human observer reports sky completely clear (0/8 coverage)' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><rect x="7" y="7" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`, 
      code: 'CLR', name: 'Clear', category: 'cloud_coverage',
      description: 'Automated station reports clear below 12,000 feet (0/8 coverage)' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M 12,12 L 12,3 A 9,9 0 0,1 17.36,7.63 Z" fill="currentColor"/></svg>`, 
      code: 'FEW', name: 'Few Clouds', category: 'cloud_coverage',
      description: '1/8 to 2/8 sky coverage' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M 12,12 L 12,3 A 9,9 0 0,1 21,12 Z" fill="currentColor"/></svg>`, 
      code: 'SCT', name: 'Scattered Clouds', category: 'cloud_coverage',
      description: '3/8 to 4/8 sky coverage' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M 12,12 L 12,3 A 9,9 0 1,1 5.27,17.73 Z" fill="currentColor"/></svg>`, 
      code: 'BKN', name: 'Broken Clouds', category: 'cloud_coverage',
      description: '5/8 to 7/8 sky coverage' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="currentColor"/></svg>`, 
      code: 'OVC', name: 'Overcast', category: 'cloud_coverage',
      description: '8/8 sky coverage (complete coverage)' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="1.5"/><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="1.5"/></svg>`, 
      code: 'OVX', name: 'Sky Obscured', category: 'cloud_coverage',
      description: 'Vertical visibility reported, no cloud information (obscuration)' },
    
    // ========== CLOUD TYPES ==========
    { symbol: 'CB', code: 'CB', name: 'Cumulonimbus', category: 'cloud_type',
      description: 'Towering vertical clouds, thunderstorm clouds' },
    { symbol: 'TCU', code: 'TCU', name: 'Towering Cumulus', category: 'cloud_type',
      description: 'Large cumulus with vertical development' },
    { symbol: 'ACC', code: 'ACC', name: 'Altocumulus Castellanus', category: 'cloud_type',
      description: 'Mid-level clouds with turrets, indicates instability' },
    { symbol: 'ACSL', code: 'ACSL', name: 'Altocumulus Standing Lenticular', category: 'cloud_type',
      description: 'Lens-shaped clouds formed by mountain waves' },
    { symbol: 'CCSL', code: 'CCSL', name: 'Cirrocumulus Standing Lenticular', category: 'cloud_type',
      description: 'High-altitude lenticular clouds' },
    { symbol: 'SCSL', code: 'SCSL', name: 'Stratocumulus Standing Lenticular', category: 'cloud_type',
      description: 'Low-level lenticular clouds' },
    
    // ========== SURFACE FRONTS ==========
    { symbol: `<svg viewBox="0 0 48 24" width="40" height="20"><line x1="2" y1="12" x2="46" y2="12" stroke="#0066cc" stroke-width="2"/><polygon points="14,4 18,12 14,12" fill="#0066cc"/><polygon points="26,4 30,12 26,12" fill="#0066cc"/><polygon points="38,4 42,12 38,12" fill="#0066cc"/></svg>`, 
      code: 'COLD_FRONT', name: 'Cold Front', category: 'front',
      description: 'Cooler, denser air mass advancing and replacing warmer air', color: '#0066cc' },
    { symbol: `<svg viewBox="0 0 48 24" width="40" height="20"><line x1="2" y1="12" x2="46" y2="12" stroke="#cc0000" stroke-width="2"/><path d="M 14,12 A 4,4 0 0,0 14,20" fill="#cc0000"/><path d="M 26,12 A 4,4 0 0,0 26,20" fill="#cc0000"/><path d="M 38,12 A 4,4 0 0,0 38,20" fill="#cc0000"/></svg>`, 
      code: 'WARM_FRONT', name: 'Warm Front', category: 'front',
      description: 'Warm air mass advancing and replacing cooler air', color: '#cc0000' },
    { symbol: `<svg viewBox="0 0 48 24" width="40" height="20"><line x1="2" y1="12" x2="46" y2="12" stroke="#666" stroke-width="2"/><polygon points="14,4 18,12 14,12" fill="#0066cc"/><path d="M 26,12 A 4,4 0 0,0 26,20" fill="#cc0000"/><polygon points="38,4 42,12 38,12" fill="#0066cc"/></svg>`, 
      code: 'STATIONARY_FRONT', name: 'Stationary Front', category: 'front',
      description: 'Front between warm and cold air masses moving very slowly or not at all', color: '#666' },
    { symbol: `<svg viewBox="0 0 48 24" width="40" height="20"><line x1="2" y1="12" x2="46" y2="12" stroke="#9933cc" stroke-width="2"/><polygon points="14,4 18,12 14,12" fill="#9933cc"/><path d="M 23,12 A 4,4 0 0,0 23,20" fill="#9933cc"/><polygon points="32,4 36,12 32,12" fill="#9933cc"/><path d="M 41,12 A 4,4 0 0,0 41,20" fill="#9933cc"/></svg>`, 
      code: 'OCCLUDED_FRONT', name: 'Occluded Front', category: 'front',
      description: 'Cold front overtaking warm front, composite of two fronts', color: '#9933cc' },
    { symbol: `<svg viewBox="0 0 48 24" width="40" height="20"><line x1="2" y1="12" x2="46" y2="12" stroke="#ff6600" stroke-width="2" stroke-dasharray="4,2"/></svg>`, 
      code: 'TROUGH', name: 'Trough', category: 'front',
      description: 'Elongated area of low pressure, also depicts outflow boundaries', color: '#ff6600' },
    { symbol: `<svg viewBox="0 0 48 24" width="40" height="20"><line x1="2" y1="12" x2="46" y2="12" stroke="#ff3b30" stroke-width="2" stroke-dasharray="4,2"/><circle cx="14" cy="12" r="2" fill="#ff3b30"/><circle cx="24" cy="12" r="2" fill="#ff3b30"/><circle cx="34" cy="12" r="2" fill="#ff3b30"/></svg>`, 
      code: 'SQUALL_LINE', name: 'Squall Line', category: 'front',
      description: 'Line of active thunderstorms with continuous or broken precipitation', color: '#ff3b30' },
    { symbol: `<svg viewBox="0 0 48 24" width="40" height="20"><line x1="2" y1="12" x2="46" y2="12" stroke="#ff9500" stroke-width="2"/><path d="M 10,12 A 4,4 0 0,0 10,20" fill="#ff9500"/><path d="M 18,12 A 4,4 0 0,0 18,20" fill="#ff9500"/><path d="M 26,12 A 4,4 0 0,0 26,20" fill="#ff9500"/><path d="M 34,12 A 4,4 0 0,0 34,20" fill="#ff9500"/><path d="M 42,12 A 4,4 0 0,0 42,20" fill="#ff9500"/></svg>`, 
      code: 'DRY_LINE', name: 'Dry Line', category: 'front',
      description: 'Boundary separating moist and dry air masses', color: '#ff9500' },
    { symbol: `<svg viewBox="0 0 48 24" width="40" height="20"><path d="M 2,12 Q 10,6 18,12 Q 26,18 34,12 Q 42,6 46,12" stroke="#ff9500" stroke-width="2" fill="none"/></svg>`, 
      code: 'TROPICAL_WAVE', name: 'Tropical Wave', category: 'front',
      description: 'Trough or cyclonic curvature in trade wind easterlies', color: '#ff9500' },
    
    // ========== FRONTOGENESIS/FRONTOLYSIS ==========
    { symbol: `<svg viewBox="0 0 48 24" width="40" height="20"><line x1="2" y1="12" x2="46" y2="12" stroke="#0066cc" stroke-width="2" stroke-dasharray="5,3"/><polygon points="20,4 24,12 20,12" fill="#0066cc"/><polygon points="40,4 44,12 40,12" fill="#0066cc"/></svg>`, 
      code: 'FRONTOGENESIS', name: 'Frontogenesis', category: 'front',
      description: 'Initial formation of surface front (dashed line with frontal symbols)' },
    { symbol: `<svg viewBox="0 0 48 24" width="40" height="20"><line x1="2" y1="12" x2="46" y2="12" stroke="#cc0000" stroke-width="2" stroke-dasharray="5,3"/><path d="M 26,12 A 4,4 0 0,0 26,20" fill="#cc0000"/></svg>`, 
      code: 'FRONTOLYSIS', name: 'Frontolysis', category: 'front',
      description: 'Dissipation or weakening of front (dashed line, symbols on alternating segments)' },
    
    // ========== PRECIPITATION TYPES ==========
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="8" cy="10" r="1.5" fill="currentColor"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/><circle cx="16" cy="10" r="1.5" fill="currentColor"/></svg>`, 
      code: 'RA', name: 'Rain', category: 'precipitation',
      description: 'Liquid water droplets falling from clouds', metarCodes: ['-RA', 'RA', '+RA'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12,8 L13,10 L15,10 L13.5,11.5 L14.5,13.5 L12,12 L9.5,13.5 L10.5,11.5 L9,10 L11,10 Z" fill="currentColor"/><path d="M6,14 L7,16 L9,16 L7.5,17.5 L8.5,19.5 L6,18 L3.5,19.5 L4.5,17.5 L3,16 L5,16 Z" fill="currentColor"/><path d="M18,14 L19,16 L21,16 L19.5,17.5 L20.5,19.5 L18,18 L15.5,19.5 L16.5,17.5 L15,16 L17,16 Z" fill="currentColor"/></svg>`, 
      code: 'SN', name: 'Snow', category: 'precipitation',
      description: 'Ice crystals falling from clouds', metarCodes: ['-SN', 'SN', '+SN'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="7" cy="10" r="1" fill="currentColor"/><circle cx="10" cy="13" r="1" fill="currentColor"/><circle cx="13" cy="10" r="1" fill="currentColor"/><circle cx="16" cy="13" r="1" fill="currentColor"/></svg>`, 
      code: 'DZ', name: 'Drizzle', category: 'precipitation',
      description: 'Very small water droplets (diameter < 0.5mm)', metarCodes: ['-DZ', 'DZ', '+DZ'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><g transform="translate(0,-2)"><path d="M12,8 L14,12 L10,12 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="14" r="1.5" fill="currentColor"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/><circle cx="16" cy="14" r="1.5" fill="currentColor"/></g></svg>`, 
      code: 'TS', name: 'Thunderstorm', category: 'precipitation',
      description: 'Lightning and thunder present', metarCodes: ['TS', 'TSRA', 'TSSN', '+TSRA'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12,6 L14,9 L10,9 Z" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="15" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/></svg>`, 
      code: 'SH', name: 'Showers', category: 'precipitation',
      description: 'Precipitation of short duration and varying intensity', metarCodes: ['SHRA', 'SHSN', 'SHGR'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="6" r="1" fill="currentColor"/><circle cx="12" cy="18" r="1" fill="currentColor"/><circle cx="6" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="12" r="1" fill="currentColor"/></svg>`, 
      code: 'GR', name: 'Hail', category: 'precipitation',
      description: 'Ice balls or stones (diameter ≥ 5mm)', metarCodes: ['-GR', 'GR', '+GR', 'SHGR'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="8" r="0.8" fill="currentColor"/><circle cx="12" cy="16" r="0.8" fill="currentColor"/><circle cx="8" cy="12" r="0.8" fill="currentColor"/><circle cx="16" cy="12" r="0.8" fill="currentColor"/></svg>`, 
      code: 'GS', name: 'Small Hail / Snow Pellets', category: 'precipitation',
      description: 'Small hail or snow pellets (diameter < 5mm)', metarCodes: ['-GS', 'GS', '+GS'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="9" cy="10" r="2" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="15" cy="10" r="2" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="15" r="2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`, 
      code: 'PL', name: 'Ice Pellets', category: 'precipitation',
      description: 'Transparent or translucent ice pellets (sleet)', metarCodes: ['PL', 'SHPL'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="8" cy="10" r="1.5" fill="currentColor"/><line x1="8" y1="11.5" x2="8" y2="16" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/><line x1="12" y1="15.5" x2="12" y2="20" stroke="currentColor" stroke-width="1.2"/><circle cx="16" cy="10" r="1.5" fill="currentColor"/><line x1="16" y1="11.5" x2="16" y2="16" stroke="currentColor" stroke-width="1.2"/></svg>`, 
      code: 'FZRA', name: 'Freezing Rain', category: 'precipitation',
      description: 'Supercooled rain that freezes on contact', metarCodes: ['-FZRA', 'FZRA', '+FZRA'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="7" cy="10" r="1" fill="currentColor"/><line x1="7" y1="11" x2="7" y2="14" stroke="currentColor" stroke-width="0.8"/><circle cx="10" cy="13" r="1" fill="currentColor"/><line x1="10" y1="14" x2="10" y2="17" stroke="currentColor" stroke-width="0.8"/><circle cx="13" cy="10" r="1" fill="currentColor"/><line x1="13" y1="11" x2="13" y2="14" stroke="currentColor" stroke-width="0.8"/><circle cx="16" cy="13" r="1" fill="currentColor"/><line x1="16" y1="14" x2="16" y2="17" stroke="currentColor" stroke-width="0.8"/></svg>`, 
      code: 'FZDZ', name: 'Freezing Drizzle', category: 'precipitation',
      description: 'Supercooled drizzle that freezes on contact', metarCodes: ['-FZDZ', 'FZDZ', '+FZDZ'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><line x1="6" y1="8" x2="10" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="8" x2="6" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="14" y1="8" x2="18" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="18" y1="8" x2="14" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="14" x2="14" y2="18" stroke="currentColor" stroke-width="1.5"/><line x1="14" y1="14" x2="10" y2="18" stroke="currentColor" stroke-width="1.5"/></svg>`, 
      code: 'IC', name: 'Ice Crystals', category: 'precipitation',
      description: 'Diamond dust - tiny ice crystals floating in air', metarCodes: ['IC'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="8" cy="10" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="16" cy="10" r="1.2" fill="currentColor"/><circle cx="10" cy="15" r="1.2" fill="currentColor"/><circle cx="14" cy="15" r="1.2" fill="currentColor"/></svg>`, 
      code: 'SG', name: 'Snow Grains', category: 'precipitation',
      description: 'Very small white opaque particles of ice', metarCodes: ['SG'] },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><text x="12" y="16" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor">?</text></svg>`, 
      code: 'UP', name: 'Unknown Precipitation', category: 'precipitation',
      description: 'Automated station detected precipitation but cannot identify type', metarCodes: ['UP'] },
    
    // ========== OBSCURATIONS ==========
    { symbol: '≡', code: 'FG', name: 'Fog', category: 'obscuration',
      description: 'Visibility reduced to less than 5/8 SM by water droplets', metarCodes: ['FG', 'BCFG', 'MIFG', 'PRFG', 'FZFG'] },
    { symbol: '∽', code: 'BR', name: 'Mist', category: 'obscuration',
      description: 'Visibility 5/8 to less than 6 SM due to water droplets', metarCodes: ['BR'] },
    { symbol: '∞', code: 'HZ', name: 'Haze', category: 'obscuration',
      description: 'Dry particles suspended in air reducing visibility', metarCodes: ['HZ'] },
    { symbol: 'Λ', code: 'FU', name: 'Smoke', category: 'obscuration',
      description: 'Visibility reduced by combustion products', metarCodes: ['FU'] },
    { symbol: 'S', code: 'DU', name: 'Dust', category: 'obscuration',
      description: 'Widespread dust in suspension raised by wind', metarCodes: ['DU', 'BLDU'] },
    { symbol: 'S', code: 'SA', name: 'Sand', category: 'obscuration',
      description: 'Sand raised to considerable height by wind', metarCodes: ['SA', 'BLSA'] },
    { symbol: '⊕', code: 'PY', name: 'Spray', category: 'obscuration',
      description: 'Water droplets torn from wave crests by wind', metarCodes: ['PY', 'BLPY'] },
    { symbol: '△', code: 'VA', name: 'Volcanic Ash', category: 'obscuration',
      description: 'Ash particles from volcanic eruption', metarCodes: ['VA'] },
    
    // ========== OTHER PHENOMENA ==========
    { symbol: 'ϕ', code: 'PO', name: 'Dust/Sand Whirls', category: 'other_phenomena',
      description: 'Well-developed dust devils or sand whirls', metarCodes: ['PO', 'VCPO'] },
    { symbol: 'ᴝ', code: 'SQ', name: 'Squalls', category: 'other_phenomena',
      description: 'Sudden wind increase of at least 16 knots, lasting ≥1 minute', metarCodes: ['SQ'] },
    { symbol: '⋉', code: 'FC', name: 'Funnel Cloud', category: 'other_phenomena',
      description: 'Tornado or waterspout cloud', metarCodes: ['FC', '+FC', 'VCFC'] },
    { symbol: 'S', code: 'SS', name: 'Sandstorm', category: 'other_phenomena',
      description: 'Severe sandstorm significantly reducing visibility', metarCodes: ['SS', 'VCSS'] },
    { symbol: 'S', code: 'DS', name: 'Duststorm', category: 'other_phenomena',
      description: 'Severe duststorm significantly reducing visibility', metarCodes: ['DS', 'VCDS'] },
    
    // ========== DESCRIPTORS ==========
    { symbol: '-', code: 'LIGHT', name: 'Light Intensity', category: 'intensity',
      description: 'Light intensity precipitation or phenomenon', prefix: '-' },
    { symbol: '+', code: 'HEAVY', name: 'Heavy Intensity', category: 'intensity',
      description: 'Heavy or severe intensity precipitation or phenomenon', prefix: '+' },
    { symbol: 'VC', code: 'VC', name: 'In Vicinity', category: 'descriptor',
      description: 'Within 5-10 statute miles of aerodrome but not at station', prefix: 'VC' },
    { symbol: 'MI', code: 'MI', name: 'Shallow', category: 'descriptor',
      description: 'Ground-level phenomenon (below 6 feet)', prefix: 'MI' },
    { symbol: 'BC', code: 'BC', name: 'Patches', category: 'descriptor',
      description: 'Random occurrence covering part of area', prefix: 'BC' },
    { symbol: 'PR', code: 'PR', name: 'Partial', category: 'descriptor',
      description: 'Covers part of aerodrome', prefix: 'PR' },
    { symbol: 'DR', code: 'DR', name: 'Low Drifting', category: 'descriptor',
      description: 'Below 6 feet above ground', prefix: 'DR' },
    { symbol: 'BL', code: 'BL', name: 'Blowing', category: 'descriptor',
      description: 'Raised above 6 feet by wind', prefix: 'BL' },
    { symbol: 'SH', code: 'SH', name: 'Showers', category: 'descriptor',
      description: 'Short duration precipitation', prefix: 'SH' },
    { symbol: 'TS', code: 'TS', name: 'Thunderstorm', category: 'descriptor',
      description: 'Lightning and thunder present', prefix: 'TS' },
    { symbol: 'FZ', code: 'FZ', name: 'Freezing', category: 'descriptor',
      description: 'Supercooled, freezes on contact', prefix: 'FZ' },
    
    
    // ========== PIREP TURBULENCE ==========
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="6" fill="none" stroke="#0066cc" stroke-width="2"/></svg>`, 
      code: 'TURB_NONE', name: 'Turbulence Not Encountered', category: 'pirep_turbulence',
      description: 'No turbulence reported', color: '#0066cc' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><line x1="6" y1="12" x2="10" y2="12" stroke="#00cc00" stroke-width="2" stroke-dasharray="2,2"/><line x1="14" y1="12" x2="18" y2="12" stroke="#00cc00" stroke-width="2" stroke-dasharray="2,2"/></svg>`, 
      code: 'TURB_SMOOTH_LIGHT', name: 'Smooth-Light Turbulence', category: 'pirep_turbulence',
      description: 'Smooth to light turbulence', color: '#00cc00' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,16 L 9,10 L 15,10 Z" fill="none" stroke="#00cc00" stroke-width="2" stroke-linejoin="miter"/></svg>`, 
      code: 'TURB_LIGHT', name: 'Light Turbulence', category: 'pirep_turbulence',
      description: 'Light turbulence - slight, erratic changes', color: '#00cc00' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,16 L 9,10 L 15,10 Z" fill="none" stroke="#ff9500" stroke-width="2" stroke-linejoin="miter"/></svg>`, 
      code: 'TURB_LIGHT_MOD', name: 'Light-Moderate Turbulence', category: 'pirep_turbulence',
      description: 'Light to moderate turbulence', color: '#ff9500' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,17 L 9,12 L 12,12 L 9,7 L 15,7 L 12,12 L 15,12 Z" fill="none" stroke="#ff9500" stroke-width="2" stroke-linejoin="miter"/></svg>`, 
      code: 'TURB_MODERATE', name: 'Moderate Turbulence', category: 'pirep_turbulence',
      description: 'Moderate turbulence - changes in altitude/attitude', color: '#ff9500' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,17 L 9,12 L 12,12 L 9,7 L 15,7 L 12,12 L 15,12 Z" fill="none" stroke="#ff3b30" stroke-width="2.5" stroke-linejoin="miter"/></svg>`, 
      code: 'TURB_MOD_SEVERE', name: 'Moderate-Severe Turbulence', category: 'pirep_turbulence',
      description: 'Moderate to severe turbulence', color: '#ff3b30' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,17 L 9,12 L 12,12 L 9,7 L 15,7 L 12,12 L 15,12 Z" fill="none" stroke="#ff3b30" stroke-width="2" stroke-linejoin="miter"/></svg>`, 
      code: 'TURB_SEVERE', name: 'Severe Turbulence', category: 'pirep_turbulence',
      description: 'Severe turbulence - large abrupt changes, aircraft out of control momentarily', color: '#ff3b30' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,17 L 9,12 L 12,12 L 9,7 L 15,7 L 12,12 L 15,12 Z" fill="#bf5af2" stroke="#bf5af2" stroke-width="1" stroke-linejoin="miter"/></svg>`, 
      code: 'TURB_EXTREME', name: 'Extreme Turbulence', category: 'pirep_turbulence',
      description: 'Extreme turbulence - aircraft violently tossed, practically impossible to control', color: '#bf5af2' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 6,10 Q 9,14 12,10 T 18,10" stroke="#ff3b30" stroke-width="2" fill="none"/><path d="M 6,14 Q 9,18 12,14 T 18,14" stroke="#ff3b30" stroke-width="2" fill="none"/></svg>`, 
      code: 'LLWS', name: 'Low-Level Wind Shear', category: 'pirep_turbulence',
      description: 'Low-level wind shear reported', color: '#ff3b30' },

    // ========== PIREP ICING ==========
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="6" fill="none" stroke="#0066cc" stroke-width="2"/></svg>`, 
      code: 'ICE_NONE', name: 'Icing Not Encountered', category: 'pirep_icing',
      description: 'No icing reported', color: '#0066cc' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 10,16 L 10,10 Q 10,8 12,8 Q 14,8 14,10 L 14,16" stroke="#00cc00" stroke-width="2" fill="none"/></svg>`, 
      code: 'ICE_TRACE', name: 'Trace Icing', category: 'pirep_icing',
      description: 'Trace icing - ice becomes perceptible, rate of accumulation slightly greater than sublimation', color: '#00cc00' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 8,16 L 8,10 Q 8,8 10,8 Q 12,8 12,10 L 12,16 M 12,10 Q 12,8 14,8 Q 16,8 16,10 L 16,16" stroke="#00cc00" stroke-width="2" fill="none"/></svg>`, 
      code: 'ICE_TRACE_LIGHT', name: 'Trace to Light Icing', category: 'pirep_icing',
      description: 'Trace to light icing', color: '#00cc00' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 7,16 L 7,11 Q 7,9 9,9 Q 11,9 11,11 L 11,16 M 11,11 Q 11,9 12,9 Q 13,9 13,11 L 13,16 M 13,11 Q 13,9 15,9 Q 17,9 17,11 L 17,16" stroke="#00cc00" stroke-width="2" fill="none"/></svg>`, 
      code: 'ICE_LIGHT', name: 'Light Icing', category: 'pirep_icing',
      description: 'Light icing - rate of accumulation may create problem if flight is prolonged (over 1 hour)', color: '#00cc00' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 8,16 L 8,10 Q 8,8 10,8 Q 12,8 12,10 L 12,16 M 12,10 Q 12,8 14,8 Q 16,8 16,10 L 16,16" stroke="#ff9500" stroke-width="2" fill="none"/></svg>`, 
      code: 'ICE_LIGHT_MOD', name: 'Light to Moderate Icing', category: 'pirep_icing',
      description: 'Light to moderate icing', color: '#ff9500' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 7,16 L 7,11 Q 7,9 9,9 Q 11,9 11,11 L 11,16 M 11,11 Q 11,9 12,9 Q 13,9 13,11 L 13,16 M 13,11 Q 13,9 15,9 Q 17,9 17,11 L 17,16" stroke="#ff9500" stroke-width="2" fill="none"/></svg>`, 
      code: 'ICE_MODERATE', name: 'Moderate Icing', category: 'pirep_icing',
      description: 'Moderate icing - short encounters become potentially hazardous, use of deicing/anti-icing equipment required', color: '#ff9500' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 8,16 L 8,10 Q 8,8 10,8 Q 12,8 12,10 L 12,16 M 12,10 Q 12,8 14,8 Q 16,8 16,10 L 16,16" stroke="#ff3b30" stroke-width="2" fill="none"/></svg>`, 
      code: 'ICE_MOD_SEVERE', name: 'Moderate to Severe Icing', category: 'pirep_icing',
      description: 'Moderate to severe icing', color: '#ff3b30' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 7,16 L 7,11 Q 7,9 9,9 Q 11,9 11,11 L 11,16 M 11,11 Q 11,9 12,9 Q 13,9 13,11 L 13,16 M 13,11 Q 13,9 15,9 Q 17,9 17,11 L 17,16" stroke="#ff3b30" stroke-width="2" fill="none"/></svg>`, 
      code: 'ICE_SEVERE', name: 'Severe Icing', category: 'pirep_icing',
      description: 'Severe icing - rate of accumulation such that deicing/anti-icing equipment fails to reduce or control hazard', color: '#ff3b30' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,6 L 12,18 M 7,10 L 12,6 L 17,10 M 7,12 L 17,12 M 8,15 L 16,15" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`, 
      code: 'ICE_OTHER', name: 'Other', category: 'pirep_icing',
      description: 'Other icing conditions or phenomena', color: '#666' },


    // ========== MAP FEATURES ==========
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,6 L 18,12 L 12,18 L 6,12 Z" fill="#bf5af2"/></svg>`, 
      code: 'STADIUM', name: 'Stadium', category: 'map_feature',
      description: 'Stadium or large sports facility', color: '#bf5af2' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><polygon points="12,4 16,16 12,15 8,16" fill="#0066cc"/><line x1="12" y1="4" x2="12" y2="1" stroke="#0066cc" stroke-width="1.5"/></svg>`, 
      code: 'OBSTACLE_TALL', name: 'Tall Obstacle', category: 'map_feature',
      description: 'Tall obstacle or tower (1000+ ft AGL)', color: '#0066cc' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><polygon points="12,8 16,18 8,18" fill="#0066cc"/></svg>`, 
      code: 'OBSTACLE_MED', name: 'Medium or Small Obstacle', category: 'map_feature',
      description: 'Medium or small obstacle (<1000 ft AGL)', color: '#0066cc' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M 12,6 L 10,8 L 14,8 Z" fill="currentColor"/><path d="M 18,12 L 16,10 L 16,14 Z" fill="currentColor"/><path d="M 12,18 L 14,16 L 10,16 Z" fill="currentColor"/></svg>`, 
      code: 'WIND_FARM', name: 'Wind Farm', category: 'map_feature',
      description: 'Wind turbine farm or wind power facility', color: '#666' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><polygon points="12,6 18,18 6,18" fill="currentColor"/></svg>`, 
      code: 'MOUNTAIN', name: 'Mountain', category: 'map_feature',
      description: 'Mountain peak or high terrain', color: '#333' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><polygon points="12,6 18,18 6,18" fill="#ff3b30"/></svg>`, 
      code: 'VOLCANO', name: 'Volcano', category: 'map_feature',
      description: 'Volcanic peak', color: '#ff3b30' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 8,12 Q 8,8 10,8" stroke="currentColor" stroke-width="2" fill="none"/><path d="M 16,12 Q 16,8 14,8" stroke="currentColor" stroke-width="2" fill="none"/></svg>`, 
      code: 'PASS', name: 'Pass', category: 'map_feature',
      description: 'Mountain pass or gap', color: '#666' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><rect x="7" y="9" width="10" height="7" rx="1" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="#fff"/><rect x="8" y="8" width="3" height="2" fill="currentColor"/></svg>`, 
      code: 'CAMERA', name: 'Camera', category: 'map_feature',
      description: 'Camera or observation point', color: '#333' },

    // ========== NAVIGATIONAL AIDS ==========
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="7" fill="none" stroke="#0066cc" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#0066cc"/></svg>`, 
      code: 'VOR', name: 'VOR', category: 'navaid',
      description: 'VHF Omnidirectional Range - radio navigation aid providing 360° radials', color: '#0066cc' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><rect x="7" y="7" width="10" height="10" fill="none" stroke="#0066cc" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#0066cc"/></svg>`, 
      code: 'DME', name: 'DME', category: 'navaid',
      description: 'Distance Measuring Equipment - provides slant range distance to station', color: '#0066cc' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="7" fill="none" stroke="#0066cc" stroke-width="2"/><rect x="9" y="9" width="6" height="6" fill="none" stroke="#0066cc" stroke-width="1.5"/></svg>`, 
      code: 'VOR_DME', name: 'VOR/DME', category: 'navaid',
      description: 'Co-located VOR and DME - provides bearing and distance', color: '#0066cc' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,6 L 12,12 M 12,12 L 8,18 M 12,12 L 16,18" stroke="#0066cc" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`, 
      code: 'TACAN', name: 'TACAN', category: 'navaid',
      description: 'Tactical Air Navigation - military navigation system providing bearing and distance', color: '#0066cc' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="7" fill="none" stroke="#0066cc" stroke-width="2"/><path d="M 12,8 L 12,12 M 12,12 L 9,16 M 12,12 L 15,16" stroke="#0066cc" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`, 
      code: 'VORTAC', name: 'VORTAC', category: 'navaid',
      description: 'Co-located VOR and TACAN - civilian and military navigation', color: '#0066cc' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`, 
      code: 'NDB', name: 'NDB', category: 'navaid',
      description: 'Non-Directional Beacon - low/medium frequency radio beacon', color: '#666' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`, 
      code: 'RNAV', name: 'RNAV', category: 'navaid',
      description: 'Area Navigation waypoint - GPS or RNAV fix', color: '#666' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><polygon points="12,7 16,17 8,17" fill="none" stroke="currentColor" stroke-width="2"/></svg>`, 
      code: 'FIX', name: 'Fix', category: 'navaid',
      description: 'Navigation fix or reporting point', color: '#666' },

    // ========== WIND SYMBOLS ==========
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`, 
      code: 'CALM', name: 'Calm Wind', category: 'wind',
      description: 'Wind speed less than 3 knots' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"/><line x1="18" y1="12" x2="15" y2="10" stroke="currentColor" stroke-width="2"/></svg>`, 
      code: 'WIND_5KT', name: 'Wind 5 Knots', category: 'wind',
      description: 'Half barb = 5 knots' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"/><line x1="18" y1="12" x2="15" y2="8" stroke="currentColor" stroke-width="2"/></svg>`, 
      code: 'WIND_10KT', name: 'Wind 10 Knots', category: 'wind',
      description: 'Full barb = 10 knots' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"/><polygon points="18,12 15,8 15,12" fill="currentColor"/></svg>`, 
      code: 'WIND_50KT', name: 'Wind 50 Knots', category: 'wind',
      description: 'Pennant/flag = 50 knots' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="currentColor">VRB</text></svg>`, 
      code: 'VRB', name: 'Variable Wind', category: 'wind',
      description: 'Wind direction varying, typically light winds' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="currentColor">GUST</text></svg>`, 
      code: 'GUST', name: 'Wind Gust', category: 'wind',
      description: 'Peak wind speed exceeding sustained speed by 10+ knots' },
    
    // ========== PRESSURE SYSTEMS ==========
    { symbol: 'H', code: 'HIGH', name: 'High Pressure Center', category: 'pressure',
      description: 'Center of high atmospheric pressure (anticyclone)', color: '#007aff' },
    { symbol: 'L', code: 'LOW', name: 'Low Pressure Center', category: 'pressure',
      description: 'Center of low atmospheric pressure (cyclone)', color: '#ff3b30' },
    
    // ========== TURBULENCE ==========
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 6,16 L 12,8 L 18,16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg>`, 
      code: 'TURB_LGT', name: 'Light Turbulence', category: 'turbulence',
      description: 'Light turbulence, slight bumpiness, slight strain against seat belts' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 4,16 L 8,8 L 12,16 L 16,8 L 20,16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg>`, 
      code: 'TURB_MOD', name: 'Moderate Turbulence', category: 'turbulence',
      description: 'Moderate turbulence, changes in altitude/attitude, definite strain against seat belts' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 3,16 L 6,8 L 9,16 L 12,8 L 15,16 L 18,8 L 21,16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="miter"/></svg>`, 
      code: 'TURB_SEV', name: 'Severe Turbulence', category: 'turbulence',
      description: 'Severe turbulence, large/abrupt changes, aircraft may be momentarily out of control' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 2,16 L 4,8 L 6,16 L 8,8 L 10,16 L 12,8 L 14,16 L 16,8 L 18,16 L 20,8 L 22,16" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="miter"/></svg>`, 
      code: 'TURB_EXT', name: 'Extreme Turbulence', category: 'turbulence',
      description: 'Extreme turbulence, aircraft violently tossed about, practically impossible to control' },
    
    // ========== ICING ==========
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,6 L 13.5,9 L 10.5,9 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="14" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="12" x2="12" y2="16" stroke="currentColor" stroke-width="1.2"/></svg>`, 
      code: 'ICE_TRACE', name: 'Trace Icing', category: 'icing',
      description: 'Trace icing, ice becomes perceptible, rate of accumulation slightly greater than sublimation' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,5 L 14,8 L 10,8 Z" fill="currentColor"/><circle cx="12" cy="13" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="10.5" x2="12" y2="15.5" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>`, 
      code: 'ICE_LGT', name: 'Light Icing', category: 'icing',
      description: 'Light icing, rate of accumulation may create problem if flight prolonged (over 1 hour)' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,4 L 14.5,8 L 9.5,8 Z" fill="currentColor"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="9.5" x2="12" y2="16.5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>`, 
      code: 'ICE_MOD', name: 'Moderate Icing', category: 'icing',
      description: 'Moderate icing, rate of accumulation such that even short encounters become potentially hazardous' },
    { symbol: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M 12,3 L 15,8 L 9,8 Z" fill="currentColor"/><circle cx="12" cy="13" r="4.5" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="12" y1="8.5" x2="12" y2="17.5" stroke="currentColor" stroke-width="2.5"/><circle cx="12" cy="20" r="2" fill="currentColor"/></svg>`, 
      code: 'ICE_SEV', name: 'Severe Icing', category: 'icing',
      description: 'Severe icing, rate of accumulation such that deicing/anti-icing equipment fails to reduce or control hazard' },
    
    // ========== LIGHTNING ==========
    { symbol: 'CA', code: 'CA', name: 'Cloud-Air Lightning', category: 'lightning',
      description: 'Lightning between cloud and air' },
    { symbol: 'CC', code: 'CC', name: 'Cloud-Cloud Lightning', category: 'lightning',
      description: 'Lightning between clouds (intra-cloud or inter-cloud)' },
    { symbol: 'CG', code: 'CG', name: 'Cloud-Ground Lightning', category: 'lightning',
      description: 'Lightning between cloud and ground' },
    { symbol: 'IC', code: 'IC_LIGHT', name: 'In-Cloud Lightning', category: 'lightning',
      description: 'Lightning within a cloud' },
    
    // ========== AIRMET/SIGMET SYMBOLS ==========
    { symbol: 'IFR', code: 'AIRMET_IFR', name: 'AIRMET IFR', category: 'airmet',
      description: 'Ceiling below 1000 ft and/or visibility below 3 SM affecting over 50% of area' },
    { symbol: 'MT_OBSC', code: 'AIRMET_MTN', name: 'AIRMET Mountain Obscuration', category: 'airmet',
      description: 'Mountains obscured by clouds, precipitation, fog, or haze' },
    { symbol: 'TURB', code: 'AIRMET_TURB', name: 'AIRMET Turbulence', category: 'airmet',
      description: 'Moderate turbulence, sustained surface winds 30+ knots' },
    { symbol: 'ICE', code: 'AIRMET_ICE', name: 'AIRMET Icing', category: 'airmet',
      description: 'Moderate icing conditions' },
    { symbol: 'LLWS', code: 'LLWS', name: 'Low Level Wind Shear', category: 'airmet',
      description: 'Wind shear below 2000 feet AGL, non-convective' },
    { symbol: 'CONVECTIVE', code: 'SIGMET_CONV', name: 'SIGMET Convective', category: 'sigmet',
      description: 'Severe or greater turbulence, severe icing, low-level wind shear' }
];

// Category labels for weather symbols
const weatherSymbolCategories = {
    'flight_category': 'FLIGHT CATEGORIES',
    'cloud_coverage': 'CLOUD COVERAGE',
    'cloud_type': 'CLOUD TYPES',
    'front': 'FRONTS & BOUNDARIES',
    'precipitation': 'PRECIPITATION',
    'obscuration': 'OBSCURATIONS',
    'other_phenomena': 'OTHER PHENOMENA',
    'descriptor': 'DESCRIPTORS',
    'intensity': 'INTENSITY',
    'wind': 'WIND',
    'pressure': 'PRESSURE SYSTEMS',
    'pirep_turbulence': 'PIREP - TURBULENCE',
    'pirep_icing': 'PIREP - ICING',
    'map_feature': 'MAP FEATURES',
    'navaid': 'NAVIGATIONAL AIDS',
    'turbulence': 'TURBULENCE',
    'icing': 'ICING',
    'lightning': 'LIGHTNING',
    'airmet': 'AIRMET',
    'sigmet': 'SIGMET'
};

function searchWeatherSymbols() {
    const searchInputEl = document.getElementById('symbol-search');
    const searchInput = searchInputEl.value.trim().toUpperCase();
    const resultsEl = document.getElementById('symbol-results');
    const clearBtn = document.getElementById('symbol-clear-btn');
    
    // Show/hide clear button
    if (clearBtn) {
        clearBtn.style.display = searchInputEl.value ? 'block' : 'none';
    }
    
    if (!searchInput) {
        displayAllWeatherSymbols();
        return;
    }
    
    // Find matching symbols
    const matches = weatherSymbols.filter(item => 
        item.code.toUpperCase().includes(searchInput) ||
        item.name.toUpperCase().includes(searchInput) ||
        item.description.toUpperCase().includes(searchInput) ||
        (item.metarCodes && item.metarCodes.some(code => code.includes(searchInput)))
    );
    
    if (matches.length === 0) {
        resultsEl.innerHTML = '<div style="color:var(--sub-text); padding:20px; text-align:center;">No matching weather symbols found</div>';
        return;
    }
    
    // Display source links and result count at top
    let html = `
        <div style="margin-bottom:16px; padding:10px; background:#1c1c1e; border-radius:8px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                <div style="font-size:11px; color:var(--sub-text);">
                    <strong style="color:var(--accent);">${matches.length}</strong> result${matches.length !== 1 ? 's' : ''} found
                </div>
                <div style="display:flex; gap:6px;">
                    <button onclick="window.open('https://www.blondsinaviation.com/wp-content/uploads/2019/05/NOAA-Legends-1407.pdf', '_blank')" 
                            class="tool-btn" 
                            style="background:var(--accent); border:none; color:#000; padding:4px 8px; font-size:10px; font-weight:700;">
                        NOAA PDF ↗
                    </button>
                </div>
            </div>
        </div>
    `;
    
    matches.forEach(item => {
        const bgColor = item.color ? item.color + '20' : '#1c1c1e'; // Add transparency to colored items
        const borderColor = item.color ? item.color : '#333';
        
        html += `
            <div style="background:${bgColor}; padding:12px; border-radius:8px; margin-bottom:8px; border:1px solid ${borderColor};">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:6px;">
                    <div style="min-width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:#2c2c2e; border-radius:6px; color:#fff;">${item.symbol}</div>
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <div style="font-size:14px; font-weight:800; color:var(--accent); font-family:'SF Mono',monospace;">${item.code}</div>
                            <div style="font-size:13px; font-weight:700; color:#fff;">${item.name}</div>
                            ${item.metarCodes ? `<div style="font-size:10px; color:#666;">METAR: ${item.metarCodes.join(', ')}</div>` : ''}
                        </div>
                        <div style="font-size:12px; color:var(--sub-text); margin-top:4px; line-height:1.5;">${item.description}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    resultsEl.innerHTML = html;
}

function clearSymbolSearch() {
    const searchInput = document.getElementById('symbol-search');
    const clearBtn = document.getElementById('symbol-clear-btn');
    searchInput.value = '';
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    displayAllWeatherSymbols();
}

function displayAllWeatherSymbols() {
    const resultsEl = document.getElementById('symbol-results');
    
    // Group by category
    const grouped = {};
    weatherSymbols.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });
    
    // Display source links at top
    let html = `
        <div style="margin-bottom:16px; padding:10px; background:#1c1c1e; border-radius:8px;">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                <div style="font-size:11px; color:var(--sub-text);">
                    Comprehensive aviation weather symbols database
                </div>
                <div style="display:flex; gap:6px;">
                    <button onclick="window.open('https://www.blondsinaviation.com/wp-content/uploads/2019/05/NOAA-Legends-1407.pdf', '_blank')" 
                            class="tool-btn" 
                            style="background:var(--accent); border:none; color:#000; padding:4px 8px; font-size:10px; font-weight:700;">
                        NOAA PDF ↗
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Priority categories to show first
    const priorityCategories = [
        'flight_category', 'cloud_coverage', 'precipitation', 'front', 
        'pirep_turbulence', 'pirep_icing', 'obscuration', 'wind',
        'map_feature', 'navaid'
    ];
    
    // Display priority categories
    priorityCategories.forEach(category => {
        if (grouped[category]) {
            const label = weatherSymbolCategories[category] || category.toUpperCase();
            html += `<div style="font-size:13px; font-weight:700; color:var(--accent); margin:20px 0 12px 0;">${label}</div>`;
            
            grouped[category].forEach(item => {
                const bgColor = item.color ? item.color + '20' : '#1c1c1e';
                const borderColor = item.color ? item.color : '#333';
                
                html += `
                    <div style="background:${bgColor}; padding:10px; border-radius:6px; margin-bottom:6px; border:1px solid ${borderColor};">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:#2c2c2e; border-radius:6px; color:#fff;">${item.symbol}</div>
                            <div style="flex:1;">
                                <div style="font-size:12px; font-weight:700; color:#fff; margin-bottom:2px;">${item.code} - ${item.name}</div>
                                <div style="font-size:11px; color:var(--sub-text);">${item.description}</div>
                                ${item.metarCodes ? `<div style="font-size:10px; color:#666; margin-top:2px;">METAR: ${item.metarCodes.join(', ')}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    });
    
    // Add "Show All Categories" button
    html += `
        <div style="margin-top:20px; text-align:center;">
            <button onclick="displayAllSymbolCategories()" class="tool-btn" style="background:#1c1c1e; border:1px solid #333; color:var(--accent); padding:10px 20px; font-size:12px; font-weight:700;">
                SHOW ALL CATEGORIES ↓
            </button>
        </div>
    `;
    
    resultsEl.innerHTML = html;
}

function displayAllSymbolCategories() {
    const resultsEl = document.getElementById('symbol-results');
    
    // Group by category
    const grouped = {};
    weatherSymbols.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });
    
    // Display source links at top
    let html = `
        <div style="margin-bottom:16px; padding:10px; background:#1c1c1e; border-radius:8px;">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                <div style="font-size:11px; color:var(--sub-text);">
                    All ${weatherSymbols.length} weather symbols
                </div>
                <div style="display:flex; gap:6px;">
                    <button onclick="window.open('https://www.blondsinaviation.com/wp-content/uploads/2019/05/NOAA-Legends-1407.pdf', '_blank')" 
                            class="tool-btn" 
                            style="background:var(--accent); border:none; color:#000; padding:4px 8px; font-size:10px; font-weight:700;">
                        NOAA PDF ↗
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Sort categories for consistent display
    const sortedCategories = Object.keys(grouped).sort();
    
    sortedCategories.forEach(category => {
        const label = weatherSymbolCategories[category] || category.toUpperCase();
        html += `<div style="font-size:13px; font-weight:700; color:var(--accent); margin:20px 0 12px 0;">${label} (${grouped[category].length})</div>`;
        
        grouped[category].forEach(item => {
            const bgColor = item.color ? item.color + '20' : '#1c1c1e';
            const borderColor = item.color ? item.color : '#333';
            
            html += `
                <div style="background:${bgColor}; padding:10px; border-radius:6px; margin-bottom:6px; border:1px solid ${borderColor};">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:#2c2c2e; border-radius:6px; color:#fff;">${item.symbol}</div>
                        <div style="flex:1;">
                            <div style="font-size:12px; font-weight:700; color:#fff; margin-bottom:2px;">${item.code} - ${item.name}</div>
                            <div style="font-size:11px; color:var(--sub-text);">${item.description}</div>
                            ${item.metarCodes ? `<div style="font-size:10px; color:#666; margin-top:2px;">METAR: ${item.metarCodes.join(', ')}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
    });
    
    // Add button to return to main view
    html += `
        <div style="margin-top:20px; text-align:center;">
            <button onclick="displayAllWeatherSymbols()" class="tool-btn" style="background:#1c1c1e; border:1px solid #333; color:var(--accent); padding:10px 20px; font-size:12px; font-weight:700;">
                ← BACK TO MAIN VIEW
            </button>
        </div>
    `;
    
    resultsEl.innerHTML = html;
}

// ============================================================================
// AEROSEARCH NATIVE — Offline-first Aviation Abbreviations Database
// Replaces external iframe. Fetches 5 Google Sheet sources, caches to
// localStorage (7-day TTL), fully functional offline after first sync.
// ============================================================================

const AERO_SOURCES = {
    faa:    { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTZQu_pDVoituFYYch_vc9mxKX2KBt4gzY7HHgYmz8x8KrAGDkh4s5KgIxtdVpq_ZuyG_sUNxaA-u0/pub?output=csv', label: 'FAA'    },
    sofema: { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAxE1adAbm_uAC9rK1raBK0Fx9m-dhO8wU9yEb2FziL244tYoovtYSNkGVoLt_R1IXHk2KEC-_AjIb/pub?output=csv',    label: 'SOFEMA' },
    jepp:   { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRubNpKZskFJkEOA1_UhEbNUY12mYuhANXemM3CzVPH5tivDKDGEUzg_x-RmHURHMjKmLA0TE-FVUvz/pub?output=csv',    label: 'JEPP'   },
    notam:  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQdYQqsxvlVosMPZmMm8Wb1U6PnZTToHv1LPjtJlIbp3K-_vXpatwCvXtlH_YDrextjdgbNn9heA2gR/pub?output=csv',    label: 'NOTAM'  },
    g1000:  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSvvDiyd4kJ9BYpogwiNcJv9j9UE1zrCUZL7oJhXRDkFsEw_nR6AhKtoKXfwfRTZcMGCJw3ktz8qa14/pub?output=csv',    label: 'G1000'  },
};

const AERO_KEY_DATA  = 'aerosearch_v2_data';
const AERO_KEY_TS    = 'aerosearch_v2_ts';
const AERO_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const AERO_MAX_CARDS = 80;

const AERO_SOURCE_COLORS = {
    FAA:    { bg: '#1a3a5c', border: '#0a84ff', text: '#0a84ff' },
    SOFEMA: { bg: '#3a2a00', border: '#ff9f0a', text: '#ff9f0a' },
    JEPP:   { bg: '#2a1a3a', border: '#bf5af2', text: '#bf5af2' },
    NOTAM:  { bg: '#3a1a1a', border: '#ff453a', text: '#ff453a' },
    G1000:  { bg: '#0f2e22', border: '#30d158', text: '#30d158' },
};

let _aeroData        = [];
let _aeroReady       = false;
let _aeroSearchTimer = null;
let _aeroActiveSource = 'all';

// ── Entry point ───────────────────────────────────────────────────────────
function openAbbreviations() {
    const container = document.getElementById('abbrev-content');
    if (!container) return;

    // Clean up previous scroll listener if re-opening
    const oldRoot = document.getElementById('aero-root');
    if (oldRoot?._aeroScrollCleanup) { oldRoot._aeroScrollCleanup(); }

    if (!_aeroReady) {
        _aeroReady = true;
        _aeroInjectStyles();
        _aeroInjectUI(container);
        _aeroLoadData(false);
    } else if (_aeroData.length > 0) {
        _aeroRender();
    }
}

// ── Inject animation + pill styles once ──────────────────────────────────
function _aeroInjectStyles() {
    if (document.getElementById('aero-styles')) return;
    const s = document.createElement('style');
    s.id = 'aero-styles';
    s.textContent = `
        @keyframes aeroCardIn {
            from { opacity:0; transform:translateY(8px); }
            to   { opacity:1; transform:translateY(0); }
        }
        .aero-pill {
            font-size:11px; font-weight:800; letter-spacing:0.3px;
            padding:5px 11px; border-radius:20px; cursor:pointer;
            transition:opacity 0.15s; opacity:0.5;
            text-transform:uppercase; white-space:nowrap;
        }
        .aero-pill-active { opacity:1 !important; }
        #aero-search-wrap:focus-within {
            border-color:#0a84ff !important;
            box-shadow:0 0 0 3px rgba(10,132,255,0.15) !important;
        }
    `;
    document.head.appendChild(s);
}

// ── Build UI skeleton ─────────────────────────────────────────────────────
function _aeroInjectUI(container) {
    const sourcePills = Object.values(AERO_SOURCES).map(s => {
        const c = AERO_SOURCE_COLORS[s.label];
        return `<button class="aero-pill" data-source="${s.label}"
                    style="background:${c.bg};border:1px solid ${c.border};color:${c.text};"
                    onclick="_aeroSetSource('${s.label}',this)">${s.label}</button>`;
    }).join('');

    container.innerHTML = `
    <div id="aero-root" style="display:flex;flex-direction:column;gap:0;">

        <!-- ── STICKY HEADER ── always visible, correct background -->
        <div id="aero-header"
             style="position:sticky;top:0;z-index:20;
                    background:var(--bg);
                    padding:0 0 6px;
                    transition:padding 0.25s;">

            <!-- Search bar — always visible -->
            <div id="aero-search-wrap"
                 style="display:flex;align-items:center;background:#1c1c1e;
                        border:1.5px solid #333;border-radius:12px;padding:4px 10px;
                        margin-bottom:8px;transition:border-color 0.2s,box-shadow 0.2s;">
                <span style="font-size:14px;margin-right:6px;opacity:0.4;">⌕</span>
                <input id="aero-input" type="text"
                       placeholder="Search acronyms or definitions…"
                       autocomplete="off" autocorrect="off" spellcheck="false"
                       style="flex:1;border:none;background:transparent;color:#fff;
                              font-size:15px;font-weight:500;padding:9px 0;outline:none;"
                       oninput="_aeroOnInput()" />
                <button id="aero-clear" onclick="_aeroClear()"
                        style="display:none;border:none;background:none;color:#888;
                               font-size:18px;padding:4px 6px;cursor:pointer;line-height:1;">×</button>
            </div>

            <!-- Collapsible filters -->
            <div id="aero-filters"
                 style="overflow:hidden;max-height:120px;
                        transition:max-height 0.3s ease,opacity 0.3s ease;
                        opacity:1;">

                <!-- Source pills -->
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                    <button class="aero-pill aero-pill-active" data-source="all"
                            style="background:#1a3050;border:1px solid #0a84ff;color:#0a84ff;"
                            onclick="_aeroSetSource('all',this)">All</button>
                    ${sourcePills}
                </div>

                <!-- Mode + Sort -->
                <div style="display:flex;gap:8px;margin-bottom:6px;">
                    <select id="aero-mode"
                            style="flex:1;background:#1c1c1e;border:1px solid #333;border-radius:8px;
                                   color:#fff;font-size:12px;font-weight:600;padding:8px 10px;
                                   cursor:pointer;outline:none;" onchange="_aeroRender()">
                        <option value="contains">Contains</option>
                        <option value="starts">Starts with</option>
                        <option value="exact">Exact match</option>
                    </select>
                    <select id="aero-sort"
                            style="flex:1;background:#1c1c1e;border:1px solid #333;border-radius:8px;
                                   color:#fff;font-size:12px;font-weight:600;padding:8px 10px;
                                   cursor:pointer;outline:none;" onchange="_aeroRender()">
                        <option value="default">Original order</option>
                        <option value="az">A → Z</option>
                        <option value="za">Z → A</option>
                    </select>
                </div>
            </div><!-- /#aero-filters -->

            <!-- Count + sync -->
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:0 2px;margin-top:2px;">
                <div id="aero-count" style="font-size:12px;color:#555;font-weight:600;"></div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div id="aero-sync-info" style="font-size:11px;color:#555;"></div>
                    <button id="aero-sync-btn" onclick="_aeroLoadData(true)"
                            style="font-size:11px;color:#0a84ff;background:none;border:none;
                                   cursor:pointer;padding:2px 0;font-weight:700;">↻ Sync</button>
                </div>
            </div>
        </div><!-- /#aero-header -->

        <!-- Results list -->
        <div id="aero-results" style="display:flex;flex-direction:column;gap:8px;padding-bottom:60px;">
            <div style="text-align:center;padding:40px 0;">
                <div style="width:28px;height:28px;border:3px solid #222;border-top-color:#0a84ff;
                            border-radius:50%;animation:spin 0.9s linear infinite;margin:0 auto 12px;"></div>
                <div style="font-size:12px;color:#555;">Loading databases…</div>
            </div>
        </div>

    </div>`;

    setTimeout(() => {
        document.getElementById('aero-input')?.focus();

        // Restore saved default search mode
        const savedMode = localStorage.getItem('aero_default_mode') || 'starts';
        const modeEl = document.getElementById('aero-mode');
        if (modeEl) modeEl.value = savedMode;

        // Offset sticky header below tools-extension-header
        const toolsHdr = document.getElementById('tools-extension-header');
        const aeroHdr  = document.getElementById('aero-header');
        if (toolsHdr && aeroHdr) {
            const hdrH = toolsHdr.offsetHeight + 16; // +16 for margin-bottom
            aeroHdr.style.top = hdrH + 'px';
        }

        // Inject back-to-top button as sibling inside the panel (not inside scroll content)
        let topBtn = document.getElementById('aero-top-btn');
        if (!topBtn) {
            topBtn = document.createElement('button');
            topBtn.id = 'aero-top-btn';
            topBtn.onclick = () => {
                topBtn.style.opacity = '0';
                topBtn.style.pointerEvents = 'none';
                topBtn.style.transform = 'translateY(8px)';
                _aeroScrollTop();
            };
            topBtn.textContent = '↑';
            topBtn.style.cssText = `position:fixed;bottom:max(28px,env(safe-area-inset-bottom));
                left:20px;width:40px;height:40px;border-radius:12px;
                background:#1c1c1e;border:1px solid #444;color:#0a84ff;
                font-size:18px;font-weight:700;cursor:pointer;z-index:3100;
                opacity:0;pointer-events:none;
                transition:opacity 0.2s,transform 0.2s;
                transform:translateY(8px);
                display:flex;align-items:center;justify-content:center;`;
            document.body.appendChild(topBtn);
        }

        // Scroll-driven collapse + back-to-top
        const scrollEl = document.getElementById('tools-extension-panel');
        if (!scrollEl) return;
        let _aeroLastScrollY = 0;
        let _aeroFiltersVisible = true;

        function _aeroOnScroll() {
            const sy    = scrollEl.scrollTop;
            const going = sy - _aeroLastScrollY;
            _aeroLastScrollY = sy;

            // Collapse filters on scroll down > 60px
            if (going > 0 && sy > 60 && _aeroFiltersVisible) {
                _aeroFiltersVisible = false;
                const f = document.getElementById('aero-filters');
                if (f) { f.style.maxHeight = '0'; f.style.opacity = '0'; }
            }
            // Expand filters on scroll up or near top
            if ((going < 0 || sy < 30) && !_aeroFiltersVisible) {
                _aeroFiltersVisible = true;
                const f = document.getElementById('aero-filters');
                if (f) { f.style.maxHeight = '120px'; f.style.opacity = '1'; }
            }

            // Back-to-top visibility
            const btn = document.getElementById('aero-top-btn');
            if (btn) {
                if (sy > 200) {
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                    btn.style.transform = 'translateY(0)';
                } else {
                    btn.style.opacity = '0';
                    btn.style.pointerEvents = 'none';
                    btn.style.transform = 'translateY(8px)';
                }
            }
        }

        scrollEl.addEventListener('scroll', _aeroOnScroll, { passive: true });
        // Cleanup ref on root
        const root = document.getElementById('aero-root');
        if (root) root._aeroScrollCleanup = () => {
            scrollEl.removeEventListener('scroll', _aeroOnScroll);
            document.getElementById('aero-top-btn')?.remove();
        };
    }, 120);
}

// ── Source filter ─────────────────────────────────────────────────────────
function _aeroScrollTop() {
    const el = document.getElementById('tools-extension-panel');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
}

function _aeroSetSource(source, el) {
    _aeroActiveSource = source;
    document.querySelectorAll('.aero-pill').forEach(p => {
        p.classList.remove('aero-pill-active');
        p.style.opacity = '0.5';
    });
    el.classList.add('aero-pill-active');
    el.style.opacity = '1';
    _aeroRender();
}

function _aeroOnInput() {
    const val = document.getElementById('aero-input')?.value || '';
    const clearBtn = document.getElementById('aero-clear');
    if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';
    clearTimeout(_aeroSearchTimer);
    _aeroSearchTimer = setTimeout(_aeroRender, 150);
}

function _aeroClear() {
    const inp = document.getElementById('aero-input');
    if (inp) { inp.value = ''; inp.focus(); }
    const clearBtn = document.getElementById('aero-clear');
    if (clearBtn) clearBtn.style.display = 'none';
    _aeroRender();
}

// ── Data loading ──────────────────────────────────────────────────────────
async function _aeroLoadData(forceRefresh) {
    if (!forceRefresh) {
        try {
            const ts     = parseInt(localStorage.getItem(AERO_KEY_TS) || '0');
            const cached = localStorage.getItem(AERO_KEY_DATA);
            if (cached && ts > 0 && (Date.now() - ts) < AERO_CACHE_TTL) {
                _aeroData = JSON.parse(cached);
                _aeroUpdateSyncInfo(ts, false);
                _aeroRender();
                return;
            }
        } catch(e) {}
    }

    if (!navigator.onLine) {
        try {
            const cached = localStorage.getItem(AERO_KEY_DATA);
            const ts     = parseInt(localStorage.getItem(AERO_KEY_TS) || '0');
            if (cached) {
                _aeroData = JSON.parse(cached);
                _aeroUpdateSyncInfo(ts, true);
                _aeroRender();
                return;
            }
        } catch(e) {}
        _aeroShowError('No cached data. Connect to the internet to download the database.');
        return;
    }

    _aeroShowLoading();
    _aeroUpdateSyncBtn('Syncing…', true);

    const keys    = Object.keys(AERO_SOURCES);
    const results = await Promise.allSettled(keys.map(k => _aeroFetchSource(k)));

    let loaded = [];
    results.forEach(r => { if (r.status === 'fulfilled') loaded = loaded.concat(r.value); });

    if (loaded.length === 0) {
        try {
            const cached = localStorage.getItem(AERO_KEY_DATA);
            const ts = parseInt(localStorage.getItem(AERO_KEY_TS) || '0');
            if (cached) {
                _aeroData = JSON.parse(cached);
                _aeroUpdateSyncInfo(ts, true);
                _aeroRender();
                _aeroUpdateSyncBtn('↻ Sync', false);
                return;
            }
        } catch(e) {}
        _aeroShowError('Could not load databases. Check your connection and tap ↻ Sync to retry.');
        _aeroUpdateSyncBtn('↻ Sync', false);
        return;
    }

    _aeroData = loaded;
    try {
        localStorage.setItem(AERO_KEY_DATA, JSON.stringify(loaded));
        localStorage.setItem(AERO_KEY_TS, String(Date.now()));
    } catch(e) { console.warn('[AeroSearch] Cache write failed:', e); }

    _aeroUpdateSyncInfo(Date.now(), false);
    _aeroUpdateSyncBtn('↻ Sync', false);
    _aeroRender();
}

async function _aeroFetchSource(key) {
    const src = AERO_SOURCES[key];
    const res  = await fetch(src.url);
    const text = await res.text();
    return _aeroParseCSV(text, src.label);
}

function _aeroParseCSV(text, sourceLabel) {
    const rows = [];
    const lines = text.split(/\r?\n/);
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const cols = [];
        let val = '', inQ = false;
        for (let j = 0; j < line.length; j++) {
            const c = line[j];
            if (c === '"') {
                if (inQ && line[j+1] === '"') { val += '"'; j++; }
                else inQ = !inQ;
            } else if (c === ',' && !inQ) { cols.push(val.trim()); val = ''; }
            else val += c;
        }
        cols.push(val.trim());
        if (cols.length >= 2 && cols[0]) {
            rows.push({
                acronym:  _aeroClean(cols[0]),
                meaning:  _aeroClean(cols[1]),
                category: _aeroClean(cols[2]) || 'General',
                source:   sourceLabel,
            });
        }
    }
    return rows;
}

function _aeroClean(s) {
    if (!s) return '';
    s = s.trim();
    if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1,-1).trim();
    return s;
}

// ── Render results ────────────────────────────────────────────────────────
function _aeroRender() {
    const resultsEl = document.getElementById('aero-results');
    const countEl   = document.getElementById('aero-count');
    if (!resultsEl) return;

    const term = (document.getElementById('aero-input')?.value || '').trim().toLowerCase();
    const mode = document.getElementById('aero-mode')?.value  || 'starts';
    const sort = document.getElementById('aero-sort')?.value  || 'default';

    let items = _aeroData.slice();

    if (_aeroActiveSource !== 'all') items = items.filter(i => i.source === _aeroActiveSource);

    if (term) {
        items = items.filter(i => {
            const a = i.acronym.toLowerCase();
            const m = i.meaning.toLowerCase();
            if (mode === 'starts') return a.startsWith(term);
            if (mode === 'exact')  return a === term;
            return a.includes(term) || m.includes(term);
        });
    }

    if (sort === 'az') items.sort((a,b) => a.acronym.localeCompare(b.acronym));
    else if (sort === 'za') items.sort((a,b) => b.acronym.localeCompare(a.acronym));

    if (countEl) countEl.innerHTML = items.length > 0
        ? `<span style="color:#0a84ff;font-weight:800;">${items.length}</span> results`
        : '0 results';

    if (items.length === 0) {
        resultsEl.innerHTML = `
            <div style="text-align:center;padding:50px 20px;">
                <div style="font-size:36px;opacity:0.3;margin-bottom:12px;">⌕</div>
                <div style="color:#555;font-size:14px;font-weight:600;">No results</div>
                <div style="color:#444;font-size:12px;margin-top:4px;">
                    ${term ? 'Try a different term or search mode' : 'Select a database to browse'}
                </div>
            </div>`;
        return;
    }

    const frag    = document.createDocumentFragment();
    const display = items.slice(0, AERO_MAX_CARDS);

    display.forEach((item, idx) => {
        const c = AERO_SOURCE_COLORS[item.source] || AERO_SOURCE_COLORS.FAA;

        let meaningHTML = _aeroEsc(item.meaning);
        let acronymHTML = _aeroEsc(item.acronym);
        if (term && mode === 'contains') {
            const rx = new RegExp(`(${_aeroEscRx(term)})`, 'gi');
            const hl = '<mark style="background:rgba(10,132,255,0.2);color:#0a84ff;border-radius:2px;padding:0 2px;">$1</mark>';
            meaningHTML = meaningHTML.replace(rx, hl);
            acronymHTML = acronymHTML.replace(rx, hl);
        }

        const card = document.createElement('div');
        card.style.cssText = `background:#1c1c1e;border:1px solid #2a2a2a;border-radius:12px;
                              padding:14px 16px;animation:aeroCardIn 0.25s ease both;`;
        card.style.animationDelay = `${Math.min(idx * 0.025, 0.5)}s`;
        card.innerHTML = `
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
                <div style="font-family:monospace;font-weight:800;font-size:15px;
                            color:#fff;line-height:1.3;word-break:break-all;">${acronymHTML}</div>
                <span style="flex-shrink:0;font-size:10px;font-weight:800;letter-spacing:0.5px;
                             text-transform:uppercase;padding:3px 9px;border-radius:6px;
                             background:${c.bg};border:1px solid ${c.border};color:${c.text};">
                    ${item.source}
                </span>
            </div>
            <div style="margin-top:7px;font-size:13px;line-height:1.55;color:rgba(255,255,255,0.8);">
                ${meaningHTML}
            </div>
            ${item.category && item.category !== 'General'
                ? `<div style="display:inline-block;margin-top:8px;font-size:10px;font-weight:700;
                               color:#555;text-transform:uppercase;letter-spacing:0.5px;
                               padding:2px 7px;border:1px solid #2a2a2a;border-radius:5px;">
                       ${_aeroEsc(item.category)}
                   </div>`
                : ''}`;
        frag.appendChild(card);
    });

    resultsEl.innerHTML = '';
    resultsEl.appendChild(frag);

    if (items.length > AERO_MAX_CARDS) {
        const hint = document.createElement('div');
        hint.style.cssText = 'text-align:center;padding:20px;color:#444;font-size:12px;';
        hint.textContent = `Showing ${AERO_MAX_CARDS} of ${items.length} — refine your search`;
        resultsEl.appendChild(hint);
    }
}

// ── UI helpers ────────────────────────────────────────────────────────────
function _aeroShowLoading() {
    const el = document.getElementById('aero-results');
    if (el) el.innerHTML = `
        <div style="text-align:center;padding:40px 0;">
            <div style="width:28px;height:28px;border:3px solid #222;border-top-color:#0a84ff;
                        border-radius:50%;animation:spin 0.9s linear infinite;margin:0 auto 12px;"></div>
            <div style="font-size:12px;color:#555;">Syncing databases…</div>
        </div>`;
}

function _aeroShowError(msg) {
    const el = document.getElementById('aero-results');
    if (el) el.innerHTML = `
        <div style="text-align:center;padding:40px 20px;">
            <div style="font-size:32px;margin-bottom:12px;">📡</div>
            <div style="color:#ff453a;font-size:13px;font-weight:700;margin-bottom:8px;">Unavailable Offline</div>
            <div style="color:#555;font-size:12px;line-height:1.6;">${msg}</div>
        </div>`;
    const c = document.getElementById('aero-count');
    if (c) c.textContent = '';
}

function _aeroUpdateSyncInfo(ts, isStale) {
    const el = document.getElementById('aero-sync-info');
    if (!el || !ts) return;
    const mins = Math.round((Date.now() - ts) / 60000);
    const age  = mins < 2    ? 'just now'
               : mins < 60   ? `${mins}m ago`
               : mins < 1440 ? `${Math.round(mins/60)}h ago`
               : `${Math.round(mins/1440)}d ago`;
    el.innerHTML = isStale
        ? `<span style="color:#ff9f0a;">⚠ Offline · cached ${age}</span>`
        : `<span style="color:#444;">Synced ${age}</span>`;
}

function _aeroUpdateSyncBtn(label, disabled) {
    const btn = document.getElementById('aero-sync-btn');
    if (!btn) return;
    btn.textContent = label;
    btn.style.opacity       = disabled ? '0.4' : '1';
    btn.style.pointerEvents = disabled ? 'none' : 'auto';
}

function _aeroEsc(s)   { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _aeroEscRx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

// ============================================================================
// E6B FLIGHT COMPUTER
// ============================================================================

function calcE6B() {
    const uQnh  = document.getElementById('unitQnh').value;
    const uTemp = document.getElementById('unitTemp').value;
    document.getElementById('e6bAlt').placeholder  = "0";
    document.getElementById('e6bQnh').placeholder  = (uQnh === 'inhg') ? "29.92" : "1013";
    document.getElementById('e6bTemp').placeholder = (uTemp === 'f') ? "59" : "15";
    document.getElementById('e6bDew').placeholder  = (uTemp === 'f') ? "50" : "10";

    let alt     = parseFloat(document.getElementById('e6bAlt').value) || 0;
    let ias     = parseFloat(document.getElementById('e6bIas').value) || 0;
    let rawQnh  = parseFloat(document.getElementById('e6bQnh').value);
    let rawTemp = parseFloat(document.getElementById('e6bTemp').value);
    let rawDew  = parseFloat(document.getElementById('e6bDew').value);

    if (isNaN(rawQnh))  rawQnh  = (uQnh === 'inhg') ? 29.92 : 1013;
    if (isNaN(rawTemp)) rawTemp = (uTemp === 'f') ? 59 : 15;

    let qnhHpa = uQnh === 'inhg' ? rawQnh * 33.8639 : rawQnh;
    let tempC  = uTemp === 'f' ? (rawTemp - 32) * 5/9 : rawTemp;
    let dewC   = isNaN(rawDew) ? null : (uTemp === 'f' ? (rawDew - 32) * 5/9 : rawDew);

    const pa      = alt + (1013.25 - qnhHpa) * 30;
    const isaTemp = 15 - (2 * (pa / 1000));
    const da      = pa + 120 * (tempC - isaTemp);
    const tas     = ias * (1 + ((alt / 1000) * 0.02));
    let cloudBase = "--", freezingLvl = "--";
    if (dewC !== null) { cloudBase = `${Math.round(((tempC - dewC) / 2.5) * 1000)} ft`; }
    if (tempC > 0) { freezingLvl = `${Math.round(alt + (tempC / 2) * 1000)} ft`; } else { freezingLvl = "Surface"; }

    document.getElementById('resDA').innerText    = `${Math.round(da)} ft`;
    document.getElementById('resTAS').innerText   = `${Math.round(tas)} kt`;
    document.getElementById('resCloud').innerText = cloudBase;
    document.getElementById('resFrz').innerText   = freezingLvl;
    const daEl = document.getElementById('resDA');
    daEl.style.color = da > alt + 2000 ? "var(--warn)" : "var(--accent)";
}

function openUNDE6B() {
    const url = 'https://mediafiles.aero.und.edu/aero.und.edu/aviation/trainers/e6b/';
    const resultEl = document.getElementById('e6b-trainer-content');
    
    // Embed the E6B trainer in an iframe - maximized for full screen usage
    resultEl.innerHTML = `
        <iframe src="${url}" 
                style="width:100%; height:calc(100vh - 120px); border:1px solid #333; border-radius:8px; background:#fff;">
        </iframe>
    `;
}

// ============================================================================
// WIND BARB GENERATOR
// ============================================================================

/**
 * Generate SVG wind barb based on direction and speed
 * @param {number} direction - Wind direction in degrees (0-360, wind FROM)
 * @param {number} speed - Wind speed in knots
 * @param {number} size - Size of the SVG (default 24)
 * @returns {string} SVG string for wind barb
 * 
 * Wind Barb Rules:
 * - Calm: Circle (speed < 3 kt)
 * - Half barb: 5 knots (short line perpendicular to shaft)
 * - Full barb: 10 knots (long line perpendicular to shaft)
 * - Pennant: 50 knots (triangular flag)
 * - Barbs drawn on "high pressure" side (clockwise from shaft in NH)
 * - Shaft points TOWARD wind source (wind FROM direction)
 */
function generateWindBarb(direction, speed, size = 24) {
    const center = size / 2;
    const shaftLength = size * 0.6; // 60% of size
    
    // Calm wind (< 3 knots)
    if (speed < 3) {
        return `<svg viewBox="0 0 ${size} ${size}" width="20" height="20">
            <circle cx="${center}" cy="${center}" r="${size * 0.25}" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>`;
    }
    
    // Calculate components
    const pennants = Math.floor(speed / 50);
    const remainder = speed % 50;
    const fullBarbs = Math.floor(remainder / 10);
    const halfBarb = (remainder % 10) >= 5 ? 1 : 0;
    
    // Convert direction to radians (wind FROM, so rotate by direction)
    // Add 180° because shaft points toward source, not away
    const angle = ((direction + 180) % 360) * Math.PI / 180;
    
    // Calculate shaft endpoint
    const shaftEndX = center + Math.cos(angle) * shaftLength;
    const shaftEndY = center + Math.sin(angle) * shaftLength;
    
    // Generate barbs/pennants
    let barbs = '';
    let currentDistance = shaftLength; // Start from end of shaft
    const barbSpacing = size * 0.12; // Space between barbs
    const barbLength = size * 0.25; // Length of full barb
    const halfBarbLength = size * 0.15; // Length of half barb
    const pennantWidth = size * 0.2; // Width of pennant
    
    // Barbs are perpendicular to shaft, on the "high pressure" side
    // In northern hemisphere, this is 90° clockwise from shaft direction
    const barbAngle = angle + Math.PI / 2;
    const barbDX = Math.cos(barbAngle);
    const barbDY = Math.sin(barbAngle);
    
    // Draw pennants first (furthest from center)
    for (let i = 0; i < pennants; i++) {
        const baseX = center + Math.cos(angle) * currentDistance;
        const baseY = center + Math.sin(angle) * currentDistance;
        
        const tip1X = baseX + barbDX * barbLength;
        const tip1Y = baseY + barbDY * barbLength;
        
        const base2X = center + Math.cos(angle) * (currentDistance - pennantWidth);
        const base2Y = center + Math.sin(angle) * (currentDistance - pennantWidth);
        
        barbs += `<polygon points="${baseX},${baseY} ${tip1X},${tip1Y} ${base2X},${base2Y}" fill="currentColor"/>`;
        
        currentDistance -= barbSpacing * 1.5; // Extra space after pennant
    }
    
    // Draw full barbs
    for (let i = 0; i < fullBarbs; i++) {
        const baseX = center + Math.cos(angle) * currentDistance;
        const baseY = center + Math.sin(angle) * currentDistance;
        
        const tipX = baseX + barbDX * barbLength;
        const tipY = baseY + barbDY * barbLength;
        
        barbs += `<line x1="${baseX}" y1="${baseY}" x2="${tipX}" y2="${tipY}" stroke="currentColor" stroke-width="2"/>`;
        
        currentDistance -= barbSpacing;
    }
    
    // Draw half barb
    if (halfBarb) {
        const baseX = center + Math.cos(angle) * currentDistance;
        const baseY = center + Math.sin(angle) * currentDistance;
        
        const tipX = baseX + barbDX * halfBarbLength;
        const tipY = baseY + barbDY * halfBarbLength;
        
        barbs += `<line x1="${baseX}" y1="${baseY}" x2="${tipX}" y2="${tipY}" stroke="currentColor" stroke-width="2"/>`;
    }
    
    return `<svg viewBox="0 0 ${size} ${size}" width="20" height="20">
        <line x1="${center}" y1="${center}" x2="${shaftEndX}" y2="${shaftEndY}" stroke="currentColor" stroke-width="2"/>
        ${barbs}
    </svg>`;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize weather terms display when tool is opened
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tools as needed
    console.log('Tools Extension loaded');
});

// ============================================================================
// CROSSWIND / HEADWIND CALCULATOR
// ============================================================================

// ============================================================================
// CROSSWIND CALCULATOR — Visual (canvas compass) + Type-In dual-mode
// ============================================================================

let _cw = {
    rwyHdg: 360, wdir: 360, wspd: 0, gust: null,
    mode: 'visual', limit: 15,
    drag: null, canvasSize: 250,
};
let _cwMoveHandler = null;
let _cwEndHandler  = null;

// ── Entry point ───────────────────────────────────────────────────────────
function cwInit() {
    // Restore saved settings
    const savedMode  = localStorage.getItem('cw_mode')  || 'visual';
    const savedLimit = localStorage.getItem('cw_limit');
    if (savedLimit) {
        _cw.limit = parseFloat(savedLimit);
        const lv = document.getElementById('cw-limit-v');
        const lt = document.getElementById('cw-limit');
        if (lv) lv.value = savedLimit;
        if (lt) lt.value = savedLimit;
    }

    cwSetMode(savedMode, true);

    if (savedMode === 'visual') {
        cwSetupCanvas();
        cwDraw();
        cwUpdateStats();
    }
}

// ── Mode switch ───────────────────────────────────────────────────────────
function cwSetMode(mode, skipSave) {
    _cw.mode = mode;
    if (!skipSave) localStorage.setItem('cw_mode', mode);

    const vis  = document.getElementById('cw-visual-mode');
    const type = document.getElementById('cw-type-mode');
    const btnV = document.getElementById('cw-btn-visual');
    const btnT = document.getElementById('cw-btn-type');

    const activeStyle  = 'background:#0a84ff;color:#fff;';
    const inactiveStyle = 'background:transparent;color:#555;';

    if (mode === 'visual') {
        if (vis)  vis.style.display  = 'block';
        if (type) type.style.display = 'none';
        if (btnV) btnV.style.cssText += activeStyle;
        if (btnT) btnT.style.cssText += inactiveStyle;
        // Slight delay so DOM is visible before canvas setup
        requestAnimationFrame(() => { cwSetupCanvas(); cwDraw(); cwUpdateStats(); });
    } else {
        if (vis)  vis.style.display  = 'none';
        if (type) type.style.display = 'block';
        if (btnV) btnV.style.cssText += inactiveStyle;
        if (btnT) btnT.style.cssText += activeStyle;
    }
}

// ── Canvas setup (HiDPI aware) ────────────────────────────────────────────
function cwSetupCanvas() {
    const canvas = document.getElementById('cw-canvas');
    if (!canvas || canvas.dataset.cwReady === '1') return;

    const dpr  = window.devicePixelRatio || 1;
    const wrap  = document.getElementById('tool-crosswind');
    const avail = (wrap?.offsetWidth || 320) - 70; // leave room for slider
    const size  = Math.min(Math.max(avail, 200), 260);
    _cw.canvasSize = size;

    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width  = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.dataset.cwReady = '1';

    cwBindDrag(canvas);
}

// ── Canvas draw ───────────────────────────────────────────────────────────
function cwDraw() {
    const canvas = document.getElementById('cw-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // safe to call repeatedly

    const S  = _cw.canvasSize;
    const cx = S / 2, cy = S / 2;
    const R  = S / 2 - 5;

    ctx.clearRect(0, 0, S, S);

    // ── Background circle ──
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0d12';
    ctx.fill();
    ctx.strokeStyle = '#252525';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Subtle zone hint rings ──
    // Outer drag zone (wind dir) — very faint orange tint
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(255,159,10,0.025)';
    ctx.fill();
    // Inner drag zone (runway) — very faint blue tint
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.52, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,132,255,0.04)';
    ctx.fill();

    // ── Tick marks ──
    for (let deg = 0; deg < 360; deg += 5) {
        const isMajor = deg % 30 === 0;
        const isMed   = deg % 10 === 0;
        const len  = isMajor ? 13 : isMed ? 7 : 4;
        const rad  = (deg - 90) * Math.PI / 180;
        const x1 = cx + Math.cos(rad) * (R - 1);
        const y1 = cy + Math.sin(rad) * (R - 1);
        const x2 = cx + Math.cos(rad) * (R - 1 - len);
        const y2 = cy + Math.sin(rad) * (R - 1 - len);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isMajor ? '#5a5a5a' : isMed ? '#333' : '#222';
        ctx.lineWidth   = isMajor ? 1.5 : 1;
        ctx.stroke();
    }

    // ── Degree labels at 30° ──
    const lblFont = `bold ${Math.round(S * 0.042)}px 'SF Mono', monospace`;
    ctx.font = lblFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let deg = 0; deg < 360; deg += 30) {
        const rad = (deg - 90) * Math.PI / 180;
        const lr  = R - 21;
        const lx  = cx + Math.cos(rad) * lr;
        const ly  = cy + Math.sin(rad) * lr;
        const isCard = deg % 90 === 0;
        const lbl = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : String(deg);
        ctx.fillStyle = isCard ? '#888' : '#444';
        ctx.fillText(lbl, lx, ly);
    }

    // ── Inner ring separator ──
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.58, 0, Math.PI * 2);
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ══ RUNWAY (rotates with rwyHdg) ══════════════════════════════════════
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(_cw.rwyHdg * Math.PI / 180);

    const rwW = Math.round(S * 0.1);
    const rwH = Math.round(S * 0.44);

    // Runway body
    ctx.fillStyle = '#1c1c1e';
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-rwW / 2, -rwH / 2, rwW, rwH, 4);
    else ctx.rect(-rwW / 2, -rwH / 2, rwW, rwH);
    ctx.fill();
    ctx.stroke();

    // Threshold piano keys
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const sk = 3, sh = 6, sg = 3;
    const total = 4 * sk + 3 * sg;
    for (let i = 0; i < 4; i++) {
        const sx = -total / 2 + i * (sk + sg);
        ctx.fillRect(sx, -rwH / 2 + 4, sk, sh);
        ctx.fillRect(sx,  rwH / 2 - 4 - sh, sk, sh);
    }

    // Center dashes
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, -rwH / 2 + 20);
    ctx.lineTo(0,  rwH / 2 - 20);
    ctx.strokeStyle = '#2e2e2e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Runway numbers
    const rn1 = (Math.round(((((_cw.rwyHdg % 360) + 360) % 360)) / 10) || 36);
    const rn2 = rn1 <= 18 ? rn1 + 18 : rn1 - 18;
    ctx.fillStyle = '#ccc';
    ctx.font = `bold ${Math.round(S * 0.05)}px 'SF Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(rn1).padStart(2, '0'), 0, -rwH / 2 + 24);
    ctx.save();
    ctx.rotate(Math.PI);
    ctx.fillText(String(rn2).padStart(2, '0'), 0, -rwH / 2 + 24);
    ctx.restore();

    // ── Wind component triangles ──
    if (_cw.wspd > 0) {
        const aRad = (_cw.wdir - _cw.rwyHdg) * Math.PI / 180;
        const hw   = _cw.wspd * Math.cos(aRad);
        const xw   = _cw.wspd * Math.sin(aRad);
        const xwAbs = Math.abs(xw);
        const limit = _cw.limit;
        const xwColor = (limit > 0 && xwAbs >= limit) ? '#ff453a' : '#ff9f0a';
        const hwColor = hw < 0 ? '#ff453a' : '#ff9f0a';

        // Headwind / tailwind triangle at active (top) threshold
        const hwSz = Math.max(5, Math.min(13, 3 + Math.abs(hw) * 0.55));
        const hwY  = -rwH / 2 + 34;
        ctx.fillStyle = hwColor;
        ctx.shadowColor = hwColor; ctx.shadowBlur = 8;
        ctx.beginPath();
        if (hw >= 0) {
            ctx.moveTo(0, hwY + hwSz * 1.8);
            ctx.lineTo(-hwSz, hwY);
            ctx.lineTo(hwSz, hwY);
        } else {
            ctx.moveTo(0, hwY);
            ctx.lineTo(-hwSz, hwY + hwSz * 1.8);
            ctx.lineTo(hwSz, hwY + hwSz * 1.8);
        }
        ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;

        // Crosswind triangle on side
        const xwSz = Math.max(5, Math.min(13, 3 + xwAbs * 0.55));
        const xwX  = xw >= 0 ? rwW / 2 + 3 : -rwW / 2 - 3;
        ctx.fillStyle = xwColor;
        ctx.shadowColor = xwColor; ctx.shadowBlur = 8;
        ctx.beginPath();
        if (xw >= 0) {
            ctx.moveTo(xwX - xwSz * 1.8, 0);
            ctx.lineTo(xwX, -xwSz);
            ctx.lineTo(xwX, xwSz);
        } else {
            ctx.moveTo(xwX + xwSz * 1.8, 0);
            ctx.lineTo(xwX, -xwSz);
            ctx.lineTo(xwX, xwSz);
        }
        ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    }

    ctx.restore(); // ─ end runway transform ─

    // ══ WIND DIRECTION INDICATOR (orange triangle on ring) ════════════════
    const wRad = (_cw.wdir - 90) * Math.PI / 180;
    const wTx  = cx + Math.cos(wRad) * (R - 2);
    const wTy  = cy + Math.sin(wRad) * (R - 2);
    ctx.save();
    ctx.translate(wTx, wTy);
    ctx.rotate(wRad + Math.PI); // point inward
    const ts = Math.round(S * 0.034);
    ctx.fillStyle = '#ff9f0a';
    ctx.shadowColor = '#ff9f0a'; ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ts * 1.7, 0);
    ctx.lineTo(-ts * 0.85, -ts);
    ctx.lineTo(-ts * 0.85,  ts);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Center dot ──
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#666';
    ctx.fill();
}

// ── Update stats panel ────────────────────────────────────────────────────
function cwUpdateStats() {
    const rn1 = (Math.round(((((_cw.rwyHdg % 360) + 360) % 360)) / 10) || 36);
    const rn2  = rn1 <= 18 ? rn1 + 18 : rn1 - 18;
    const hdg2 = ((_cw.rwyHdg + 180) % 360) || 360;

    const a1   = (_cw.wdir - _cw.rwyHdg) * Math.PI / 180;
    const hw1  = _cw.wspd * Math.cos(a1);
    const xw1  = _cw.wspd * Math.sin(a1);
    const xw1a = Math.abs(xw1);

    const a2   = (_cw.wdir - hdg2) * Math.PI / 180;
    const hw2  = _cw.wspd * Math.cos(a2);
    const xw2  = _cw.wspd * Math.sin(a2);
    const xw2a = Math.abs(xw2);

    const limit = _cw.limit;

    // Runway 1 labels
    const r1l = document.getElementById('cw-rwy1-label');
    const r1h = document.getElementById('cw-rwy1-hdw');
    const r1x = document.getElementById('cw-rwy1-xw');
    if (r1l) { r1l.textContent = `RWY ${String(rn1).padStart(2,'0')}  HDG ${_cw.rwyHdg}°`; }
    if (r1h) {
        r1h.textContent = `${hw1 >= 0 ? 'Headwind' : 'Tailwind'}: ${Math.abs(hw1).toFixed(1)} kt`;
        r1h.style.color = hw1 < 0 ? '#ff453a' : '#0a84ff';
    }
    if (r1x) {
        r1x.textContent = `X-Wind: ${xw1a.toFixed(1)} kt (${xw1 >= 0 ? 'Right' : 'Left'})`;
        r1x.style.color = (limit > 0 && xw1a >= limit) ? '#ff453a'
                        : (limit > 0 && xw1a >= limit * 0.85) ? '#ff9f0a' : '#30d158';
    }

    // Runway 2 labels
    const r2l = document.getElementById('cw-rwy2-label');
    const r2h = document.getElementById('cw-rwy2-hdw');
    const r2x = document.getElementById('cw-rwy2-xw');
    if (r2l) { r2l.textContent = `RWY ${String(rn2).padStart(2,'0')}  HDG ${hdg2}°`; }
    if (r2h) {
        r2h.textContent = `${hw2 >= 0 ? 'Headwind' : 'Tailwind'}: ${Math.abs(hw2).toFixed(1)} kt`;
        r2h.style.color = hw2 < 0 ? '#ff453a' : '#555';
    }
    if (r2x) {
        r2x.textContent = `X-Wind: ${xw2a.toFixed(1)} kt (${xw2 >= 0 ? 'Right' : 'Left'})`;
        r2x.style.color = '#555';
    }

    // Wind readout
    const rd = document.getElementById('cw-wind-readout');
    if (rd) rd.textContent = `${String(_cw.wdir).padStart(3,'0')}° / ${_cw.wspd} KT${_cw.gust ? ' G' + _cw.gust + ' KT' : ''}`;

    // Status banner
    const stEl = document.getElementById('cw-status-v');
    if (stEl) {
        if (_cw.wspd > 0) {
            stEl.style.display = 'block';
            if (limit > 0 && xw1a >= limit) {
                stEl.textContent = `✗ NO-GO — Crosswind ${xw1a.toFixed(1)} kt exceeds ${limit} kt limit`;
                stEl.style.cssText = 'display:block;text-align:center;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:800;letter-spacing:0.5px;background:rgba(255,69,58,0.15);border:1px solid rgba(255,69,58,0.5);color:#ff453a;margin-bottom:8px;';
            } else if (hw1 < 0) {
                stEl.textContent = `⚠ TAILWIND — ${Math.abs(hw1).toFixed(1)} kt on RWY ${String(rn1).padStart(2,'0')} — Check POH`;
                stEl.style.cssText = 'display:block;text-align:center;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:800;letter-spacing:0.5px;background:rgba(255,159,10,0.15);border:1px solid rgba(255,159,10,0.5);color:#ff9f0a;margin-bottom:8px;';
            } else if (limit > 0) {
                stEl.textContent = `✓ GO — Crosswind ${xw1a.toFixed(1)} kt within ${limit} kt limit`;
                stEl.style.cssText = 'display:block;text-align:center;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:800;letter-spacing:0.5px;background:rgba(48,209,88,0.12);border:1px solid rgba(48,209,88,0.4);color:#30d158;margin-bottom:8px;';
            } else {
                stEl.textContent = `Crosswind ${xw1a.toFixed(1)} kt · ${hw1 >= 0 ? 'Headwind' : 'Tailwind'} ${Math.abs(hw1).toFixed(1)} kt`;
                stEl.style.cssText = 'display:block;text-align:center;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:800;letter-spacing:0.5px;background:rgba(255,255,255,0.04);border:1px solid #2a2a2a;color:#aaa;margin-bottom:8px;';
            }
        } else {
            stEl.style.display = 'none';
        }
    }

    // Gust component row
    if (_cw.gust && _cw.gust > 0) {
        const ga  = (_cw.wdir - _cw.rwyHdg) * Math.PI / 180;
        const ghw = _cw.gust * Math.cos(ga);
        const gxw = _cw.gust * Math.sin(ga);
        const gxa = Math.abs(gxw);
        const gRow = document.getElementById('cw-gust-result-v');
        if (gRow) {
            gRow.style.display = 'block';
            const ghe = document.getElementById('cw-ghw-v'), ghl = document.getElementById('cw-ghw-lbl-v');
            const gxe = document.getElementById('cw-gxw-v'), gxl = document.getElementById('cw-gxw-lbl-v');
            if (ghe)  { ghe.textContent = Math.abs(ghw).toFixed(1); ghe.style.color = ghw < 0 ? '#ff453a' : 'var(--accent)'; }
            if (ghl) ghl.textContent = ghw >= 0 ? 'Gust Headwind' : 'Gust Tailwind ⚠️';
            if (gxe)  { gxe.textContent = gxa.toFixed(1); gxe.style.color = (limit > 0 && gxa >= limit) ? '#ff453a' : 'var(--success)'; }
            if (gxl) gxl.textContent = gxw >= 0 ? 'Gust XW (Right)' : 'Gust XW (Left)';
        }
    } else {
        const gRow = document.getElementById('cw-gust-result-v');
        if (gRow) gRow.style.display = 'none';
    }
}

// ── Event handlers ────────────────────────────────────────────────────────
function cwOnSpeedChange(val) {
    _cw.wspd = parseInt(val) || 0;
    const wspdInp = document.getElementById('cw-wspd');
    if (wspdInp) wspdInp.value = _cw.wspd;
    cwDraw(); cwUpdateStats();
}
function cwOnGustChange(val) {
    _cw.gust = val ? parseFloat(val) : null;
    const gustInp = document.getElementById('cw-gust');
    if (gustInp) gustInp.value = val;
    cwDraw(); cwUpdateStats();
}
function cwOnLimitChange(val) {
    _cw.limit = parseFloat(val);
    localStorage.setItem('cw_limit', val);
    const lt = document.getElementById('cw-limit');
    if (lt) lt.value = val;
    cwDraw(); cwUpdateStats();
}

// ── Drag interaction ──────────────────────────────────────────────────────
function cwBindDrag(canvas) {
    function getClientPos(e) {
        return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
                         : { x: e.clientX, y: e.clientY };
    }
    function getAviationAngle(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const dx = clientX - (rect.left + rect.width  / 2);
        const dy = clientY - (rect.top  + rect.height / 2);
        let a = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        if (a < 0)   a += 360;
        if (a >= 360) a -= 360;
        return Math.round(a);
    }
    function getZone(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const dx = clientX - (rect.left + rect.width  / 2);
        const dy = clientY - (rect.top  + rect.height / 2);
        const d  = Math.sqrt(dx * dx + dy * dy);
        const R  = rect.width / 2;
        if (d > R) return null;
        return d < R * 0.52 ? 'runway' : 'wind';
    }

    function onStart(e) {
        e.preventDefault();
        const p = getClientPos(e);
        _cw.drag = getZone(p.x, p.y);
    }
    function onMove(e) {
        if (!_cw.drag) return;
        e.preventDefault();
        const p = getClientPos(e);
        const a = getAviationAngle(p.x, p.y);
        if (_cw.drag === 'wind') {
            _cw.wdir = a;
        } else {
            // Snap runway to nearest 10°, min 10
            _cw.rwyHdg = Math.round(a / 10) * 10 || 360;
            if (_cw.rwyHdg > 360) _cw.rwyHdg -= 360;
            // Sync type-in field
            const rwyInp = document.getElementById('cw-rwy');
            if (rwyInp) rwyInp.value = _cw.rwyHdg;
        }
        // Sync wind dir type-in
        const wdirInp = document.getElementById('cw-wdir');
        if (wdirInp) wdirInp.value = _cw.wdir;
        cwDraw();
        cwUpdateStats();
    }
    function onEnd() { _cw.drag = null; }

    canvas.addEventListener('mousedown',  onStart, { passive: false });
    canvas.addEventListener('touchstart', onStart, { passive: false });

    // Remove old window listeners before adding new
    if (_cwMoveHandler) {
        window.removeEventListener('mousemove',  _cwMoveHandler);
        window.removeEventListener('touchmove',  _cwMoveHandler);
        window.removeEventListener('mouseup',    _cwEndHandler);
        window.removeEventListener('touchend',   _cwEndHandler);
    }
    _cwMoveHandler = onMove;
    _cwEndHandler  = onEnd;
    window.addEventListener('mousemove',  onMove, { passive: false });
    window.addEventListener('touchmove',  onMove, { passive: false });
    window.addEventListener('mouseup',    onEnd);
    window.addEventListener('touchend',   onEnd);
}

// ── TYPE-IN mode calculation (unchanged logic, new container IDs) ─────────
function calcCrosswind() {
    const rwyRaw  = document.getElementById('cw-rwy')?.value.trim();
    const wdirRaw = document.getElementById('cw-wdir')?.value.trim();
    const wspdRaw = document.getElementById('cw-wspd')?.value.trim();
    const gustRaw = document.getElementById('cw-gust')?.value.trim();
    const limitEl = document.getElementById('cw-limit');
    const result  = document.getElementById('cw-result');
    const empty   = document.getElementById('cw-empty');

    if (!rwyRaw || !wdirRaw || !wspdRaw) {
        if (result) result.style.display = 'none';
        if (empty)  empty.style.display  = 'block';
        return;
    }
    const rwy   = parseFloat(rwyRaw);
    const wdir  = parseFloat(wdirRaw);
    const wspd  = parseFloat(wspdRaw);
    const gust  = gustRaw ? parseFloat(gustRaw) : null;
    const limit = limitEl ? parseFloat(limitEl.value) : 0;

    if (isNaN(rwy) || isNaN(wdir) || isNaN(wspd)) {
        if (result) result.style.display = 'none';
        if (empty)  empty.style.display  = 'block';
        return;
    }

    // Sync visual mode state so compass updates if user switches
    _cw.rwyHdg = rwy; _cw.wdir = wdir; _cw.wspd = wspd; _cw.gust = gust; _cw.limit = limit;
    const slider = document.getElementById('cw-vslider');
    if (slider) slider.value = Math.min(wspd, 50);

    const angleRad  = (wdir - rwy) * Math.PI / 180;
    const headwind  = wspd * Math.cos(angleRad);
    const crosswind = wspd * Math.sin(angleRad);
    const xwAbs     = Math.abs(crosswind);
    let gustHW = null, gustXW = null;
    if (gust && !isNaN(gust)) { gustHW = gust * Math.cos(angleRad); gustXW = gust * Math.sin(angleRad); }

    const hwEl = document.getElementById('cw-hw'), hwLbl = document.getElementById('cw-hw-lbl');
    const xwEl = document.getElementById('cw-xw'), xwLbl = document.getElementById('cw-xw-lbl');
    if (hwEl)  { hwEl.textContent = Math.abs(headwind).toFixed(1); hwEl.style.color = headwind < 0 ? '#ff453a' : 'var(--accent)'; }
    if (hwLbl) hwLbl.textContent = headwind >= 0 ? 'Headwind' : 'Tailwind ⚠️';
    if (xwEl)  { xwEl.textContent = xwAbs.toFixed(1); xwEl.style.color = limit>0 && xwAbs>=limit ? '#ff453a' : limit>0 && xwAbs>=limit*0.85 ? '#ff9f0a' : 'var(--success)'; }
    if (xwLbl) xwLbl.textContent = crosswind >= 0 ? 'Crosswind (from right)' : 'Crosswind (from left)';

    const gustRow = document.getElementById('cw-gust-row');
    if (gustRow && gustHW !== null) {
        gustRow.style.display = 'grid';
        const gxa = Math.abs(gustXW);
        const ghe = document.getElementById('cw-ghw'), ghl = document.getElementById('cw-ghw-lbl');
        const gxe = document.getElementById('cw-gxw'), gxl = document.getElementById('cw-gxw-lbl');
        if (ghe) { ghe.textContent = Math.abs(gustHW).toFixed(1); ghe.style.color = gustHW < 0 ? '#ff453a' : 'var(--accent)'; }
        if (ghl) ghl.textContent = gustHW >= 0 ? 'Gust Headwind' : 'Gust Tailwind ⚠️';
        if (gxe) { gxe.textContent = gxa.toFixed(1); gxe.style.color = limit>0 && gxa>=limit ? '#ff453a' : 'var(--accent)'; }
        if (gxl) gxl.textContent = gustXW >= 0 ? 'Gust XW (from right)' : 'Gust XW (from left)';
    } else if (gustRow) { gustRow.style.display = 'none'; }

    const statusEl = document.getElementById('cw-status');
    if (statusEl) {
        const checkXW = gustHW !== null ? Math.abs(gustXW) : xwAbs;
        if (limit > 0 && checkXW >= limit) {
            statusEl.textContent = `✗ NO-GO — Crosswind ${checkXW.toFixed(1)} kt exceeds ${limit} kt limit`;
            statusEl.style.cssText = 'text-align:center;padding:12px;border-radius:10px;font-size:15px;font-weight:800;letter-spacing:0.5px;margin-bottom:12px;background:rgba(255,69,58,0.15);border:1px solid rgba(255,69,58,0.5);color:#ff453a;';
        } else if (headwind < 0) {
            statusEl.textContent = `⚠️ TAILWIND — ${Math.abs(headwind).toFixed(1)} kt — Check POH limits`;
            statusEl.style.cssText = 'text-align:center;padding:12px;border-radius:10px;font-size:15px;font-weight:800;letter-spacing:0.5px;margin-bottom:12px;background:rgba(255,159,10,0.15);border:1px solid rgba(255,159,10,0.5);color:#ff9f0a;';
        } else if (limit > 0) {
            statusEl.textContent = `✓ GO — Crosswind ${xwAbs.toFixed(1)} kt within ${limit} kt limit`;
            statusEl.style.cssText = 'text-align:center;padding:12px;border-radius:10px;font-size:15px;font-weight:800;letter-spacing:0.5px;margin-bottom:12px;background:rgba(50,215,75,0.12);border:1px solid rgba(50,215,75,0.4);color:var(--success);';
        } else {
            statusEl.textContent = `Crosswind ${xwAbs.toFixed(1)} kt · ${headwind>=0?'Headwind':'Tailwind'} ${Math.abs(headwind).toFixed(1)} kt`;
            statusEl.style.cssText = 'text-align:center;padding:12px;border-radius:10px;font-size:15px;font-weight:800;letter-spacing:0.5px;margin-bottom:12px;background:rgba(255,255,255,0.05);border:1px solid #444;color:#fff;';
        }
    }
    if (result) result.style.display = 'block';
    if (empty)  empty.style.display  = 'none';
    cwDrawDiagram(rwy, wdir, wspd, gust);
}

function cwDrawDiagram(rwyHdg, windDir, windSpd, gust) {
    const svg = document.getElementById('cw-svg');
    if (!svg) return;
    const cx = 100, cy = 100, r = 70;
    const windFromRad = (windDir - 90) * Math.PI / 180;
    const arrowLen = Math.min(58, 18 + windSpd * 1.8);
    const ax1 = cx + Math.cos(windFromRad) * r * 0.88;
    const ay1 = cy + Math.sin(windFromRad) * r * 0.88;
    const ax2 = ax1 + Math.cos(windFromRad + Math.PI) * arrowLen;
    const ay2 = ay1 + Math.sin(windFromRad + Math.PI) * arrowLen;
    const lbl = `${windSpd}${gust ? 'G' + gust : ''}kt`;
    svg.innerHTML = `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#333" stroke-width="1"/>
        <text x="${cx}" y="${cy-r-6}"   text-anchor="middle" fill="#555" font-size="9" font-family="monospace">N</text>
        <text x="${cx}" y="${cy+r+14}"  text-anchor="middle" fill="#555" font-size="9" font-family="monospace">S</text>
        <text x="${cx+r+8}" y="${cy+4}" text-anchor="middle" fill="#555" font-size="9" font-family="monospace">E</text>
        <text x="${cx-r-8}" y="${cy+4}" text-anchor="middle" fill="#555" font-size="9" font-family="monospace">W</text>
        <rect x="${cx-8}" y="${cy-50}" width="16" height="100" rx="3" fill="#2c2c2e" stroke="#555" stroke-width="1.5"
              transform="rotate(${rwyHdg},${cx},${cy})"/>
        <defs><marker id="cwA" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#0a84ff"/></marker></defs>
        <line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" stroke="#0a84ff" stroke-width="2.5" marker-end="url(#cwA)"/>
        <text x="${(ax1+ax2)/2}" y="${(ay1+ay2)/2-7}" text-anchor="middle" fill="#0a84ff"
              font-size="10" font-family="monospace" font-weight="700">${lbl}</text>
        <circle cx="${cx}" cy="${cy}" r="3" fill="#555"/>`;
}
