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
            'morse-trainer': 'Morse Code Trainer',
            'crosswind': 'Crosswind Calculator',
            'airspace-mins': 'VFR Airspace Minimums'
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
        } else if (toolName === 'morse-trainer') {
            initMorseTrainer();
        } else if (toolName === 'crosswind') {
            cwInit();
        } else if (toolName === 'great-circle') {
            gcInitMap();
        } else if (toolName === 'airspace-mins') {
            initAirspaceMins();
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
// WEATHER TERMS DATABASE → see metar-db.js
// ============================================================================



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
        <div style="margin-bottom:16px; padding:10px; background:#111; border-radius:8px; border:1px solid #2a2a2a;">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                <div style="font-size:11px; color:var(--sub-text);">
                    <strong style="color:#e8a020;">${matches.length}</strong> result${matches.length !== 1 ? 's' : ''} found
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button onclick="window.open('https://www.weather.gov/media/wrh/mesowest/metar_decode_key.pdf', '_blank')" 
                            class="tool-btn" 
                            style="background:#e8a020; border:none; color:#000; padding:4px 8px; font-size:10px; font-weight:700;">
                        METAR KEY ↗
                    </button>
                    <button onclick="window.open('/METAR_TAF%20Abbreviations.pdf', '_blank')" 
                            class="tool-btn" 
                            style="background:#34c759; border:none; color:#000; padding:4px 8px; font-size:10px; font-weight:700;">
                        METAR/TAF REF ↗
                    </button>
                </div>
            </div>
        </div>
    `;
    
    matches.forEach(item => {
        html += `
            <div style="background:#111; padding:12px; border-radius:8px; border:1px solid #2a2a2a; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                    <div style="font-size:14px; font-weight:800; color:#e8a020; font-family:'SF Mono',monospace;">${item.code}</div>
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
    
    let html = `
        <div style="margin-bottom:16px; padding:10px; background:#111; border-radius:8px; border:1px solid #2a2a2a;">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                <div style="font-size:11px; color:var(--sub-text);">METAR weather code reference</div>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button onclick="window.open('https://www.weather.gov/media/wrh/mesowest/metar_decode_key.pdf', '_blank')" 
                            class="tool-btn" 
                            style="background:#e8a020; border:none; color:#000; padding:4px 8px; font-size:10px; font-weight:700;">
                        METAR KEY ↗
                    </button>
                    <button onclick="window.open('/METAR_TAF%20Abbreviations.pdf', '_blank')" 
                            class="tool-btn" 
                            style="background:#34c759; border:none; color:#000; padding:4px 8px; font-size:10px; font-weight:700;">
                        METAR/TAF REF ↗
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Priority categories to show first
    const priorityCategories = [
        'precipitation', 'weather', 'descriptor', 'intensity', 
        'sky_condition', 'cloud', 'visibility', 'wind'
    ];
    
    // Display priority categories
    priorityCategories.forEach(category => {
        if (grouped[category]) {
            const label = categoryLabels[category] || category.toUpperCase();
            html += `<div style="font-size:13px; font-weight:700; color:#e8a020; margin:20px 0 12px 0;">${label}</div>`;
            
            grouped[category].forEach(item => {
                html += `
                    <div style="background:#111; padding:10px; border-radius:8px; margin-bottom:6px; border:1px solid #2a2a2a;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="font-size:13px; font-weight:800; color:#e8a020; font-family:'SF Mono',monospace; min-width:50px;">${item.code}</div>
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
            <button onclick="displayAllCategories()" class="tool-btn" style="background:#111; border:2px solid #444; color:#e8a020; padding:10px 20px; font-size:12px; font-weight:700;">
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
    
    let html = `
        <div style="margin-bottom:16px; padding:10px; background:#111; border-radius:8px; border:1px solid #2a2a2a;">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                <div style="font-size:11px; color:var(--sub-text);">All weather term categories</div>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button onclick="window.open('https://www.weather.gov/media/wrh/mesowest/metar_decode_key.pdf', '_blank')" 
                            class="tool-btn" 
                            style="background:#e8a020; border:none; color:#000; padding:4px 8px; font-size:10px; font-weight:700;">
                        METAR KEY ↗
                    </button>
                    <button onclick="window.open('/METAR_TAF%20Abbreviations.pdf', '_blank')" 
                            class="tool-btn" 
                            style="background:#34c759; border:none; color:#000; padding:4px 8px; font-size:10px; font-weight:700;">
                        METAR/TAF REF ↗
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Sort categories alphabetically
    const sortedCategories = Object.keys(grouped).sort();
    
    sortedCategories.forEach(category => {
        const label = categoryLabels[category] || category.toUpperCase();
        html += `<div style="font-size:13px; font-weight:700; color:#e8a020; margin:20px 0 12px 0;">${label} (${grouped[category].length})</div>`;
        
        grouped[category].forEach(item => {
            html += `
                <div style="background:#111; padding:10px; border-radius:8px; margin-bottom:6px; border:1px solid #2a2a2a;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="font-size:13px; font-weight:800; color:#e8a020; font-family:'SF Mono',monospace; min-width:50px;">${item.code}</div>
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
            <button onclick="displayAllWeatherTerms()" class="tool-btn" style="background:#111; border:2px solid #444; color:#e8a020; padding:10px 20px; font-size:12px; font-weight:700;">
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

    // Always clean up previous listener/button before re-attaching
    const oldRoot = document.getElementById('aero-root');
    if (oldRoot?._aeroScrollCleanup) { oldRoot._aeroScrollCleanup(); }
    document.getElementById('aero-top-btn')?.remove();

    if (!_aeroReady) {
        _aeroReady = true;
        _aeroInjectStyles();
        _aeroInjectUI(container);
        _aeroLoadData(false);
    } else {
        // UI already in DOM — just re-render results
        if (_aeroData.length > 0) _aeroRender();
        // Re-attach scroll listener and back-to-top every open
        _aeroSetupListeners();
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
                 style="display:flex;align-items:center;background:#111;
                        border:2px solid #444;border-radius:12px;padding:4px 10px;
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
                            style="background:#1a1600;border:2px solid #e8a020;color:#e8a020;"
                            onclick="_aeroSetSource('all',this)">All</button>
                    ${sourcePills}
                </div>

                <!-- Mode + Sort -->
                <div style="display:flex;gap:8px;margin-bottom:6px;">
                    <select id="aero-mode"
                            style="flex:1;background:#111;border:2px solid #444;border-radius:8px;
                                   color:#fff;font-size:12px;font-weight:600;padding:8px 10px;
                                   cursor:pointer;outline:none;" onchange="_aeroRender()">
                        <option value="contains">Contains</option>
                        <option value="starts">Starts with</option>
                        <option value="exact">Exact match</option>
                    </select>
                    <select id="aero-sort"
                            style="flex:1;background:#111;border:2px solid #444;border-radius:8px;
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
                            style="font-size:11px;color:#e8a020;background:none;border:none;
                                   cursor:pointer;padding:2px 0;font-weight:700;">↻ Sync</button>
                </div>
            </div>
        </div><!-- /#aero-header -->

        <!-- Results list -->
        <div id="aero-results" style="display:flex;flex-direction:column;gap:8px;padding-bottom:60px;">
            <div style="text-align:center;padding:40px 0;">
                <div style="width:28px;height:28px;border:3px solid #333;border-top-color:#e8a020;
                            border-radius:50%;animation:spin 0.9s linear infinite;margin:0 auto 12px;"></div>
                <div style="font-size:12px;color:#555;">Loading databases…</div>
            </div>
        </div>

    </div>`;

    setTimeout(_aeroSetupListeners, 120);
}

function _aeroSetupListeners() {
    document.getElementById('aero-input')?.focus();

    // Restore saved default search mode
    const savedMode = localStorage.getItem('aero_default_mode') || 'starts';
    const modeEl = document.getElementById('aero-mode');
    if (modeEl) modeEl.value = savedMode;

    // Offset sticky header below tools-extension-header
    const toolsHdr = document.getElementById('tools-extension-header');
    const aeroHdr  = document.getElementById('aero-header');
    if (toolsHdr && aeroHdr) {
        const hdrH = toolsHdr.offsetHeight + 16;
        aeroHdr.style.top = hdrH + 'px';
    }

    // Inject back-to-top button into body (position:fixed needs body parent)
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

    // Scroll-driven: filter collapse + back-to-top visibility
    const scrollEl = document.getElementById('tools-extension-panel');
    if (!scrollEl) return;
    let _aeroLastScrollY = 0;
    let _aeroFiltersVisible = true;

    function _aeroOnScroll() {
        const sy    = scrollEl.scrollTop;
        const going = sy - _aeroLastScrollY;
        _aeroLastScrollY = sy;

        if (going > 0 && sy > 60 && _aeroFiltersVisible) {
            _aeroFiltersVisible = false;
            const f = document.getElementById('aero-filters');
            if (f) { f.style.maxHeight = '0'; f.style.opacity = '0'; }
        }
        if ((going < 0 || sy < 30) && !_aeroFiltersVisible) {
            _aeroFiltersVisible = true;
            const f = document.getElementById('aero-filters');
            if (f) { f.style.maxHeight = '120px'; f.style.opacity = '1'; }
        }

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

    // Store cleanup — called on every close and reopen
    const root = document.getElementById('aero-root');
    if (root) root._aeroScrollCleanup = () => {
        scrollEl.removeEventListener('scroll', _aeroOnScroll);
        document.getElementById('aero-top-btn')?.remove();
    };
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
        ? `<span style="color:#e8a020;font-weight:800;">${items.length}</span> results`
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
            const hl = '<mark style="background:rgba(232,160,32,0.2);color:#e8a020;border-radius:2px;padding:0 2px;">$1</mark>';
            meaningHTML = meaningHTML.replace(rx, hl);
            acronymHTML = acronymHTML.replace(rx, hl);
        }

        const card = document.createElement('div');
        card.style.cssText = `background:#111;border:2px solid #333;border-radius:12px;
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
                               padding:2px 7px;border:1px solid #444;border-radius:5px;">
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
            <div style="width:28px;height:28px;border:3px solid #333;border-top-color:#e8a020;
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

    const paEl = document.getElementById('resPA');
    if (paEl) paEl.innerText = `${Math.round(pa)} ft`;

    const isaDev = tempC - isaTemp;
    const isaEl  = document.getElementById('resISA');
    if (isaEl) {
        const sign = isaDev >= 0 ? '+' : '';
        isaEl.innerText = `${sign}${isaDev.toFixed(1)}°C`;
        isaEl.style.color = Math.abs(isaDev) > 15 ? 'var(--warn)' : 'var(--text)';
    }

    document.getElementById('resDA').innerText    = `${Math.round(da)} ft`;
    document.getElementById('resTAS').innerText   = `${Math.round(tas)} kt`;
    document.getElementById('resCloud').innerText = cloudBase;
    document.getElementById('resFrz').innerText   = freezingLvl;
    const daEl = document.getElementById('resDA');
    daEl.style.color = da > alt + 2000 ? "var(--warn)" : "#e8a020";

    // Also sync TAS into wind triangle TAS field if blank
    if (ias > 0 && !document.getElementById('wtTas').value) {
        document.getElementById('wtTas').value = Math.round(tas);
        calcWindTriangle();
    }
}

// ============================================================================
// E6B AUTOFILL
// ============================================================================

function e6bAutofillCurrent() {
    // Read from the globally available METAR state in core.js scope
    const m   = (typeof lastMetarObj !== 'undefined') ? lastMetarObj : null;
    const stn = (typeof stationData  !== 'undefined') ? stationData  : null;
    const icao = document.getElementById('icao')?.value?.trim().toUpperCase() || '';

    if (!m) {
        e6bShowStatus('No METAR loaded — search an airport first.');
        return;
    }

    // Temp / dewpoint
    const tempC = m.temperature?.value;
    const dewC  = m.dewpoint?.value;
    // QNH
    const altRaw = m.altimeter?.value;
    const altUnit = (altRaw !== null && altRaw < 200) ? 'inhg' : 'hpa';
    // Elevation → use as indicated altitude
    const elev = stn?.elevation_ft ?? 0;

    const uQnh  = document.getElementById('unitQnh');
    const uTemp = document.getElementById('unitTemp');
    if (uQnh)  uQnh.value  = altUnit;
    if (uTemp) uTemp.value = 'c';

    if (elev !== null)   document.getElementById('e6bAlt').value  = Math.round(elev);
    if (altRaw !== null) document.getElementById('e6bQnh').value  = altUnit === 'inhg' ? parseFloat(altRaw).toFixed(2) : Math.round(altRaw);
    if (tempC !== null && tempC !== undefined)  document.getElementById('e6bTemp').value = tempC;
    if (dewC  !== null && dewC  !== undefined)  document.getElementById('e6bDew').value  = dewC;

    // Update button label
    const lbl = document.getElementById('e6bAutofillLabel');
    if (lbl) lbl.textContent = `Filled from ${icao || 'current airport'}`;

    calcE6B();
}

function e6bCustomFill() {
    const row = document.getElementById('e6bCustomRow');
    if (row) row.style.display = row.style.display === 'none' ? 'block' : 'none';
}

async function e6bFetchCustom() {
    const input  = document.getElementById('e6bCustomIcao');
    const status = document.getElementById('e6bCustomStatus');
    const icao   = input?.value?.trim().toUpperCase();
    if (!icao || icao.length < 3) { if (status) status.textContent = 'Enter a valid ICAO code.'; return; }
    if (status) status.textContent = 'Fetching…';

    try {
        const [metarRes, stnRes] = await Promise.all([
            fetch(`/api/weather?type=metar&station=${icao}`).then(r => r.json()),
            fetch(`/api/weather?type=station&station=${icao}`).then(r => r.json())
        ]);

        const m   = metarRes?.value || metarRes;
        const stn = stnRes;
        if (!m || m.error) { if (status) status.textContent = `No METAR found for ${icao}.`; return; }

        const tempC  = m.temperature?.value;
        const dewC   = m.dewpoint?.value;
        const altRaw = m.altimeter?.value;
        const altUnit = (altRaw !== null && altRaw < 200) ? 'inhg' : 'hpa';
        const elev   = stn?.elevation_ft ?? 0;

        const uQnh  = document.getElementById('unitQnh');
        const uTemp = document.getElementById('unitTemp');
        if (uQnh)  uQnh.value  = altUnit;
        if (uTemp) uTemp.value = 'c';

        if (elev    != null) document.getElementById('e6bAlt').value  = Math.round(elev);
        if (altRaw  != null) document.getElementById('e6bQnh').value  = altUnit === 'inhg' ? parseFloat(altRaw).toFixed(2) : Math.round(altRaw);
        if (tempC   != null) document.getElementById('e6bTemp').value = tempC;
        if (dewC    != null) document.getElementById('e6bDew').value  = dewC;

        if (status) status.textContent = `✓ Filled from ${icao}`;
        const lbl = document.getElementById('e6bAutofillLabel');
        if (lbl) lbl.textContent = `Filled from ${icao}`;
        document.getElementById('e6bCustomRow').style.display = 'none';
        calcE6B();
    } catch(err) {
        if (status) status.textContent = 'Fetch failed — check connection.';
    }
}

function e6bWindFill() {
    const wind = (typeof currentWind !== 'undefined') ? currentWind : null;
    if (!wind || (!wind.spd && wind.dir === 0)) return;
    const mv      = parseMagVar(document.getElementById('wtMagVar').value);
    const magDir  = (wind.dir === 'VRB') ? 0 : wind.dir;
    // METAR wind is magnetic → convert to True for wind triangle
    const trueDir = ((magDir + mv) % 360 + 360) % 360;
    document.getElementById('wtWindDir').value = Math.round(trueDir);
    document.getElementById('wtWindSpd').value = wind.spd || 0;
    calcWindTriangle();
}

function e6bShowStatus(msg) {
    const status = document.getElementById('e6bCustomStatus');
    const row    = document.getElementById('e6bCustomRow');
    if (row)    row.style.display = 'block';
    if (status) { status.textContent = msg; status.style.color = 'var(--warn)'; }
}

// ============================================================================
// WIND TRIANGLE CALCULATOR
// ============================================================================

// ============================================================================
// WIND TRIANGLE CALCULATOR
// ============================================================================

/**
 * Parse mag var from user text: "14W" → -14, "3E" → +3, "-14" → -14, "14" → +14
 * Convention: East = positive (East is least), West = negative (West is best)
 */
function parseMagVar(str) {
    if (!str) return 0;
    const s = str.toString().trim().toUpperCase();
    const m = s.match(/^([+-]?\d+(?:\.\d+)?)\s*([EW]?)$/);
    if (!m) return 0;
    let val = parseFloat(m[1]);
    if (m[2] === 'W') val = -Math.abs(val);
    if (m[2] === 'E') val =  Math.abs(val);
    return isNaN(val) ? 0 : val;
}

function wtMcChanged() {
    const mc  = parseFloat(document.getElementById('wtMc').value);
    const mv  = parseMagVar(document.getElementById('wtMagVar').value);
    if (!isNaN(mc)) {
        // TC = MC + variation  (East +, West -)
        const tc = ((mc + mv) % 360 + 360) % 360;
        document.getElementById('wtCourse').value = Math.round(tc);
    }
    calcWindTriangle();
}

function wtTcChanged() {
    const tc = parseFloat(document.getElementById('wtCourse').value);
    const mv = parseMagVar(document.getElementById('wtMagVar').value);
    if (!isNaN(tc)) {
        // MC = TC - variation
        const mc = ((tc - mv) % 360 + 360) % 360;
        document.getElementById('wtMc').value = Math.round(mc);
    }
    calcWindTriangle();
}

async function wtFillMagVar() {
    const stn  = (typeof stationData !== 'undefined') ? stationData : null;
    const note = document.getElementById('wtMagVarNote');

    if (!stn) {
        if (note) note.innerHTML = '⚠️ No airport loaded — search an airport first, then tap Airport ↓.';
        return;
    }

    const icao = document.getElementById('icao')?.value?.trim().toUpperCase() || 'Airport';
    let mv = stn.magnetic_variation;

    // AVWX sometimes omits magnetic_variation — fall back to NOAA WMM API
    if (mv == null && stn.latitude != null && stn.longitude != null) {
        if (note) note.innerHTML = `⏳ Fetching declination for ${icao} from NOAA…`;
        try {
            const url  = `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat1=${stn.latitude}&lon1=${stn.longitude}&resultFormat=json`;
            const res  = await fetch(url);
            const data = await res.json();
            const raw  = data?.result?.[0]?.declination;
            if (raw != null) mv = parseFloat(parseFloat(raw).toFixed(1));
        } catch(e) {
            if (note) note.innerHTML = `⚠️ NOAA lookup failed. Enter manually, e.g. <b style="color:#888;">14W</b> or <b style="color:#888;">3E</b>.`;
            return;
        }
    }

    if (mv == null) {
        if (note) note.innerHTML = `⚠️ No mag var data for ${icao}. Enter manually, e.g. <b style="color:#888;">14W</b>.`;
        return;
    }

    const dir     = mv >= 0 ? 'E' : 'W';
    const display = `${Math.abs(mv).toFixed(1)}${dir}`;
    document.getElementById('wtMagVar').value = display;

    if (note) note.innerHTML = `<b style="color:#32d74b;">✓ ${icao}:</b> ${Math.abs(mv).toFixed(1)}° ${dir} — ${mv >= 0 ? 'East is least (TC &lt; MC)' : 'West is best (TC &gt; MC)'}`;

    // Sync MC from TC if TC is set, else TC from MC
    const tc = parseFloat(document.getElementById('wtCourse').value);
    const mc = parseFloat(document.getElementById('wtMc').value);
    if (!isNaN(tc)) {
        document.getElementById('wtMc').value = Math.round(((tc - mv) % 360 + 360) % 360);
    } else if (!isNaN(mc)) {
        document.getElementById('wtCourse').value = Math.round(((mc + mv) % 360 + 360) % 360);
    }
    calcWindTriangle();
}

// Called whenever the mag var field is edited — keep MC↔TC in sync
function wtMagVarChanged() {
    const mv = parseMagVar(document.getElementById('wtMagVar').value);
    const tc = parseFloat(document.getElementById('wtCourse').value);
    const mc = parseFloat(document.getElementById('wtMc').value);
    if (!isNaN(tc)) {
        document.getElementById('wtMc').value = Math.round(((tc - mv) % 360 + 360) % 360);
    } else if (!isNaN(mc)) {
        document.getElementById('wtCourse').value = Math.round(((mc + mv) % 360 + 360) % 360);
    }
    calcWindTriangle();
}



function calcWindTriangle() {
    const tc  = parseFloat(document.getElementById('wtCourse').value);
    const tas = parseFloat(document.getElementById('wtTas').value);
    const wd  = parseFloat(document.getElementById('wtWindDir').value);
    const ws  = parseFloat(document.getElementById('wtWindSpd').value);
    const mv  = parseMagVar(document.getElementById('wtMagVar').value);

    const hdgEl = document.getElementById('resHdg');
    const mhEl  = document.getElementById('resMh');
    const gsEl  = document.getElementById('resGs');
    const wcaEl = document.getElementById('resWca');
    const weEl  = document.getElementById('resWe');
    const xwEl  = document.getElementById('resXw');

    const clearAll = () => [hdgEl,mhEl,gsEl,wcaEl,weEl,xwEl].forEach(el => { if (el) el.innerText = '--'; });

    if (isNaN(tc) || isNaN(tas) || isNaN(wd) || isNaN(ws) || tas <= 0) {
        clearAll();
        wtDrawSvg(null);
        return;
    }

    const toRad = d => d * Math.PI / 180;
    const toDeg = r => r * 180 / Math.PI;

    // ── Correct WCA formula ──
    // sin(WCA) = (WS / TAS) × sin(WD − TC)
    // Positive WCA → heading is RIGHT of track (into right-side wind) ✓
    const sinWca = (ws / tas) * Math.sin(toRad(wd - tc));

    if (Math.abs(sinWca) > 1) {
        // Wind too strong for TAS — no solution
        [hdgEl,mhEl,gsEl,wcaEl,weEl,xwEl].forEach(el => { if (el) el.innerText = 'N/A'; });
        wtDrawSvg(null);
        return;
    }

    const wca = toDeg(Math.asin(sinWca));
    const hdg = ((tc + wca) % 360 + 360) % 360;
    const mh  = ((hdg - mv)  % 360 + 360) % 360;

    // GS via vector sum of TAS-heading and wind
    const hdgRad = toRad(hdg);
    const wdRad  = toRad(wd);
    const gsx = Math.sin(hdgRad) * tas - Math.sin(wdRad) * ws;  // wind blows FROM wd
    const gsy = Math.cos(hdgRad) * tas - Math.cos(wdRad) * ws;
    const gs  = Math.sqrt(gsx * gsx + gsy * gsy);

    // Wind effect and crosswind
    const effect = gs - tas;
    const xw     = ws * Math.sin(toRad(wd - tc));   // + = from right

    // ── Results ──
    if (hdgEl) { hdgEl.innerText = `${Math.round(hdg).toString().padStart(3,'0')}°T`; hdgEl.style.color = '#e8a020'; }
    if (mhEl)  { mhEl.innerText  = `${Math.round(mh).toString().padStart(3,'0')}°M`;  mhEl.style.color  = '#e8a020'; }
    if (gsEl)  { gsEl.innerText  = `${Math.round(gs)} kt`; gsEl.style.color = '#32d74b'; }
    if (wcaEl) {
        const s = wca >= 0 ? '+' : '';
        wcaEl.innerText = `${s}${wca.toFixed(1)}° (${wca >= 0 ? 'R' : 'L'})`;
        wcaEl.style.color = '#ff453a';
    }
    if (weEl) {
        const s = effect >= 0 ? '+' : '';
        weEl.innerText = `${s}${Math.round(effect)} kt (${effect >= 0 ? 'tailwind' : 'headwind'})`;
        weEl.style.color = effect >= 0 ? '#32d74b' : '#ff453a';
    }
    if (xwEl) {
        const xwAbs = Math.abs(xw);
        xwEl.innerText = `${xwAbs.toFixed(1)} kt ${xw > 0 ? 'from R' : 'from L'}`;
        xwEl.style.color = xwAbs > tas * 0.15 ? '#ff453a' : 'var(--sub-text)';
    }

    wtDrawSvg({ tc, hdg, tas, wd, ws, gs, wca });
}

function wtDrawSvg(d) {
    const svg = document.getElementById('wtSvg');
    if (!svg) return;

    if (!d) {
        svg.innerHTML = `<text x="110" y="118" text-anchor="middle" fill="#2a2a2a"
            font-size="12" font-family="monospace">Enter values above</text>`;
        return;
    }

    const cx = 110, cy = 112, R = 88;
    const toRad = deg => deg * Math.PI / 180;

    // Scale so the longest of TAS or GS fits at ~80% of R
    const maxSpd = Math.max(d.tas, d.gs, 1);
    const scale  = (R * 0.80) / maxSpd;

    // SVG direction helper: North = up (-y), East = right (+x)
    const vec = (deg, len) => ({
        x: cx + Math.sin(toRad(deg)) * len * scale,
        y: cy - Math.cos(toRad(deg)) * len * scale
    });

    // Key points
    // Origin → TAS along HDG
    const P1 = vec(d.hdg, d.tas);
    // From P1 → wind vector (wind blows FROM wd, so vector points TOWARD wd+180)
    const wToDir = (d.wd + 180) % 360;
    const P2 = {
        x: P1.x + Math.sin(toRad(wToDir)) * d.ws * scale,
        y: P1.y - Math.cos(toRad(wToDir)) * d.ws * scale
    };
    // P2 should ≈ vec(d.tc, d.gs) — the ground velocity endpoint

    const arrowHead = (x2, y2, x1, y1, color, size = 7) => {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const a1x = x2 - size * Math.cos(angle - 0.42);
        const a1y = y2 - size * Math.sin(angle - 0.42);
        const a2x = x2 - size * Math.cos(angle + 0.42);
        const a2y = y2 - size * Math.sin(angle + 0.42);
        return `<polygon points="${x2},${y2} ${a1x},${a1y} ${a2x},${a2y}" fill="${color}"/>`;
    };

    // Compass ticks
    let ticks = '';
    for (let i = 0; i < 36; i++) {
        const a = toRad(i * 10);
        const inner = i % 9 === 0 ? R - 12 : i % 3 === 0 ? R - 8 : R - 4;
        ticks += `<line x1="${cx + Math.sin(a)*inner}" y1="${cy - Math.cos(a)*inner}"
                        x2="${cx + Math.sin(a)*R}"     y2="${cy - Math.cos(a)*R}"
                        stroke="#2a2a2a" stroke-width="${i % 9 === 0 ? 1.5 : 0.7}"/>`;
    }

    // Cardinal labels
    const cards = [['N',0],['E',90],['S',180],['W',270]];
    const cardHtml = cards.map(([l,deg]) => {
        const lR = R - 20;
        return `<text x="${cx + Math.sin(toRad(deg))*lR}" y="${cy - Math.cos(toRad(deg))*lR + 4}"
                      text-anchor="middle" fill="#3a3a3a" font-size="9" font-family="monospace" font-weight="700">${l}</text>`;
    }).join('');

    // Wind-from tick on compass ring
    const wfx1 = cx + Math.sin(toRad(d.wd)) * (R - 2);
    const wfy1 = cy - Math.cos(toRad(d.wd)) * (R - 2);
    const wfx2 = cx + Math.sin(toRad(d.wd)) * (R + 7);
    const wfy2 = cy - Math.cos(toRad(d.wd)) * (R + 7);

    // TC dashed guide — extends full diameter
    const tcFar  = vec(d.tc, maxSpd);
    const tcBack = { x: cx - (tcFar.x - cx), y: cy - (tcFar.y - cy) };

    // GS label offset (perpendicular to GS line)
    const gsAngleRad = Math.atan2(P2.x - cx, cy - P2.y); // heading angle in SVG
    const labelOffset = 10;
    const gsLx = (cx + P2.x) / 2 + Math.cos(gsAngleRad + Math.PI/2) * labelOffset;
    const gsLy = (cy + P2.y) / 2 - Math.sin(gsAngleRad + Math.PI/2) * labelOffset;

    svg.innerHTML = `
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#1e1e1e" stroke-width="1"/>
        ${ticks}
        ${cardHtml}

        <!-- TC dashed guide (green) -->
        <line x1="${tcBack.x}" y1="${tcBack.y}" x2="${tcFar.x}" y2="${tcFar.y}"
              stroke="#32d74b" stroke-width="0.8" stroke-dasharray="4,3" opacity="0.3"/>

        <!-- Wind-from tick (red) on ring -->
        <line x1="${wfx1}" y1="${wfy1}" x2="${wfx2}" y2="${wfy2}"
              stroke="#ff453a" stroke-width="2.5" stroke-linecap="round"/>

        <!-- GS vector: origin → P2 (green, solid) -->
        <line x1="${cx}" y1="${cy}" x2="${P2.x}" y2="${P2.y}"
              stroke="#32d74b" stroke-width="2.5" stroke-linecap="round"/>
        ${arrowHead(P2.x, P2.y, cx, cy, '#32d74b', 9)}

        <!-- TAS / HDG vector: origin → P1 (blue, solid) -->
        <line x1="${cx}" y1="${cy}" x2="${P1.x}" y2="${P1.y}"
              stroke="#0a84ff" stroke-width="2.5" stroke-linecap="round"/>
        ${arrowHead(P1.x, P1.y, cx, cy, '#0a84ff', 9)}

        <!-- Wind vector: P1 → P2 (red, dashed) -->
        <line x1="${P1.x}" y1="${P1.y}" x2="${P2.x}" y2="${P2.y}"
              stroke="#ff453a" stroke-width="2" stroke-linecap="round" stroke-dasharray="5,2.5"/>
        ${arrowHead(P2.x, P2.y, P1.x, P1.y, '#ff453a', 7)}

        <!-- Origin dot -->
        <circle cx="${cx}" cy="${cy}" r="3.5" fill="#666"/>

        <!-- Speed labels -->
        <text x="${(cx+P1.x)/2 + 8}" y="${(cy+P1.y)/2 - 6}"
              fill="#e8a020" font-size="9" font-family="monospace" font-weight="700">${Math.round(d.tas)}kt</text>
        <text x="${(P1.x+P2.x)/2 + 7}" y="${(P1.y+P2.y)/2}"
              fill="#ff453a" font-size="9" font-family="monospace" font-weight="700">${Math.round(d.ws)}kt</text>
        <text x="${gsLx}" y="${gsLy}"
              fill="#32d74b" font-size="9" font-family="monospace" font-weight="700">${Math.round(d.gs)}kt</text>
    `;
}

// ============================================================================
// FUEL ENDURANCE CALCULATOR
// ============================================================================

function calcFuel() {
    const qty     = parseFloat(document.getElementById('fuelQty').value);
    const burn    = parseFloat(document.getElementById('fuelBurn').value);
    const resMin  = parseFloat(document.getElementById('fuelRes').value) || 0;
    const gs      = parseFloat(document.getElementById('fuelGs').value);
    const fUnit   = document.getElementById('fuelUnit').value;
    const bUnit   = document.getElementById('fuelBurnUnit').value;

    const totalEl   = document.getElementById('resFuelTotal');
    const usableEl  = document.getElementById('resFuelUsable');
    const rangeEl   = document.getElementById('resFuelRange');
    const resEl     = document.getElementById('resFuelReserve');

    if (isNaN(qty) || isNaN(burn) || burn <= 0) {
        [totalEl, usableEl, rangeEl, resEl].forEach(el => { if (el) el.innerText = '--'; });
        return;
    }

    // Normalise everything to US gallons for calculation
    const toGal = { usg:1, l:0.264172, lbs:0.166667, kg:0.367346 };
    const burnGphMap = { gph:1, lph:0.264172, pph:0.166667, kgh:0.367346 };

    const qtyGal  = qty  * (toGal[fUnit]      || 1);
    const burnGph = burn * (burnGphMap[bUnit]  || 1);
    const resGal  = burnGph * (resMin / 60);

    const totalHrs  = qtyGal / burnGph;
    const usableHrs = Math.max(0, (qtyGal - resGal) / burnGph);

    const fmtTime = h => {
        const hrs = Math.floor(h);
        const min = Math.round((h - hrs) * 60);
        return `${hrs}h ${min.toString().padStart(2,'0')}m`;
    };

    if (totalEl)  totalEl.innerText  = fmtTime(totalHrs);
    if (usableEl) {
        usableEl.innerText = fmtTime(usableHrs);
        usableEl.style.color = usableHrs > 0.5 ? 'var(--success)' : 'var(--warn)';
    }
    if (resEl) {
        const resQty = resGal / (toGal[fUnit] || 1);
        resEl.innerText = `${resQty.toFixed(1)} ${fUnit.toUpperCase()}`;
    }
    if (rangeEl) {
        if (!isNaN(gs) && gs > 0) {
            rangeEl.innerText = `${Math.round(usableHrs * gs)} NM`;
        } else {
            rangeEl.innerText = 'Enter GS';
            rangeEl.style.color = 'var(--sub-text)';
        }
    }
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

    const activeStyle  = 'background:#e8a020;color:#000;';
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
        r1h.style.color = hw1 < 0 ? '#ff453a' : '#e8a020';
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
            if (ghe)  { ghe.textContent = Math.abs(ghw).toFixed(1); ghe.style.color = ghw < 0 ? '#ff453a' : '#e8a020'; }
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
        if (ghe) { ghe.textContent = Math.abs(gustHW).toFixed(1); ghe.style.color = gustHW < 0 ? '#ff453a' : '#e8a020'; }
        if (ghl) ghl.textContent = gustHW >= 0 ? 'Gust Headwind' : 'Gust Tailwind ⚠️';
        if (gxe) { gxe.textContent = gxa.toFixed(1); gxe.style.color = limit>0 && gxa>=limit ? '#ff453a' : '#e8a020'; }
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

// ============================================================================
// AIRSPACE MINIMUMS TOOL  (FAR 91.155)
// ============================================================================

const AM_DATA = [
    {
        cls: 'A', color: '#ff453a',
        altitude: 'FL180 – FL600',
        chart: { color: 'Not depicted on VFR sectionals', stroke: 'none', shape: 'IFR en-route charts only (blue horizontal lines)' },
        qualifications: ['Instrument Rating required', 'IFR flight plan filed & ATC clearance', 'Mode C transponder & encoder', 'RVSM equipment above FL290'],
        special: 'IFR ONLY — VFR flight is not permitted in Class A airspace.',
        rows: []
    },
    {
        cls: 'B', color: '#0a84ff',
        altitude: 'SFC – 10,000 ft MSL (individually tailored)',
        chart: { color: 'Solid blue lines', stroke: 'solid', shape: 'Inverted wedding cake — multiple arcs around busiest airports (e.g. LAX, JFK, ORD)' },
        qualifications: ['Student Pilot Certificate minimum (with endorsement)', 'Explicit ATC clearance required ("cleared into Bravo")', 'Two-way radio communication', 'Mode C transponder within 30 NM of Bravo airport', 'Sport/Rec pilots need specific endorsement'],
        rows: [
            { modes: ['day','night'], label: 'All operations', vis: '3 SM', cloud: 'Clear of clouds' }
        ]
    },
    {
        cls: 'C', color: '#ff6b8a',
        altitude: 'SFC – 4,000 ft AGL (approx.)',
        chart: { color: 'Solid magenta lines', stroke: 'solid', shape: 'Two concentric solid magenta circles — inner 5 NM (SFC), outer 10 NM (1,200 ft AGL floor)' },
        qualifications: ['Any certificated pilot (student solo needs logbook endorsement)', 'Two-way radio contact established before entry — not a clearance', 'Mode C transponder required', 'No explicit ATC clearance needed'],
        rows: [
            { modes: ['day','night'], label: 'All altitudes', vis: '3 SM', cloud: '500 below · 1,000 above · 2,000 horiz' }
        ]
    },
    {
        cls: 'D', color: '#5ac8fa',
        altitude: 'SFC – 2,500 ft AGL (approx.)',
        chart: { color: 'Dashed blue lines', stroke: 'dashed', shape: 'Single dashed blue circle (or rectangle) around tower-controlled airport' },
        qualifications: ['Any certificated pilot (student solo needs logbook endorsement)', 'Two-way radio contact established before entry', 'No transponder required (Mode C veil may apply nearby)', 'No ATC clearance — contact suffices'],
        rows: [
            { modes: ['day','night'], label: 'All altitudes', vis: '3 SM', cloud: '500 below · 1,000 above · 2,000 horiz' }
        ]
    },
    {
        cls: 'E', color: '#bf5af2',
        altitude: 'Varies (700/1,200 ft AGL – FL180)',
        chart: { color: 'Magenta vignette / dashed magenta', stroke: 'vignette', shape: 'Dashed magenta circle = surface E. Faded magenta edge (vignette) = 700 ft AGL floor. No marking = 1,200 ft AGL floor' },
        qualifications: ['Any certificated pilot — no special requirements for VFR', 'Student pilots may fly solo', 'No radio, transponder, or ATC clearance required for VFR', 'IFR requires ATC clearance'],
        rows: [
            { modes: ['day','night'], label: 'Below 10,000 ft MSL',    vis: '3 SM', cloud: '500 below · 1,000 above · 2,000 horiz' },
            { modes: ['day','night'], label: 'At/above 10,000 ft MSL', vis: '5 SM', cloud: '1,000 below · 1,000 above · 1 SM horiz' }
        ]
    },
    {
        cls: 'G', color: '#ffd60a',
        altitude: 'SFC – base of overlying Class E',
        chart: { color: 'No marking (white space on sectional)', stroke: 'none', shape: 'Depicted by absence of Class E markings. Fills all remaining uncontrolled airspace.' },
        qualifications: ['All pilots — most permissive airspace', 'Student pilots may fly solo without endorsement', 'No radio, transponder, or ATC clearance required', 'No ATC separation provided'],
        rows: [
            { modes: ['day'],         label: 'Day · Below 1,200 ft AGL',               vis: '1 SM',  cloud: 'Clear of clouds' },
            { modes: ['night'],       label: 'Night · Below 1,200 ft AGL ⚠️',           vis: '3 SM',  cloud: '500 below · 1,000 above · 2,000 horiz' },
            { modes: ['day'],         label: 'Day · 1,200 ft AGL to 10,000 ft MSL',    vis: '1 SM',  cloud: '500 below · 1,000 above · 2,000 horiz' },
            { modes: ['night'],       label: 'Night · 1,200 ft AGL to 10,000 ft MSL',  vis: '3 SM',  cloud: '500 below · 1,000 above · 2,000 horiz' },
            { modes: ['day','night'], label: 'At/above 10,000 ft MSL',                 vis: '5 SM',  cloud: '1,000 below · 1,000 above · 1 SM horiz' }
        ]
    }
];

let amState = { mode: 'day', filter: 'ALL' };

function initAirspaceMins() {
    amState = { mode: 'day', filter: 'ALL' };

    const filtersEl = document.getElementById('amClassFilters');
    if (filtersEl) {
        filtersEl.innerHTML = ['ALL','A','B','C','D','E','G'].map(c => `
            <button id="amFilter-${c}" onclick="amFilter('${c}')"
                style="padding:5px 12px; border-radius:20px;
                       border:1px solid ${c === 'ALL' ? 'var(--accent)' : '#3a3a3c'};
                       background:${c === 'ALL' ? 'var(--accent)' : '#1c1c1e'};
                       color:${c === 'ALL' ? '#fff' : 'var(--sub-text)'};
                       font-size:11px; font-weight:700; cursor:pointer; transition:all 0.15s; white-space:nowrap;">
                ${c === 'ALL' ? 'ALL' : 'CLASS ' + c}
            </button>`).join('');
    }

    const dayBtn   = document.getElementById('amDayBtn');
    const nightBtn = document.getElementById('amNightBtn');
    if (dayBtn)   { dayBtn.style.background = 'var(--accent)'; dayBtn.style.color = '#fff'; }
    if (nightBtn) { nightBtn.style.background = 'transparent'; nightBtn.style.color = 'var(--sub-text)'; }

    amRender();
}

function amSetMode(mode) {
    amState.mode = mode;
    const dayBtn   = document.getElementById('amDayBtn');
    const nightBtn = document.getElementById('amNightBtn');
    if (dayBtn && nightBtn) {
        dayBtn.style.background   = mode === 'day'   ? 'var(--accent)' : 'transparent';
        dayBtn.style.color        = mode === 'day'   ? '#fff'          : 'var(--sub-text)';
        nightBtn.style.background = mode === 'night' ? 'var(--accent)' : 'transparent';
        nightBtn.style.color      = mode === 'night' ? '#fff'          : 'var(--sub-text)';
    }
    amRender();
}

function amFilter(cls) {
    amState.filter = cls;
    ['ALL','A','B','C','D','E','G'].forEach(c => {
        const btn = document.getElementById('amFilter-' + c);
        if (!btn) return;
        const active = (c === cls);
        btn.style.background  = active ? 'var(--accent)' : '#1c1c1e';
        btn.style.color       = active ? '#fff'          : 'var(--sub-text)';
        btn.style.borderColor = active ? 'var(--accent)' : '#3a3a3c';
    });
    amRender();
}

function amRender() {
    const container = document.getElementById('amResults');
    if (!container) return;

    const list = amState.filter === 'ALL'
        ? AM_DATA
        : AM_DATA.filter(d => d.cls === amState.filter);

    container.innerHTML = list.map(d => {
        const c = d.color;
        const textColor = d.cls === 'G' ? '#000' : '#fff';

        // Chart appearance mini-badge — matches actual sectional symbology
        let chartBadge;
        switch (d.cls) {
            case 'A':
                chartBadge = `<svg width="64" height="22" viewBox="0 0 64 22" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="22" rx="4" fill="#1a0a0a"/>
                    <text x="32" y="15" text-anchor="middle" fill="#ff453a" font-size="9" font-family="monospace" font-weight="800" letter-spacing="0.5">IFR ONLY</text>
                </svg>`;
                break;
            case 'B':
                // Solid thick blue bar — matches sectional solid blue line
                chartBadge = `<svg width="64" height="22" viewBox="0 0 64 22" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="22" rx="4" fill="#070f1a"/>
                    <rect x="6" y="7" width="52" height="8" rx="1.5" fill="#1a6fba"/>
                    <rect x="6" y="8" width="52" height="3" rx="1" fill="#3a9fff" opacity="0.5"/>
                </svg>`;
                break;
            case 'C':
                // Solid thick magenta/crimson bar — matches sectional solid magenta line
                chartBadge = `<svg width="64" height="22" viewBox="0 0 64 22" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="22" rx="4" fill="#120a0e"/>
                    <rect x="6" y="7" width="52" height="8" rx="1.5" fill="#8b1a42"/>
                    <rect x="6" y="8" width="52" height="3" rx="1" fill="#cc3366" opacity="0.45"/>
                </svg>`;
                break;
            case 'D':
                // Dashed blue line — matches sectional dashed blue circle
                chartBadge = `<svg width="64" height="22" viewBox="0 0 64 22" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="22" rx="4" fill="#070f1a"/>
                    <line x1="6" y1="11" x2="58" y2="11" stroke="#1a6fba" stroke-width="3" stroke-dasharray="6,4" stroke-linecap="round"/>
                </svg>`;
                break;
            case 'E':
                // Three-layer badge: dashed magenta (sfc E) + two vignette swatches
                chartBadge = `<svg width="64" height="58" viewBox="0 0 64 58" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="vigPink" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%"   stop-color="#c0607a" stop-opacity="0.9"/>
                            <stop offset="70%"  stop-color="#c0607a" stop-opacity="0.2"/>
                            <stop offset="100%" stop-color="#c0607a" stop-opacity="0"/>
                        </linearGradient>
                        <linearGradient id="vigBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%"   stop-color="#7aabcc" stop-opacity="0.8"/>
                            <stop offset="70%"  stop-color="#7aabcc" stop-opacity="0.2"/>
                            <stop offset="100%" stop-color="#7aabcc" stop-opacity="0"/>
                        </linearGradient>
                    </defs>
                    <!-- Row 1: dashed magenta (sfc E) -->
                    <rect width="64" height="18" rx="4" fill="#120a0e"/>
                    <line x1="6" y1="9" x2="58" y2="9" stroke="#8b1a42" stroke-width="2.5" stroke-dasharray="5,3.5" stroke-linecap="round"/>
                    <!-- Row 2: 700 ft vignette (pink fade) -->
                    <rect y="20" width="64" height="18" rx="4" fill="#120a10"/>
                    <rect x="6" y="24" width="52" height="10" rx="2" fill="url(#vigPink)"/>
                    <!-- Row 3: 1200 ft vignette (blue fade) -->
                    <rect y="40" width="64" height="18" rx="4" fill="#090e14"/>
                    <rect x="6" y="44" width="52" height="10" rx="2" fill="url(#vigBlue)"/>
                </svg>`;
                break;
            case 'G':
                // "CLASS G" bold text — matches the sectional label treatment
                chartBadge = `<svg width="64" height="22" viewBox="0 0 64 22" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="22" rx="4" fill="#f5f5ee"/>
                    <text x="32" y="15" text-anchor="middle" fill="#1a5fa8" font-size="9.5" font-family="Arial,sans-serif" font-weight="900" letter-spacing="0.3">CLASS G</text>
                </svg>`;
                break;
            default:
                chartBadge = `<span style="font-family:'SF Mono',monospace; color:${c}; font-size:13px; font-weight:700;">· · ·</span>`;
        }

        // Qualifications bullets
        const qualHtml = d.qualifications.map(q =>
            `<div style="display:flex; gap:6px; align-items:flex-start; margin-bottom:5px;">
                <span style="color:${c}; font-size:10px; margin-top:1px; flex-shrink:0;">▸</span>
                <span style="font-size:11px; color:#aaa; line-height:1.45;">${q}</span>
            </div>`
        ).join('');

        if (d.special) {
            return `
            <div style="border-radius:12px; border:1px solid ${c}33; overflow:hidden;">
                <div style="padding:14px 16px; background:${c}18; display:flex; align-items:center; gap:12px;">
                    <div style="width:36px; height:36px; border-radius:8px; background:${c}; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:900; color:#fff; flex-shrink:0;">A</div>
                    <div>
                        <div style="font-size:13px; font-weight:800; color:#fff; margin-bottom:2px;">Class A</div>
                        <div style="font-size:11px; color:var(--sub-text);">${d.altitude}</div>
                    </div>
                </div>
                <div style="padding:14px 16px; background:#0a0a0c; display:flex; flex-direction:column; gap:12px;">
                    <div style="display:flex; align-items:center; gap:10px; background:${c}15; border:1px solid ${c}33; border-radius:8px; padding:11px 14px;">
                        <span style="font-size:18px; flex-shrink:0;">🚫</span>
                        <span style="font-size:12px; color:${c}; font-weight:700; line-height:1.4;">${d.special}</span>
                    </div>
                    <div style="background:#111; border-radius:8px; padding:10px 12px; border:1px solid #1e1e1e;">
                        <div style="font-size:9px; color:#555; font-weight:700; letter-spacing:0.6px; margin-bottom:8px;">PILOT QUALIFICATIONS</div>
                        ${qualHtml}
                    </div>
                </div>
            </div>`;
        }

        const allSame = d.rows.length > 0 && d.rows.every(r => r.modes.includes('day') && r.modes.includes('night'));
        const visRows  = d.rows.filter(r => r.modes.includes(amState.mode));

        const rowsHtml = visRows.map((r, i) => `
            <div style="padding:12px 16px; ${i > 0 ? 'border-top:1px solid #1e1e1e;' : ''}">
                <div style="font-size:10px; color:${c}; font-weight:700; margin-bottom:9px; letter-spacing:0.4px; text-transform:uppercase; opacity:0.9;">${r.label}</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div style="background:#161618; border-radius:8px; padding:10px 12px; border:1px solid #222;">
                        <div style="font-size:9px; color:#555; font-weight:700; letter-spacing:0.6px; margin-bottom:5px;">VISIBILITY</div>
                        <div style="font-size:20px; font-weight:900; color:#fff; font-family:'SF Mono',monospace; letter-spacing:-0.5px;">${r.vis}</div>
                    </div>
                    <div style="background:#161618; border-radius:8px; padding:10px 12px; border:1px solid #222;">
                        <div style="font-size:9px; color:#555; font-weight:700; letter-spacing:0.6px; margin-bottom:5px;">CLOUD CLEARANCE</div>
                        <div style="font-size:11px; font-weight:700; color:#ddd; line-height:1.55;">${r.cloud}</div>
                    </div>
                </div>
                ${amCloudSVG(r.cloud)}
            </div>`).join('');

        return `
        <div style="border-radius:12px; border:1px solid ${c}33; overflow:hidden;">
            <div style="padding:14px 16px; background:${c}18; display:flex; align-items:center; gap:12px;">
                <div style="width:36px; height:36px; border-radius:8px; background:${c}; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:900; color:${textColor}; flex-shrink:0;">${d.cls}</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-size:13px; font-weight:800; color:#fff; margin-bottom:2px;">Class ${d.cls}</div>
                    <div style="font-size:11px; color:var(--sub-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${d.altitude}</div>
                </div>
                ${allSame ? `<div style="font-size:10px; color:var(--sub-text); background:#2a2a2c; border-radius:4px; padding:3px 8px; font-weight:700; flex-shrink:0; white-space:nowrap;">DAY = NIGHT</div>` : ''}
            </div>
            <div style="background:#0a0a0c;">
                <!-- Chart appearance -->
                <div style="padding:10px 16px; border-bottom:1px solid #1a1a1a; display:flex; align-items:flex-start; gap:10px; flex-wrap:wrap;">
                    <div style="flex-shrink:0; margin-top:1px;">${chartBadge}</div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:9px; color:#555; font-weight:700; letter-spacing:0.5px; margin-bottom:2px;">SECTIONAL CHART</div>
                        <div style="font-size:11px; color:#888; line-height:1.4;">${d.chart.color} — ${d.chart.shape}</div>
                    </div>
                </div>
                <!-- Weather rows -->
                ${rowsHtml || `<div style="padding:14px 16px; font-size:12px; color:var(--sub-text); text-align:center;">No ${amState.mode}-specific rows.</div>`}
                <!-- Qualifications -->
                <div style="padding:10px 16px 14px; border-top:1px solid #1a1a1a;">
                    <div style="font-size:9px; color:#555; font-weight:700; letter-spacing:0.5px; margin-bottom:8px;">PILOT QUALIFICATIONS</div>
                    ${qualHtml}
                </div>
            </div>
        </div>`;
    }).join('');
}

function amCloudSVG(cloud) {
    const isClear = cloud === 'Clear of clouds';
    const isHigh  = cloud.includes('1 SM horiz');
    const belowLbl = isHigh ? '1,000 ft' : '500 ft';
    const aboveLbl = '1,000 ft';
    const horizLbl = isHigh ? '1 SM' : '2,000 ft';

    if (isClear) {
        return `<div style="margin:8px 0 2px; padding:10px 12px; background:#0d1f0d; border-radius:8px; border:1px solid #1a3a1a; text-align:center;">
            <span style="font-size:11px; color:#32d74b; font-weight:700; letter-spacing:0.4px;">CLEAR OF CLOUDS — no separation required</span>
        </div>`;
    }

    return `<div style="margin:10px 0 2px;">
        <div style="font-size:9px; color:#3a3a3a; font-weight:700; letter-spacing:0.5px; margin-bottom:4px;">CLEARANCE DIAGRAM</div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 132" width="100%" style="display:block; overflow:visible;">
          <defs>
            <!-- Cloud body gradient — top cloud -->
            <radialGradient id="acg-t" cx="48%" cy="38%" r="62%">
              <stop offset="0%"   stop-color="#3e5580"/>
              <stop offset="55%"  stop-color="#1e2e4a"/>
              <stop offset="100%" stop-color="#0e1624" stop-opacity="0.55"/>
            </radialGradient>
            <!-- Cloud body gradient — bottom cloud (flipped) -->
            <radialGradient id="acg-b" cx="48%" cy="62%" r="62%">
              <stop offset="0%"   stop-color="#3e5580"/>
              <stop offset="55%"  stop-color="#1e2e4a"/>
              <stop offset="100%" stop-color="#0e1624" stop-opacity="0.55"/>
            </radialGradient>
            <!-- Cloud body gradient — side cloud -->
            <radialGradient id="acg-s" cx="48%" cy="38%" r="62%">
              <stop offset="0%"   stop-color="#3e5580"/>
              <stop offset="55%"  stop-color="#1e2e4a"/>
              <stop offset="100%" stop-color="#0e1624" stop-opacity="0.55"/>
            </radialGradient>
            <!-- Soft volumetric glow on clouds -->
            <filter id="acf-cld" x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="2.2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <!-- Blue glow behind aircraft -->
            <filter id="acf-plane" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feFlood flood-color="#0a84ff" flood-opacity="0.35" result="clr"/>
              <feComposite in="clr" in2="blur" operator="in" result="glow"/>
              <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <!-- ══ CLOUD ABOVE ══ -->
          <g filter="url(#acf-cld)">
            <!-- depth shadow -->
            <ellipse cx="83" cy="22" rx="32" ry="11" fill="#090e18" opacity="0.6"/>
            <!-- left puff -->
            <ellipse cx="62"  cy="21" rx="22" ry="10" fill="url(#acg-t)"/>
            <!-- right puff -->
            <ellipse cx="103" cy="21" rx="22" ry="10" fill="url(#acg-t)"/>
            <!-- dome -->
            <ellipse cx="82"  cy="13" rx="30" ry="12" fill="url(#acg-t)"/>
            <!-- top shimmer highlight -->
            <ellipse cx="78"  cy="10" rx="13" ry="4.5" fill="#6080b0" opacity="0.22"/>
            <!-- outline strokes -->
            <ellipse cx="82"  cy="13" rx="30" ry="12"  fill="none" stroke="#4a6590" stroke-width="0.8" opacity="0.55"/>
            <ellipse cx="62"  cy="21" rx="22" ry="10"  fill="none" stroke="#3a5070" stroke-width="0.6" opacity="0.4"/>
            <ellipse cx="103" cy="21" rx="22" ry="10"  fill="none" stroke="#3a5070" stroke-width="0.6" opacity="0.4"/>
            <text x="82" y="16" text-anchor="middle" fill="#6888b8" font-size="7" font-family="monospace" font-weight="700" letter-spacing="0.8">CLOUD</text>
          </g>

          <!-- ══ VERTICAL MEASURE — above aircraft ══ -->
          <line x1="82" y1="28" x2="82" y2="52" stroke="#ff9f0a" stroke-width="1.2" stroke-dasharray="3,2.5" opacity="0.9"/>
          <!-- tick marks -->
          <line x1="78" y1="28" x2="86" y2="28" stroke="#ff9f0a" stroke-width="1" opacity="0.7"/>
          <line x1="78" y1="52" x2="86" y2="52" stroke="#ff9f0a" stroke-width="1" opacity="0.7"/>
          <text x="91" y="39" fill="#ff9f0a" font-size="9.5" font-family="monospace" font-weight="800">${belowLbl}</text>
          <text x="91" y="51" fill="#4a5060"  font-size="8"   font-family="monospace">below</text>

          <!-- ══ AIRCRAFT (diamond.png) ══ -->
          <g filter="url(#acf-plane)">
            <image href="https://raw.githubusercontent.com/vincent6786/Notion_metar_advanced/main/diamond.png" x="69" y="52" width="26" height="26" opacity="0.97"/>
          </g>

          <!-- ══ VERTICAL MEASURE — below aircraft ══ -->
          <line x1="82" y1="80" x2="82" y2="104" stroke="#ff9f0a" stroke-width="1.2" stroke-dasharray="3,2.5" opacity="0.9"/>
          <line x1="78" y1="80"  x2="86" y2="80"  stroke="#ff9f0a" stroke-width="1" opacity="0.7"/>
          <line x1="78" y1="104" x2="86" y2="104" stroke="#ff9f0a" stroke-width="1" opacity="0.7"/>
          <text x="91" y="91"  fill="#ff9f0a" font-size="9.5" font-family="monospace" font-weight="800">${aboveLbl}</text>
          <text x="91" y="102" fill="#4a5060"  font-size="8"   font-family="monospace">above</text>

          <!-- ══ CLOUD BELOW ══ -->
          <g filter="url(#acf-cld)">
            <ellipse cx="83" cy="110" rx="32" ry="11" fill="#090e18" opacity="0.6"/>
            <ellipse cx="62"  cy="111" rx="22" ry="10" fill="url(#acg-b)"/>
            <ellipse cx="103" cy="111" rx="22" ry="10" fill="url(#acg-b)"/>
            <ellipse cx="82"  cy="119" rx="30" ry="12" fill="url(#acg-b)"/>
            <!-- bottom shadow rim -->
            <ellipse cx="82"  cy="122" rx="20" ry="4" fill="#090e18" opacity="0.35"/>
            <ellipse cx="82"  cy="119" rx="30" ry="12" fill="none" stroke="#4a6590" stroke-width="0.8" opacity="0.55"/>
            <ellipse cx="62"  cy="111" rx="22" ry="10" fill="none" stroke="#3a5070" stroke-width="0.6" opacity="0.4"/>
            <ellipse cx="103" cy="111" rx="22" ry="10" fill="none" stroke="#3a5070" stroke-width="0.6" opacity="0.4"/>
            <text x="82" y="118" text-anchor="middle" fill="#6888b8" font-size="7" font-family="monospace" font-weight="700" letter-spacing="0.8">CLOUD</text>
          </g>

          <!-- ══ HORIZONTAL MEASURE — side cloud ══ -->
          <line x1="120" y1="65" x2="222" y2="65" stroke="#ff9f0a" stroke-width="1.2" stroke-dasharray="3,2.5" opacity="0.9"/>
          <line x1="120" y1="61" x2="120" y2="69" stroke="#ff9f0a" stroke-width="1" opacity="0.7"/>
          <line x1="222" y1="61" x2="222" y2="69" stroke="#ff9f0a" stroke-width="1" opacity="0.7"/>
          <text x="171" y="58" text-anchor="middle" fill="#ff9f0a" font-size="9.5" font-family="monospace" font-weight="800">${horizLbl}</text>
          <text x="171" y="76" text-anchor="middle" fill="#4a5060"  font-size="8"   font-family="monospace">horizontal</text>

          <!-- ══ SIDE CLOUD ══ -->
          <g filter="url(#acf-cld)">
            <ellipse cx="250" cy="66" rx="28" ry="11" fill="#090e18" opacity="0.6"/>
            <ellipse cx="234" cy="63" rx="20" ry="10" fill="url(#acg-s)"/>
            <ellipse cx="265" cy="63" rx="20" ry="10" fill="url(#acg-s)"/>
            <ellipse cx="249" cy="56" rx="25" ry="11" fill="url(#acg-s)"/>
            <ellipse cx="246" cy="53" rx="11" ry="4"  fill="#6080b0" opacity="0.18"/>
            <ellipse cx="249" cy="56" rx="25" ry="11" fill="none" stroke="#4a6590" stroke-width="0.8" opacity="0.55"/>
            <ellipse cx="234" cy="63" rx="20" ry="10" fill="none" stroke="#3a5070" stroke-width="0.6" opacity="0.4"/>
            <ellipse cx="265" cy="63" rx="20" ry="10" fill="none" stroke="#3a5070" stroke-width="0.6" opacity="0.4"/>
          </g>
        </svg>
    </div>`;
}

// ================================================================
// MORSE CODE TRAINER
// ================================================================
const MORSE_TABLE = {
    'A':'.-',   'B':'-...',  'C':'-.-.',  'D':'-..',   'E':'.',
    'F':'..-.',  'G':'--.',   'H':'....',  'I':'..',    'J':'.---',
    'K':'-.-',   'L':'.-..',  'M':'--',    'N':'-.',    'O':'---',
    'P':'.--.',  'Q':'--.-',  'R':'.-.',   'S':'...',   'T':'-',
    'U':'..-',   'V':'...-',  'W':'.--',   'X':'-..-',  'Y':'-.--',
    'Z':'--..',
    '0':'-----', '1':'.----', '2':'..---', '3':'...--', '4':'....-',
    '5':'.....', '6':'-....', '7':'--...', '8':'---..',  '9':'----.'
};

const MORSE_CAT = {
    'A':'letter','B':'letter','C':'letter','D':'letter','E':'letter',
    'F':'letter','G':'letter','H':'letter','I':'letter','J':'letter',
    'K':'letter','L':'letter','M':'letter','N':'letter','O':'letter',
    'P':'letter','Q':'letter','R':'letter','S':'letter','T':'letter',
    'U':'letter','V':'letter','W':'letter','X':'letter','Y':'letter','Z':'letter',
    '0':'number','1':'number','2':'number','3':'number','4':'number',
    '5':'number','6':'number','7':'number','8':'number','9':'number'
};

const MORSE_VOR = ['VOR','NDB','RCT','TPE','RJT','LAX','SFO','ORD','JFK'];

let _morseMode = 'learn';
let _morseListenChar = 'A';
let _morseQuizChar = 'A';
let _morseScore = 0;
let _morseStreak = 0;
let _morseQNum = 0;
let _morseAudioCtx = null;

function initMorseTrainer() {
    renderMorseTable();
}

function setMorseMode(mode) {
    _morseMode = mode;
    ['learn','listen','quiz','words'].forEach(m => {
        const btn   = document.getElementById('morseBtn-' + m);
        const panel = document.getElementById('morse' + m.charAt(0).toUpperCase() + m.slice(1) + 'Panel');
        if (btn) {
            btn.style.background = m === mode ? '#e8a020' : 'transparent';
            btn.style.color      = m === mode ? '#000'    : '#888';
        }
        if (panel) panel.style.display = m === mode ? '' : 'none';
    });
    if (mode === 'quiz')   startMorseQuiz();
    if (mode === 'words')  initMorseWords();
    if (mode === 'listen') {
        newMorseListenChar();
        const inp = document.getElementById('morseListenInput');
        if (inp) { inp.value = ''; inp.focus(); }
    }
}

// ── LEARN ────────────────────────────────────────────────────────────
function renderMorseTable(filter = '', cat = 'all') {
    const grid = document.getElementById('morseTableGrid');
    if (!grid) return;
    const entries = Object.entries(MORSE_TABLE).filter(([k]) => {
        const catOk = cat === 'all' || MORSE_CAT[k] === cat;
        const fOk   = !filter || k.includes(filter.toUpperCase()) || MORSE_TABLE[k].includes(filter);
        return catOk && fOk;
    });
    grid.innerHTML = entries.map(([char, code]) => `
        <div onclick="playMorse('${code}')"
             style="background:#111;border:2px solid #333;border-radius:8px;padding:10px 6px;text-align:center;cursor:pointer;transition:all 0.15s;"
             onmouseover="this.style.borderColor='#e8a020';this.style.background='#1a1600'"
             onmouseout="this.style.borderColor='#333';this.style.background='#111'">
            <div style="font-size:22px;font-weight:900;color:#fff;font-family:'SF Mono',monospace;">${char}</div>
            <div style="font-size:14px;letter-spacing:3px;color:#e8a020;margin:4px 0;font-family:'SF Mono',monospace;">${code}</div>
            <div style="font-size:9px;color:#666;letter-spacing:1px;">${code.replace(/\./g,'DI-').replace(/-/g,'DAH ').replace(/DI-/g,'DIT ').trim()}</div>
        </div>`).join('');
}

function filterMorseTable(val) {
    const cat = document.getElementById('morseFilterCat')?.value || 'all';
    renderMorseTable(val, cat);
}

// ── AUDIO ────────────────────────────────────────────────────────────
function getMorseAudioCtx() {
    if (!_morseAudioCtx) _morseAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_morseAudioCtx.state === 'suspended') _morseAudioCtx.resume();
    return _morseAudioCtx;
}

async function playMorse(code, freq = 700, wpm = 15) {
    const ctx = getMorseAudioCtx();
    const unit = 1.2 / wpm; // seconds per dot
    let t = ctx.currentTime + 0.05;
    for (const sym of code) {
        const dur = sym === '.' ? unit : unit * 3;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        osc.connect(gain); gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.005);
        gain.gain.setValueAtTime(0.4, t + dur - 0.005);
        gain.gain.linearRampToValueAtTime(0, t + dur);
        osc.start(t); osc.stop(t + dur + 0.01);
        t += dur + unit; // inter-element gap
    }
}

function playMorseChar(char) {
    const code = MORSE_TABLE[char.toUpperCase()];
    if (code) playMorse(code);
}

// ── LISTEN ───────────────────────────────────────────────────────────
function newMorseListenChar() {
    const keys = Object.keys(MORSE_TABLE);
    _morseListenChar = keys[Math.floor(Math.random() * keys.length)];
    const disp = document.getElementById('morseListenDisplay');
    if (disp) disp.textContent = '?';
    const fb = document.getElementById('morseListenFeedback');
    if (fb) { fb.textContent = ''; fb.style.color = ''; }
    const inp = document.getElementById('morseListenInput');
    if (inp) inp.value = '';
}

function playMorseListenChar() {
    playMorseChar(_morseListenChar);
}

function checkMorseListenAnswer(val) {
    if (!val) return;
    const fb = document.getElementById('morseListenFeedback');
    const disp = document.getElementById('morseListenDisplay');
    const inp = document.getElementById('morseListenInput');
    if (val.toUpperCase() === _morseListenChar) {
        if (fb) { fb.textContent = '✓ Correct! — ' + MORSE_TABLE[_morseListenChar]; fb.style.color = 'var(--success)'; }
        if (disp) disp.textContent = _morseListenChar;
        setTimeout(() => { newMorseListenChar(); if (inp) inp.value = ''; }, 1200);
    } else if (val.length >= 1) {
        if (fb) { fb.textContent = '✗ Try again'; fb.style.color = 'var(--danger)'; }
        setTimeout(() => { if (inp) inp.value = ''; }, 400);
    }
}

// ── QUIZ ─────────────────────────────────────────────────────────────
function startMorseQuiz() {
    _morseScore = 0; _morseStreak = 0; _morseQNum = 0;
    updateMorseQuizStats();
    nextMorseQuiz();
}

function updateMorseQuizStats() {
    const s = document.getElementById('morseScore'); if (s) s.textContent = _morseScore;
    const st = document.getElementById('morseStreak'); if (st) st.textContent = _morseStreak;
    const q = document.getElementById('morseQNum'); if (q) q.textContent = _morseQNum + 1;
}

function nextMorseQuiz() {
    const keys = Object.keys(MORSE_TABLE);
    _morseQuizChar = keys[Math.floor(Math.random() * keys.length)];
    _morseQNum++;
    updateMorseQuizStats();

    const charEl = document.getElementById('morseQuizChar');
    const fb = document.getElementById('morseQuizFeedback');
    const nextBtn = document.getElementById('morseNextBtn');
    const optEl = document.getElementById('morseQuizOptions');
    const promptEl = document.getElementById('morseQuizPrompt');

    if (charEl) charEl.textContent = _morseQuizChar;
    if (fb) { fb.textContent = ''; }
    if (nextBtn) nextBtn.style.display = 'none';

    // Decide question direction (50/50): char→code or code→char
    const mode = Math.random() > 0.5 ? 'char2code' : 'code2char';
    const correct = MORSE_TABLE[_morseQuizChar];

    if (mode === 'char2code') {
        if (promptEl) promptEl.textContent = 'What is the Morse code for:';
        if (charEl) charEl.textContent = _morseQuizChar;
        // 4 options: correct + 3 wrong codes
        const wrongs = keys.filter(k => k !== _morseQuizChar).sort(() => Math.random()-0.5).slice(0,3).map(k => MORSE_TABLE[k]);
        const opts = [correct, ...wrongs].sort(() => Math.random()-0.5);
        if (optEl) optEl.innerHTML = opts.map(o => `
            <button onclick="answerMorseQuiz('${o}','${correct}','char2code')"
                    style="background:#111;border:2px solid #444;border-radius:8px;padding:12px;font-size:16px;font-family:'SF Mono',monospace;color:#fff;cursor:pointer;letter-spacing:4px;transition:all 0.15s;">${o}</button>`).join('');
    } else {
        if (promptEl) promptEl.textContent = 'Which character is this code?';
        if (charEl) charEl.textContent = correct;
        charEl.style.fontSize = correct.length > 4 ? '28px' : '40px';
        charEl.style.letterSpacing = '6px';
        const wrongs = keys.filter(k => k !== _morseQuizChar).sort(() => Math.random()-0.5).slice(0,3);
        const opts = [_morseQuizChar, ...wrongs].sort(() => Math.random()-0.5);
        if (optEl) optEl.innerHTML = opts.map(o => `
            <button onclick="answerMorseQuiz('${o}','${_morseQuizChar}','code2char')"
                    style="background:#111;border:2px solid #444;border-radius:8px;padding:12px;font-size:22px;font-family:'SF Mono',monospace;color:#fff;cursor:pointer;transition:all 0.15s;">${o}</button>`).join('');
    }
}

function answerMorseQuiz(chosen, correct, mode) {
    const fb = document.getElementById('morseQuizFeedback');
    const nextBtn = document.getElementById('morseNextBtn');
    const opts = document.querySelectorAll('#morseQuizOptions button');
    opts.forEach(b => b.disabled = true);

    if (chosen === correct) {
        _morseScore++; _morseStreak++;
        if (fb) { fb.textContent = '✓ Correct!'; fb.style.color = 'var(--success)'; }
        opts.forEach(b => { if (b.textContent.trim() === correct) b.style.background = 'rgba(48,209,88,0.2)'; });
        playMorseChar(_morseQuizChar);
    } else {
        _morseStreak = 0;
        if (fb) { fb.textContent = `✗ It was: ${correct}`; fb.style.color = 'var(--danger)'; }
        opts.forEach(b => {
            if (b.textContent.trim() === chosen) b.style.background = 'rgba(255,69,58,0.2)';
            if (b.textContent.trim() === correct) b.style.background = 'rgba(48,209,88,0.15)';
        });
    }
    updateMorseQuizStats();
    if (nextBtn) nextBtn.style.display = '';
    if (_morseQNum >= 10) {
        if (nextBtn) { nextBtn.textContent = `Finish (${_morseScore}/10)`; nextBtn.onclick = () => { _morseQNum = 0; startMorseQuiz(); }; }
    }
}

function playMorseQuizHint() { playMorseChar(_morseQuizChar); }

// ── WORDS MODE ────────────────────────────────────────────────────────────
const MORSE_WORD_LISTS = {
    aviation: [
        'METAR','ATIS','SIGMET','AIRMET','NOTAM','TACAN','VORTAC',
        'CLEARANCE','DEPARTURE','APPROACH','TOWER','GROUND','CENTER',
        'SQUAWK','TRANSPONDER','IFR','VFR','LIFR','MVFR',
        'RCTP','RJTT','EDDM','EGLL','KMHR','WSSS','VHHH',
    ],
    alphabet: [
        'ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GOLF',
        'HOTEL','INDIA','JULIET','KILO','LIMA','MIKE','NOVEMBER',
        'OSCAR','PAPA','QUEBEC','ROMEO','SIERRA','TANGO','UNIFORM',
        'VICTOR','WHISKEY','XRAY','YANKEE','ZULU',
    ],
    callsign: [
        'UNITED','DELTA','CATHAY','CHINA','JAPAN','KOREAN','EVA',
        'SINGAPORE','EMIRATES','LUFTHANSA','BRITISH','AIR FRANCE',
        'N12345','B18101','JA8088','HL7700','9V STD',
    ],
};

let _morseWordsCat    = 'aviation';
let _morseCurrentWord = '';
let _morseWordsScore  = 0;

function setWordsCat(cat) {
    _morseWordsCat = cat;
    document.querySelectorAll('[id^="mwCat-"]').forEach(btn => {
        const active = btn.id === 'mwCat-' + cat;
        btn.style.background    = active ? '#e8a020' : 'transparent';
        btn.style.color         = active ? '#000'    : '#888';
        btn.style.borderColor   = active ? '#e8a020' : '#444';
    });
    const customRow = document.getElementById('morseWordsCustomRow');
    if (customRow) customRow.style.display = cat === 'custom' ? 'flex' : 'none';
    if (cat !== 'custom') newMorseWord();
}

function initMorseWords() {
    _morseWordsScore = 0;
    updateWordsScore();
    setWordsCat('aviation');
}

function newMorseWord() {
    const list = MORSE_WORD_LISTS[_morseWordsCat] || MORSE_WORD_LISTS.aviation;
    _morseCurrentWord = list[Math.floor(Math.random() * list.length)].replace(/\s+/g,' ').toUpperCase();
    const disp = document.getElementById('morseWordsDisplay');
    const inp  = document.getElementById('morseWordsInput');
    const fb   = document.getElementById('morseWordsFeedback');
    if (disp) disp.innerHTML = '<span style="font-size:32px;letter-spacing:6px;font-family:\'SF Mono\',monospace;color:#e8a020;font-weight:900;">?</span>';
    if (inp)  { inp.value = ''; }
    if (fb)   { fb.textContent = ''; fb.style.color = ''; }
}

function playMorseWord() {
    if (!_morseCurrentWord) return;
    const wpm = parseInt(document.getElementById('morseWpmInput')?.value || '12', 10);
    const ctx  = getMorseAudioCtx();
    const unit = 1.2 / wpm;
    let t = ctx.currentTime + 0.1;
    for (const char of _morseCurrentWord) {
        if (char === ' ') { t += unit * 7; continue; }
        const code = MORSE_TABLE[char];
        if (!code) { t += unit * 3; continue; }
        for (const sym of code) {
            const dur = sym === '.' ? unit : unit * 3;
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = 700;
            osc.connect(gain); gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.4, t + 0.005);
            gain.gain.setValueAtTime(0.4, t + dur - 0.005);
            gain.gain.linearRampToValueAtTime(0, t + dur);
            osc.start(t); osc.stop(t + dur + 0.01);
            t += dur + unit;
        }
        t += unit * 2; // inter-char gap (unit * 3 total with the intra-char gap)
    }
}

function playWordsCustom() {
    const val = document.getElementById('morseWordsCustomInput')?.value.trim().toUpperCase();
    if (!val) return;
    _morseCurrentWord = val;
    const disp = document.getElementById('morseWordsDisplay');
    if (disp) disp.innerHTML = '<span style="font-size:32px;letter-spacing:6px;font-family:\'SF Mono\',monospace;color:#666;font-weight:900;">▶ Playing...</span>';
    playMorseWord();
}

function checkMorseWordAnswer(inp) {
    const val = inp.value.toUpperCase().trim();
    const fb  = document.getElementById('morseWordsFeedback');
    const disp = document.getElementById('morseWordsDisplay');
    if (!val || !_morseCurrentWord) return;
    if (val === _morseCurrentWord) {
        _morseWordsScore++;
        updateWordsScore();
        if (fb) { fb.textContent = `✓ Correct! — ${_morseCurrentWord}`; fb.style.color = '#30d158'; }
        if (disp) disp.innerHTML = `<span style="font-size:28px;letter-spacing:4px;font-family:'SF Mono',monospace;color:#30d158;font-weight:900;">${_morseCurrentWord}</span>`;
        setTimeout(() => { inp.value = ''; newMorseWord(); }, 1400);
    }
}

function skipMorseWord() {
    const fb   = document.getElementById('morseWordsFeedback');
    const disp = document.getElementById('morseWordsDisplay');
    if (fb) { fb.textContent = `Answer: ${_morseCurrentWord}`; fb.style.color = '#ff9f0a'; }
    if (disp) disp.innerHTML = `<span style="font-size:28px;letter-spacing:4px;font-family:'SF Mono',monospace;color:#ff9f0a;font-weight:900;">${_morseCurrentWord}</span>`;
    setTimeout(() => newMorseWord(), 1800);
}

function updateWordsScore() {
    const el = document.getElementById('morseWordsScore');
    if (el) el.textContent = _morseWordsScore;
}
