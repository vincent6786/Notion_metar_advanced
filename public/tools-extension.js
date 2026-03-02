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
        toolsExtension.style.zIndex = '1000';
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
            'e6b-trainer': 'E6B Trainer (UND)'
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

// ============================================================================
// GREAT CIRCLE CALCULATOR
// ============================================================================

function calculateGreatCircle() {
    const from = document.getElementById('gc-from').value.trim().toUpperCase();
    const to = document.getElementById('gc-to').value.trim().toUpperCase();
    
    // For demo purposes - in production, you'd need airport coordinates database
    // This is a simplified example
    const result = document.getElementById('gc-result');
    
    if (!from || !to) {
        result.innerHTML = '<div style="color:var(--sub-text);">Enter departure and destination airports</div>';
        return;
    }
    
    // Mock calculation (you'll need real airport coordinates)
    result.innerHTML = `
        <div style="color:var(--sub-text); margin-bottom:8px;">Route: ${from} → ${to}</div>
        <div style="font-size:11px; color:#666; margin-bottom:12px;">
            Note: Connect airport database for accurate calculations
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div style="background:#1c1c1e; padding:12px; border-radius:8px;">
                <div style="font-size:11px; color:var(--sub-text);">Distance (NM)</div>
                <div style="font-size:20px; font-weight:800; color:var(--accent);">--</div>
            </div>
            <div style="background:#1c1c1e; padding:12px; border-radius:8px;">
                <div style="font-size:11px; color:var(--sub-text);">Initial Track</div>
                <div style="font-size:20px; font-weight:800; color:var(--success);">--°</div>
            </div>
        </div>
    `;
}

// ============================================================================
// WEATHER TERMS LOOKUP
// ============================================================================

const weatherTerms = {
    // Precipitation
    'DZ': { term: 'Drizzle', desc: 'Light precipitation with drops smaller than rain' },
    'RA': { term: 'Rain', desc: 'Water droplets falling from clouds' },
    'SN': { term: 'Snow', desc: 'Ice crystals falling from clouds' },
    'SG': { term: 'Snow Grains', desc: 'Very small white opaque particles' },
    'IC': { term: 'Ice Crystals', desc: 'Diamond dust, small ice crystals' },
    'PL': { term: 'Ice Pellets', desc: 'Sleet, frozen raindrops' },
    'GR': { term: 'Hail', desc: 'Ice balls or stones (≥5mm)' },
    'GS': { term: 'Small Hail', desc: 'Snow pellets (<5mm)' },
    'UP': { term: 'Unknown Precipitation', desc: 'Automated station detected precip' },
    
    // Obscuration
    'BR': { term: 'Mist', desc: 'Visibility ≥5/8 SM but <6 SM' },
    'FG': { term: 'Fog', desc: 'Visibility <5/8 SM due to water droplets' },
    'FU': { term: 'Smoke', desc: 'Visibility reduced by smoke particles' },
    'VA': { term: 'Volcanic Ash', desc: 'Ash suspended in atmosphere' },
    'DU': { term: 'Dust', desc: 'Widespread dust raised by wind' },
    'SA': { term: 'Sand', desc: 'Sand raised by wind' },
    'HZ': { term: 'Haze', desc: 'Dry particles suspended in air' },
    'PY': { term: 'Spray', desc: 'Water spray limiting visibility' },
    
    // Other phenomena
    'PO': { term: 'Dust/Sand Whirls', desc: 'Well-developed dust or sand devils' },
    'SQ': { term: 'Squalls', desc: 'Sudden increase in wind ≥16kt' },
    'FC': { term: 'Funnel Cloud', desc: 'Tornado or waterspout' },
    'SS': { term: 'Sandstorm', desc: 'Severe sand reducing visibility' },
    'DS': { term: 'Duststorm', desc: 'Severe dust reducing visibility' },
    
    // Descriptors
    'MI': { term: 'Shallow', desc: 'Ground-level phenomenon' },
    'BC': { term: 'Patches', desc: 'Random occurrence' },
    'PR': { term: 'Partial', desc: 'Covers part of aerodrome' },
    'DR': { term: 'Low Drifting', desc: 'Below 6 feet' },
    'BL': { term: 'Blowing', desc: 'Raised above 6 feet' },
    'SH': { term: 'Shower(s)', desc: 'Precipitation of short duration' },
    'TS': { term: 'Thunderstorm', desc: 'Lightning/thunder present' },
    'FZ': { term: 'Freezing', desc: 'Supercooled, forms ice on contact' },
    
    // Intensity
    '-': { term: 'Light', desc: 'Light intensity' },
    '+': { term: 'Heavy', desc: 'Heavy/severe intensity' },
    'VC': { term: 'Vicinity', desc: 'Within 5-10 SM of aerodrome' }
};

function searchWeatherTerms() {
    const searchInput = document.getElementById('wx-search').value.trim().toUpperCase();
    const resultsEl = document.getElementById('wx-results');
    
    if (!searchInput) {
        displayAllWeatherTerms();
        return;
    }
    
    // Find matching terms
    const matches = [];
    for (let code in weatherTerms) {
        if (code.includes(searchInput) || 
            weatherTerms[code].term.toUpperCase().includes(searchInput) ||
            weatherTerms[code].desc.toUpperCase().includes(searchInput)) {
            matches.push({ code, ...weatherTerms[code] });
        }
    }
    
    if (matches.length === 0) {
        resultsEl.innerHTML = '<div style="color:var(--sub-text); padding:20px; text-align:center;">No matching weather terms found</div>';
        return;
    }
    
    let html = '';
    matches.forEach(item => {
        html += `
            <div style="background:#1c1c1e; padding:12px; border-radius:8px; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                    <div style="font-size:14px; font-weight:800; color:var(--accent); font-family:'SF Mono',monospace;">${item.code}</div>
                    <div style="font-size:13px; font-weight:700; color:#fff;">${item.term}</div>
                </div>
                <div style="font-size:12px; color:var(--sub-text); line-height:1.5;">${item.desc}</div>
            </div>
        `;
    });
    
    resultsEl.innerHTML = html;
}

function displayAllWeatherTerms() {
    const resultsEl = document.getElementById('wx-results');
    
    let html = '<div style="font-size:13px; font-weight:700; color:var(--accent); margin-bottom:12px;">PRECIPITATION</div>';
    ['DZ', 'RA', 'SN', 'SG', 'IC', 'PL', 'GR', 'GS', 'UP'].forEach(code => {
        const item = weatherTerms[code];
        html += `
            <div style="background:#1c1c1e; padding:10px; border-radius:6px; margin-bottom:6px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="font-size:13px; font-weight:800; color:var(--accent); font-family:'SF Mono',monospace; width:40px;">${code}</div>
                    <div style="flex:1;">
                        <div style="font-size:12px; font-weight:700; color:#fff;">${item.term}</div>
                        <div style="font-size:11px; color:var(--sub-text);">${item.desc}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '<div style="font-size:13px; font-weight:700; color:var(--accent); margin:20px 0 12px 0;">OBSCURATION</div>';
    ['BR', 'FG', 'FU', 'VA', 'DU', 'SA', 'HZ', 'PY'].forEach(code => {
        const item = weatherTerms[code];
        html += `
            <div style="background:#1c1c1e; padding:10px; border-radius:6px; margin-bottom:6px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="font-size:13px; font-weight:800; color:var(--accent); font-family:'SF Mono',monospace; width:40px;">${code}</div>
                    <div style="flex:1;">
                        <div style="font-size:12px; font-weight:700; color:#fff;">${item.term}</div>
                        <div style="font-size:11px; color:var(--sub-text);">${item.desc}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    resultsEl.innerHTML = html;
}

// ============================================================================
// ABBREVIATIONS DATABASE (Link to external tool)
// ============================================================================

function openAbbreviations() {
    const url = 'https://acronym-dictionary.vercel.app/';
    const resultEl = document.getElementById('abbrev-content');
    
    // Embed the abbreviation tool in an iframe
    resultEl.innerHTML = `
        <div style="margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
            <div style="font-size:13px; font-weight:700; color:var(--accent);">AVIATION ABBREVIATIONS</div>
            <button onclick="window.open('${url}', '_blank')" class="tool-btn" style="background:var(--accent); border:none; color:#000; padding:6px 12px; font-size:11px; font-weight:700;">
                OPEN IN NEW TAB ↗
            </button>
        </div>
        <iframe src="${url}" 
                style="width:100%; height:65vh; border:1px solid #333; border-radius:8px; background:#fff;">
        </iframe>
        <div style="margin-top:8px; font-size:11px; color:var(--sub-text); text-align:center;">
            Searchable database of aviation acronyms and abbreviations
        </div>
    `;
}

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
    
    resultEl.innerHTML = `
        <div style="margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
            <div style="font-size:13px; font-weight:700; color:var(--accent);">UND E6B FLIGHT COMPUTER TRAINER</div>
            <button onclick="window.open('${url}', '_blank')" class="tool-btn" style="background:var(--accent); border:none; color:#000; padding:6px 12px; font-size:11px; font-weight:700;">
                OPEN IN NEW TAB ↗
            </button>
        </div>
        <iframe src="${url}" 
                style="width:100%; height:60vh; border:1px solid #333; border-radius:8px; background:#fff;">
        </iframe>
        <div style="margin-top:8px; font-size:11px; color:var(--sub-text); text-align:center;">
            Interactive E6B flight computer trainer from University of North Dakota
        </div>
    `;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize weather terms display when tool is opened
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tools as needed
    console.log('Tools Extension loaded');
});
