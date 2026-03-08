
        // ================================================================
        // WHAT'S NEW SYSTEM
        // ================================================================
        const WHATS_NEW = {
            version: '3.3.0',                         // ← bump this on every update
            title: 'METAR GO — Cloud Edition',
            changes: [
                {
                    icon: '📱',
                    title: 'Dashboard mode!',
                    desc: 'Toggle in the settings~ A dahsboard with multi-airport~ New combined METAR + TAF tab when enabled. Switch between views with the pill toggle.'
                },
                {
                    icon: '🔨',
                    title: 'Aviation tools added ‼️',
                    desc: 'New update for Unit conversion & Abbreviation'
                },
                // {
                //     icon: '📊',
                //     title: 'Data sources updated',
                //     desc: 'See more in the Help section~'
                // },
                // {
                //     icon: '🔤',
                //     title: 'IATA codes in Dashboard',
                //     desc: 'Add airports by IATA code (e.g. JFK) — auto-resolves to ICAO.'
                // },
                // {
                //     icon: '🛬',
                //     title: 'Prefered runway~',
                //     desc: 'When setting default airport, you can either select auto or rwy needed!'
                // },
                // {
                //     icon: '📋',
                //     title: 'Raw data switch in Dashborad',
                //     desc: 'Switch between raw data and easy view in Dashboard 😎'
                // },
                {
                    icon: '✅',
                    title: 'Bug fixed',
                    desc: 'UI and smoothness clean up~~'
                }
            ]
        };
        
        function checkWhatsNew() {
            const seenVersion = localStorage.getItem('efb_seen_version');
            if (seenVersion === WHATS_NEW.version) return;   // already seen this version
        
            // Populate content
            document.getElementById('whatsNewVersion').innerText = WHATS_NEW.version;
            const list = document.getElementById('whatsNewList');
            list.innerHTML = WHATS_NEW.changes.map(c => `
                <div class="whatsnew-item">
                    <div class="whatsnew-icon">${c.icon}</div>
                    <div class="whatsnew-item-text">
                        <div class="whatsnew-item-title">${c.title}</div>
                        <div class="whatsnew-item-desc">${c.desc}</div>
                    </div>
                </div>`).join('');
        
            document.getElementById('whatsNewModal').classList.add('active');
        }
        
        function closeWhatsNew() {
            localStorage.setItem('efb_seen_version', WHATS_NEW.version);
            document.getElementById('whatsNewModal').classList.remove('active');
        }

        function renderHelpWhatsNew() {
            const versionEl = document.getElementById('helpWhatsNewVersion');
            const listEl    = document.getElementById('helpWhatsNewList');
            if (!versionEl || !listEl) return;
        
            versionEl.innerText = 'v' + WHATS_NEW.version;
            listEl.innerHTML = WHATS_NEW.changes.map(c => `
                <div class="help-item" style="display:flex; align-items:flex-start; gap:12px; background:rgba(255,255,255,0.03); border-radius:8px; padding:10px 12px; margin-bottom:6px;">
                    <div style="font-size:20px; line-height:1; flex-shrink:0; margin-top:1px;">${c.icon}</div>
                    <div>
                        <div class="help-q" style="margin-bottom:3px;">${c.title}</div>
                        <div class="help-a">${c.desc}</div>
                    </div>
                </div>`).join('');
        }

        function initHelpAccordion() {
            document.querySelectorAll('.help-section').forEach(section => {
                const titleEl = section.querySelector('.help-section-title');
                if (!titleEl) return;
        
                // Add chevron to title
                const chevron = document.createElement('span');
                chevron.className = 'help-chevron';
                chevron.innerText = '▼';
                titleEl.appendChild(chevron);
        
                // Wrap all siblings after the title in a .help-body div
                const body = document.createElement('div');
                body.className = 'help-body';
                const children = [...section.children].slice(1); // everything after the title
                children.forEach(el => body.appendChild(el));
                section.appendChild(body);
        
                // Toggle on tap
                titleEl.addEventListener('click', () => {
                    const isOpen = section.classList.contains('open');
                    // Close all
                    document.querySelectorAll('.help-section.open').forEach(s => s.classList.remove('open'));
                    // Open this one if it was closed
                    if (!isOpen) section.classList.add('open');
                });
            });
        
            // Auto-open the What's New section on first load
            const first = document.querySelector('#helpWhatsNewSection');
            if (first) first.classList.add('open');
        }
    
        // ================================================================
        // 1. INDEXEDDB LAYER
        // ================================================================
        const EFB_DB = {
            db: null,

            async init() {
                return new Promise((resolve, reject) => {
                    const req = indexedDB.open('efb_storage_v1', 1);
                    req.onupgradeneeded = (e) => {
                        e.target.result.createObjectStore('settings', { keyPath: 'key' });
                    };
                    req.onsuccess = (e) => { this.db = e.target.result; resolve(); };
                    req.onerror = () => { console.warn('IndexedDB failed, using localStorage'); resolve(); };
                });
            },

            async set(key, value) {
                try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
                if (!this.db) return;
                return new Promise((resolve, reject) => {
                    const tx = this.db.transaction('settings', 'readwrite');
                    tx.objectStore('settings').put({ key, value: JSON.stringify(value) });
                    tx.oncomplete = resolve;
                    tx.onerror = () => reject(tx.error);
                });
            },

            async get(key, fallback = null) {
                if (this.db) {
                    try {
                        const result = await new Promise((resolve, reject) => {
                            const tx = this.db.transaction('settings', 'readonly');
                            const req = tx.objectStore('settings').get(key);
                            req.onsuccess = () => resolve(req.result);
                            req.onerror = () => reject(req.error);
                        });
                        if (result) return JSON.parse(result.value);
                    } catch(e) {}
                }
                const local = localStorage.getItem(key);
                if (local !== null) { try { return JSON.parse(local); } catch(e) {} }
                return fallback;
            },

            async delete(key) {
                try { localStorage.removeItem(key); } catch(e) {}
                if (!this.db) return;
                return new Promise((resolve, reject) => {
                    const tx = this.db.transaction('settings', 'readwrite');
                    tx.objectStore('settings').delete(key);
                    tx.oncomplete = resolve;
                    tx.onerror = () => reject(tx.error);
                });
            }
        };

        // ================================================================
        // 2. CLOUD FUNCTIONS
        // ================================================================
        function getPin() { return localStorage.getItem('efb_cloud_pin') || null; }

        function updateSyncStatus(text, color) {
            const el = document.getElementById('syncStatus');
            if (el) { el.innerText = text; el.style.color = color; }
        }

        async function cloudSave(key, value) {
            const pin = getPin();
            if (!pin || !navigator.onLine) return;
            try {
                const res = await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin, key, value })
                });
                if (!res.ok) throw new Error('Save failed');
                updateSyncStatus('✅ Synced', 'var(--success)');
            } catch(e) {
                console.warn('Cloud save failed:', e);
                updateSyncStatus('⚠️ Sync failed', 'var(--warn)');
            }
        }

        async function cloudLoad(key, fallback = null) {
            const pin = getPin();
            if (!pin || !navigator.onLine) return fallback;
            try {
                const res = await fetch(`/api/settings?pin=${pin}&key=${key}`);
                const data = await res.json();
                return data.value ?? fallback;
            } catch(e) { return fallback; }
        }

        async function cloudRestoreAll() {
            const pin = getPin();
            if (!pin || !navigator.onLine) return false;
            try {
                const res = await fetch(`/api/settings?pin=${pin}`);
                const data = await res.json();
                if (!data.found) return false;
                for (const [key, value] of Object.entries(data.settings)) {
                    await EFB_DB.set(key, value);
                }
                console.log('✅ Cloud restore complete');
                return true;
            } catch(e) {
                console.warn('Cloud restore failed:', e);
                return false;
            }
        }
        
        async function deleteCloudProfile() {
            const pin = localStorage.getItem('efb_cloud_pin');
            if (!pin) return;
            if (!confirm('⚠️ Delete Cloud Backup?\n\nThis removes all your saved airports and\nsettings from the cloud permanently.\n\nYour data on this device is kept.\nYou cannot undo this.')) return;
            try {
                const res = await fetch(`/api/settings?pin=${pin}`, { method: 'DELETE' });
                if (res.ok) {
                    // Strip cloud credentials only — keep all local data
                    localStorage.removeItem('efb_cloud_pin');
                    localStorage.removeItem('efb_worldclock_backup');
                    localStorage.removeItem('efb_worldclock_backup_asked');
                    await EFB_DB.delete('_efb_cloud_pin');
        
                    // Switch storage mode to local (no setup screen, stays in app)
                    await Storage.setMode('local');
                    Storage.mode = 'local';
        
                    // Refresh Settings UI to show new mode
                    renderStorageModeUI();
        
                    showToast('🗑️ Cloud backup deleted — now running locally');
                } else {
                    showToast('⚠️ Delete failed. Try again.');
                }
            } catch(e) {
                showToast('⚠️ No connection. Try again.');
            }
        }

        // ================================================================
        // 3. UNIFIED STORAGE ROUTER
        // ================================================================
        const Storage = {
            mode: null,

            async init() {
                await EFB_DB.init();

                // 1. Try localStorage first (fast path)
                this.mode = localStorage.getItem('efb_storage_mode');

                // 2. If localStorage was purged by iOS, recover from IndexedDB
                if (!this.mode) {
                    const recovered = await EFB_DB.get('_efb_storage_mode');
                    if (recovered) {
                        this.mode = recovered;
                        // Restore critical keys to localStorage
                        localStorage.setItem('efb_storage_mode', recovered);
                        const pin = await EFB_DB.get('_efb_cloud_pin');
                        if (pin) localStorage.setItem('efb_cloud_pin', pin);
                        console.log('✅ Session recovered from IndexedDB');
                        return true;
                    }
                }

                // 3. Truly first launch — show setup
                if (!this.mode) { showStorageSetup(); return false; }

                // 4. Start keep-alive to prevent future purges
                this._startKeepAlive();
                return true;
            },

            _startKeepAlive() {
                // Re-write critical keys every 23h so iOS never marks them stale
                setInterval(async () => {
                    if (this.mode) {
                        localStorage.setItem('efb_storage_mode', this.mode);
                        await EFB_DB.set('_efb_storage_mode', this.mode);
                        const pin = localStorage.getItem('efb_cloud_pin');
                        if (pin) await EFB_DB.set('_efb_cloud_pin', pin);
                    }
                }, 23 * 60 * 60 * 1000); // 23 hours
            },

            async set(key, value) {
                await EFB_DB.set(key, value);
                if (this.mode === 'cloud' && navigator.onLine) cloudSave(key, value);
            },

            async get(key, fallback = null) { return await EFB_DB.get(key, fallback); },

            async setMode(mode) {
                this.mode = mode;
                localStorage.setItem('efb_storage_mode', mode);
                // Also persist in IndexedDB for iOS resilience
                await EFB_DB.set('_efb_storage_mode', mode);
                this._startKeepAlive();
            }
        };

        function renderStorageModeUI() {
            const mode    = localStorage.getItem('efb_storage_mode');
            const pin     = localStorage.getItem('efb_cloud_pin');
            const label   = document.getElementById('storageModeLabel');
            const pinRow  = document.getElementById('cloudPinRow');
            const pinDisp = document.getElementById('cloudPinDisplay');
            if (!label) return;
            if (mode === 'cloud') {
                label.innerText = '☁️ Cloud Backup — Active';
                label.style.color = 'var(--accent)';
                if (pinRow) pinRow.style.display = 'block';
                if (pinDisp && pin) pinDisp.innerText = '•'.repeat(pin.length);
                updateLastSyncTime();
            } else {
                label.innerText = '📱 This Device Only';
                label.style.color = 'var(--success)';
                if (pinRow) pinRow.style.display = 'none';
            }
        }

        async function updateLastSyncTime() {
            const pin = localStorage.getItem('efb_cloud_pin');
            if (!pin) return;
            try {
                const res  = await fetch(`/api/settings?pin=${pin}&key=_lastUpdated`);
                const data = await res.json();
                const el   = document.getElementById('lastSyncTime');
                if (!el) return;
                if (data.value) {
                    const d = new Date(data.value);
                    el.innerText = d.toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
                } else { el.innerText = 'Not yet synced'; }
            } catch(e) {
                const el = document.getElementById('lastSyncTime');
                if (el) el.innerText = 'Unknown';
            }
        }

        // ================================================================
        // 4. BACKUP CODE LOGIC
        // ================================================================
        window._pinEntry = '';
        window._pinStep  = 'create'; // 'create' | 'confirm' | 'restore'
        window._pinFirst = '';

        function showStorageSetup() {
            document.getElementById('storageSetup').style.display = 'flex';
            document.getElementById('pinSetup').style.display    = 'none';
        }
        function backToStorageSetup() {
            document.getElementById('pinSetup').style.display    = 'none';
            document.getElementById('storageSetup').style.display = 'flex';
        }

        async function chooseStorageMode(mode) {
            if (mode === 'local') {
                await Storage.setMode('local');
                document.getElementById('storageSetup').style.display = 'none';
                renderStorageModeUI();
                showToast('📱 Saved to this device only');
                initApp();
                showOnboarding();
                return;
            }
            document.getElementById('storageSetup').style.display = 'none';
            document.getElementById('pinSetup').style.display     = 'flex';
            resetPinUI('create');
        }

        function resetPinUI(step) {
            window._pinEntry = ''; window._pinStep = step; window._pinFirst = '';
            const isRestore = step === 'restore';
            document.getElementById('pinIcon').innerText    = isRestore ? '🔄' : '☁️';
            document.getElementById('pinTitle').innerText   = isRestore ? 'Restore Cloud Backup' : 'Set Up Cloud Backup';
            document.getElementById('pinSubtitle').innerHTML = isRestore
                ? 'Enter the Backup Code you created on your other device.'
                : 'Create a 4-6 digit Backup Code to save your airports and settings to the cloud.';
            document.getElementById('privacyNote').style.display   = isRestore ? 'none' : 'block';
            document.getElementById('restoreSection').style.display = isRestore ? 'none' : 'block';
            document.getElementById('pinMsg').innerText      = isRestore ? 'Enter your Backup Code' : 'Enter 4-6 digits';
            document.getElementById('pinMsg').style.color    = '#8e8e93';
            document.getElementById('pinConfirmBtn').style.display = 'none';
            updatePinDots(0);
        }

        function switchToRestoreMode() { resetPinUI('restore'); }

        function updatePinDots(count) {
            [0,1,2,3,4,5].forEach(i => {
                const dot = document.getElementById(`dot_${i}`);
                if (!dot) return;
                if (i < count)      { dot.classList.add('filled'); dot.style.opacity = '1'; }
                else if (i < 4)     { dot.classList.remove('filled'); dot.style.opacity = '1'; }
                else                { dot.classList.remove('filled'); dot.style.opacity = count >= i ? '1' : '0.3'; }
            });
            const confirmBtn = document.getElementById('pinConfirmBtn');
            if (count >= 4) {
                confirmBtn.style.display = 'block';
                confirmBtn.innerText = window._pinStep === 'confirm' ? 'Confirm Code →' :
                                       window._pinStep === 'restore' ? 'Restore →' : 'Continue →';
            } else { confirmBtn.style.display = 'none'; }
        }

        function pinPadPress(val) {
            if (val === '⌫') { window._pinEntry = window._pinEntry.slice(0, -1); updatePinDots(window._pinEntry.length); return; }
            if (window._pinEntry.length >= 6) return;
            window._pinEntry += val;
            updatePinDots(window._pinEntry.length);
        }

        async function submitPinEntry() {
            const entered = window._pinEntry;
            const msg = document.getElementById('pinMsg');
            if (entered.length < 4) { msg.innerText = '⚠️ Enter at least 4 digits'; msg.style.color = 'var(--warn)'; return; }

            if (window._pinStep === 'create') {
                window._pinFirst = entered; window._pinEntry = ''; window._pinStep = 'confirm';
                document.getElementById('pinTitle').innerText    = 'Confirm Backup Code';
                document.getElementById('pinSubtitle').innerHTML = 'Enter your Backup Code again to confirm.';
                setTimeout(() => { updatePinDots(0); msg.innerText = 'Re-enter your Backup Code'; msg.style.color = '#8e8e93'; }, 200);

            } else if (window._pinStep === 'confirm') {
                if (entered === window._pinFirst) {
                    msg.innerText = '🔍 Checking availability...'; msg.style.color = '#8e8e93';
                    const inUse = await checkCodeAvailability(entered);
                    if (inUse) {
                        msg.innerText = '';
                        const warningDiv = document.createElement('div');
                        warningDiv.style.cssText = `background:rgba(255,159,10,0.12);border:1px solid rgba(255,159,10,0.4);border-radius:10px;padding:14px;margin:0 0 16px 0;text-align:center;max-width:260px;`;
                        warningDiv.id = 'codeWarning';
                        warningDiv.innerHTML = `
                            <div style="color:#ff9f0a;font-weight:800;margin-bottom:6px;font-size:13px;">⚠️ Code Already In Use</div>
                            <div style="color:#8e8e93;font-size:11px;line-height:1.6;margin-bottom:12px;">
                                This Backup Code already has saved data.<br>Choose a different code or restore the existing backup instead.
                            </div>
                            <div style="display:flex;gap:8px;justify-content:center;">
                                <button onclick="dismissCodeWarning()" style="background:#333;border:1px solid #555;color:#fff;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">Choose Different</button>
                                <button onclick="restoreExistingInstead('${entered}')" style="background:var(--accent);border:none;color:#fff;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">Restore Instead</button>
                            </div>`;
                        const numpad = document.querySelector('#pinSetup > div[style*="grid-template-columns"]');
                        if (numpad) numpad.before(warningDiv);
                    } else {
                        msg.innerText = '✅ Backup Code confirmed!'; msg.style.color = 'var(--success)';
                        setTimeout(() => finalizePinSetup(entered), 600);
                    }
                } else {
                    msg.innerText = '❌ Codes did not match. Try again.'; msg.style.color = 'var(--danger)';
                    window._pinEntry = ''; window._pinFirst = ''; window._pinStep = 'create';
                    document.getElementById('pinTitle').innerText    = 'Set Up Cloud Backup';
                    document.getElementById('pinSubtitle').innerHTML = 'Create a 4-6 digit Backup Code to save your airports and settings to the cloud.';
                    setTimeout(() => { updatePinDots(0); msg.innerText = 'Enter 4-6 digits'; msg.style.color = '#8e8e93'; }, 1500);
                }

            } else if (window._pinStep === 'restore') {
                msg.innerText = '🔍 Looking up your backup...'; msg.style.color = '#8e8e93';
                const confirmBtn = document.getElementById('pinConfirmBtn');
                confirmBtn.disabled = true; confirmBtn.innerText = 'Checking...';
                try {
                    const res  = await fetch(`/api/settings?pin=${entered}`);
                    const data = await res.json();
                    if (data.found) {
                        msg.innerText = '✅ Backup found!'; msg.style.color = 'var(--success)';
                        setTimeout(() => finalizePinSetup(entered), 600);
                    } else {
                        msg.innerText = '❌ No backup found for this code.'; msg.style.color = 'var(--danger)';
                        window._pinEntry = ''; confirmBtn.disabled = false;
                        setTimeout(() => { updatePinDots(0); msg.innerText = 'Enter your Backup Code'; msg.style.color = '#8e8e93'; confirmBtn.innerText = 'Restore →'; }, 2000);
                    }
                } catch(e) {
                    msg.innerText = '⚠️ No connection. Check internet.'; msg.style.color = 'var(--warn)';
                    window._pinEntry = ''; confirmBtn.disabled = false; confirmBtn.innerText = 'Restore →';
                    setTimeout(() => { updatePinDots(0); msg.innerText = 'Enter your Backup Code'; msg.style.color = '#8e8e93'; }, 2000);
                }
            }
        }

        function dismissCodeWarning() {
            document.getElementById('codeWarning')?.remove();
            resetPinUI('create');
            const msg = document.getElementById('pinMsg');
            msg.innerText = '⚠️ Choose a different code'; msg.style.color = 'var(--warn)';
            setTimeout(() => { msg.innerText = 'Enter 4-6 digits'; msg.style.color = '#8e8e93'; }, 2500);
        }

        async function restoreExistingInstead(code) {
            document.getElementById('codeWarning')?.remove();
            const msg = document.getElementById('pinMsg');
            msg.innerText = '☁️ Restoring your backup...'; msg.style.color = 'var(--accent)';
            setTimeout(() => finalizePinSetup(code), 600);
        }

        async function finalizePinSetup(pin) {
            localStorage.setItem('efb_cloud_pin', pin);
            await EFB_DB.set('_efb_cloud_pin', pin);   // ← ADD THIS LINE
            await Storage.setMode('cloud');
            const restored = await cloudRestoreAll();
            document.getElementById('pinSetup').style.display    = 'none';
            document.getElementById('storageSetup').style.display = 'none';
            showToast(restored ? '☁️ Backup restored successfully!' : '✅ Cloud Backup activated!');
            initApp();
            if (!restored) showOnboarding();
        }

        // ================================================================
        // 5. API USAGE MONITORING
        // ================================================================
        let apiStatsCache = null;

        // Shared admin password cache within session
        let _adminPasswordCache = null;

        async function openApiStatsModal() {
            const modal = document.getElementById('apiStatsModal');
            modal.classList.add('active');
            if (_adminPasswordCache) {
                // Already authed — go straight to stats
                showAdminPanel(_adminPasswordCache);
            } else {
                renderAdminLoginPrompt();
            }
        }

        function closeApiStatsModal() {
            document.getElementById('apiStatsModal').classList.remove('active');
        }

        function showAdminConsoleLink() {
            const el = document.getElementById('adminConsoleLink');
            if (el) el.style.display = 'block';
        }

        function renderAdminLoginPrompt() {
            const content = document.getElementById('apiStatsContent');
            content.innerHTML = `
                <div style="text-align:center;padding:40px;color:#8e8e93;">
                    <div style="font-size:32px;margin-bottom:12px;">🔐</div>
                    <div style="font-weight:700;margin-bottom:8px;color:#fff;">Admin Access Required</div>
                    <div style="font-size:12px;margin-bottom:20px;">Enter admin password to view statistics and manage users</div>
                    <input type="password" id="apiAdminPassword" placeholder="Password"
                           onkeypress="if(event.key==='Enter') fetchApiStats()"
                           style="background:#1c1c1e;border:1px solid #555;color:#fff;padding:12px;border-radius:8px;width:200px;font-size:14px;text-align:center;margin-bottom:12px;">
                    <br>
                    <button onclick="fetchApiStats()" style="background:var(--accent);border:none;color:#fff;padding:10px 24px;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;">Unlock →</button>
                </div>`;
        }

        async function fetchApiStats() {
            const content       = document.getElementById('apiStatsContent');
            const passwordInput = document.getElementById('apiAdminPassword');
            const password      = passwordInput?.value;
            if (!password) { alert('Please enter password'); return; }
            content.innerHTML = `<div style="text-align:center;padding:40px;color:#8e8e93;"><div style="font-size:32px;margin-bottom:12px;">⏳</div><div>Unlocking...</div></div>`;
            try {
                const res = await fetch('/api/api-stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                if (res.status === 401) {
                    content.innerHTML = `<div style="text-align:center;padding:40px;"><div style="font-size:32px;margin-bottom:12px;">❌</div><div style="color:var(--danger);font-weight:700;margin-bottom:16px;">Incorrect Password</div><button onclick="renderAdminLoginPrompt()" style="background:#333;border:1px solid #555;color:#fff;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:13px;">Try Again</button></div>`;
                    return;
                }
                const data = await res.json();
                apiStatsCache = data;
                _adminPasswordCache = password;
                showAdminConsoleLink(); // reveal shortcut in Settings
                showAdminPanel(password, 'stats');
            } catch (err) {
                content.innerHTML = `<div style="text-align:center;padding:40px;color:var(--danger);"><div style="font-size:32px;margin-bottom:12px;">⚠️</div><div>Error: ${err.message}</div></div>`;
            }
        }

        function showAdminPanel(password, tab) {
            const activeTab = tab || 'stats';
            const content = document.getElementById('apiStatsContent');
            content.innerHTML = `
                <!-- Tab switcher -->
                <div style="display:flex;gap:0;margin-bottom:20px;background:#1c1c1e;border-radius:10px;padding:3px;border:1px solid #333;">
                    <button id="adminTab-stats" onclick="switchAdminTab('stats','${password}')"
                            style="flex:1;padding:9px;border-radius:8px;border:none;font-size:12px;font-weight:700;cursor:pointer;
                            background:${activeTab==='stats'?'var(--accent)':'transparent'};
                            color:${activeTab==='stats'?'#fff':'#8e8e93'};">📊 API Stats</button>
                    <button id="adminTab-users" onclick="switchAdminTab('users','${password}')"
                            style="flex:1;padding:9px;border-radius:8px;border:none;font-size:12px;font-weight:700;cursor:pointer;
                            background:${activeTab==='users'?'var(--accent)':'transparent'};
                            color:${activeTab==='users'?'#fff':'#8e8e93'};">👥 Users</button>
                </div>
                <div id="adminTabContent"></div>`;

            if (activeTab === 'stats' && apiStatsCache) {
                renderApiStats(apiStatsCache);
            } else if (activeTab === 'users') {
                loadUsersTab(password);
            } else {
                loadStatsAndRender(password);
            }
        }

        async function switchAdminTab(tab, password) {
            // Update button styles
            ['stats','users'].forEach(t => {
                const btn = document.getElementById(`adminTab-${t}`);
                if (!btn) return;
                btn.style.background = t === tab ? 'var(--accent)' : 'transparent';
                btn.style.color      = t === tab ? '#fff'           : '#8e8e93';
            });
            if (tab === 'stats') {
                if (apiStatsCache) renderApiStats(apiStatsCache);
                else await loadStatsAndRender(password);
            } else {
                await loadUsersTab(password);
            }
        }

        async function loadStatsAndRender(password) {
            const tabContent = document.getElementById('adminTabContent');
            if (tabContent) tabContent.innerHTML = `<div style="text-align:center;padding:30px;color:#8e8e93;">⏳ Loading...</div>`;
            try {
                const res  = await fetch('/api/api-stats', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password }) });
                const data = await res.json();
                apiStatsCache = data;
                renderApiStats(data);
            } catch(e) {
                if (tabContent) tabContent.innerHTML = `<div style="color:var(--danger);padding:20px;">Failed to load stats: ${e.message}</div>`;
            }
        }

        async function loadUsersTab(password) {
            const tabContent = document.getElementById('adminTabContent');
            if (!tabContent) return;
            tabContent.innerHTML = `<div style="text-align:center;padding:30px;color:#8e8e93;">⏳ Loading users...</div>`;
            try {
                const res  = await fetch('/api/access', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'list', password }) });
                const data = await res.json();
                renderUsersTab(data.users || [], password);
            } catch(e) {
                tabContent.innerHTML = `<div style="color:var(--danger);padding:20px;">Failed to load users: ${e.message}</div>`;
            }
        }

        function renderUsersTab(users, password) {
            const tabContent = document.getElementById('adminTabContent');
            if (!tabContent) return;

            const activeCount  = users.filter(u => u.active).length;
            const revokedCount = users.filter(u => !u.active).length;
            const todayCalls   = users.reduce((sum, u) => sum + (u.calls_today || 0), 0);

            let html = `
                <!-- Summary -->
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:20px;">
                    <div style="background:rgba(50,215,75,0.1);border:1px solid rgba(50,215,75,0.25);border-radius:10px;padding:12px;text-align:center;">
                        <div style="font-size:22px;font-weight:800;color:var(--success);">${activeCount}</div>
                        <div style="font-size:10px;color:#8e8e93;margin-top:2px;">ACTIVE</div>
                    </div>
                    <div style="background:rgba(255,69,58,0.1);border:1px solid rgba(255,69,58,0.25);border-radius:10px;padding:12px;text-align:center;">
                        <div style="font-size:22px;font-weight:800;color:var(--danger);">${revokedCount}</div>
                        <div style="font-size:10px;color:#8e8e93;margin-top:2px;">REVOKED</div>
                    </div>
                    <div style="background:rgba(10,132,255,0.1);border:1px solid rgba(10,132,255,0.25);border-radius:10px;padding:12px;text-align:center;">
                        <div style="font-size:22px;font-weight:800;color:var(--accent);">${todayCalls}</div>
                        <div style="font-size:10px;color:#8e8e93;margin-top:2px;">CALLS TODAY</div>
                    </div>
                </div>

                <!-- Create new user -->
                <div style="background:#1c1c1e;border:1px solid #333;border-radius:10px;padding:14px;margin-bottom:16px;">
                    <div style="font-size:11px;color:#8e8e93;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">➕ New Access Code</div>
                    <div style="display:flex;gap:8px;margin-bottom:8px;">
                        <input id="newUserName" placeholder="Name (e.g. John)" type="text"
                               style="flex:1;background:#111;border:1px solid #444;color:#fff;padding:9px 10px;border-radius:8px;font-size:13px;outline:none;">
                        <input id="newUserCode" placeholder="Code (e.g. ALPHA-01)" type="text"
                               style="flex:1;background:#111;border:1px solid #444;color:#fff;padding:9px 10px;border-radius:8px;font-size:13px;outline:none;text-transform:uppercase;"
                               oninput="this.value=this.value.toUpperCase()">
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <button onclick="generateRandomCode()" style="background:#2c2c2e;border:1px solid #444;color:#8e8e93;padding:8px 12px;border-radius:8px;font-size:11px;cursor:pointer;white-space:nowrap;">🎲 Random</button>
                        <button onclick="createUser('${password}')" id="createUserBtn"
                                style="flex:1;background:var(--accent);border:none;color:#fff;padding:9px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;">Create →</button>
                    </div>
                    <div id="createUserMsg" style="font-size:11px;margin-top:8px;height:14px;"></div>
                </div>

                <!-- User list -->
                <div style="font-size:11px;color:#8e8e93;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Access Codes (${users.length})</div>`;

            if (users.length === 0) {
                html += `<div style="text-align:center;padding:20px;color:#555;font-size:13px;">No users yet. Create one above.</div>`;
            } else {
                users.forEach(u => {
                    const statusColor = u.active ? 'var(--success)' : 'var(--danger)';
                    const statusText  = u.active ? 'ACTIVE'         : 'REVOKED';
                    const created     = u.created ? new Date(u.created).toLocaleDateString() : '—';
                    html += `
                        <div style="background:#1c1c1e;border:1px solid #2a2a2a;border-radius:10px;padding:12px;margin-bottom:8px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                                <div>
                                    <span style="font-weight:700;color:#fff;font-family:'SF Mono',monospace;font-size:13px;">${u.code}</span>
                                    <span style="color:#8e8e93;font-size:12px;margin-left:8px;">${u.name}</span>
                                </div>
                                <span style="font-size:10px;font-weight:800;color:${statusColor};background:${u.active?'rgba(50,215,75,0.1)':'rgba(255,69,58,0.1)'};padding:2px 8px;border-radius:6px;">${statusText}</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#555;">
                                <span>Created ${created} · ${u.calls_today} calls today</span>
                                <div style="display:flex;gap:6px;">
                                    ${u.active
                                        ? `<button onclick="revokeUser('${u.code}','${password}')" style="background:#2c2c2e;border:1px solid #555;color:var(--danger);padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">Revoke</button>`
                                        : `<button onclick="restoreUser('${u.code}','${password}')" style="background:#2c2c2e;border:1px solid #555;color:var(--success);padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">Restore</button>`}
                                </div>
                            </div>
                        </div>`;
                });
            }

            tabContent.innerHTML = html;
        }

        function generateRandomCode() {
            const adjectives = ['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GOLF','HOTEL','INDIA','JULIET','KILO','LIMA','MIKE','NOVEMBER','OSCAR','PAPA','QUEBEC','ROMEO','SIERRA','TANGO','UNIFORM','VICTOR','WHISKEY'];
            const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
            const num  = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
            const code = `${adj}-${num}`;
            const input = document.getElementById('newUserCode');
            if (input) input.value = code;
        }

        async function createUser(password) {
            const name    = document.getElementById('newUserName')?.value.trim();
            const code    = document.getElementById('newUserCode')?.value.trim().toUpperCase();
            const msg     = document.getElementById('createUserMsg');
            const btn     = document.getElementById('createUserBtn');

            if (!name) { msg.innerText = '⚠️ Enter a name'; msg.style.color = 'var(--warn)'; return; }
            if (!code || code.length < 4) { msg.innerText = '⚠️ Code must be 4+ characters'; msg.style.color = 'var(--warn)'; return; }

            btn.disabled = true; btn.innerText = 'Creating...';
            msg.innerText = ''; 

            try {
                const res  = await fetch('/api/access', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'create', code, name, password }) });
                const data = await res.json();
                if (res.status === 409) {
                    msg.innerText = '❌ Code already exists. Try another.'; msg.style.color = 'var(--danger)';
                } else if (data.success) {
                    msg.innerText = `✅ Created: ${data.code}`; msg.style.color = 'var(--success)';
                    document.getElementById('newUserName').value = '';
                    document.getElementById('newUserCode').value = '';
                    setTimeout(() => loadUsersTab(password), 800);
                } else {
                    msg.innerText = `❌ ${data.error || 'Failed'}`; msg.style.color = 'var(--danger)';
                }
            } catch(e) {
                msg.innerText = '⚠️ Network error'; msg.style.color = 'var(--warn)';
            }
            btn.disabled = false; btn.innerText = 'Create →';
        }

        async function revokeUser(code, password) {
            if (!confirm(`Revoke access for ${code}?

They will be blocked immediately on next refresh.`)) return;
            try {
                await fetch('/api/access', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'revoke', code, password }) });
                loadUsersTab(password);
            } catch(e) { alert('Failed to revoke. Check connection.'); }
        }

        async function restoreUser(code, password) {
            try {
                await fetch('/api/access', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'restore', code, password }) });
                loadUsersTab(password);
            } catch(e) { alert('Failed to restore. Check connection.'); }
        }

        function renderApiStats(data) {
            const content = document.getElementById('adminTabContent') || document.getElementById('apiStatsContent');
            const { date, keys, aggregate } = data;
            let html = `
                <div style="margin-bottom:24px;">
                    <div style="font-size:11px;color:#8e8e93;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Date: ${date} UTC</div>
                    <div style="background:rgba(10,132,255,0.1);border:1px solid rgba(10,132,255,0.3);border-radius:12px;padding:16px;">
                        <div style="font-size:13px;color:#8e8e93;margin-bottom:6px;">Total Usage Across All Keys</div>
                        <div style="font-size:28px;font-weight:800;color:#fff;margin-bottom:8px;">${aggregate.total_usage.toLocaleString()} <span style="font-size:16px;color:#8e8e93;">/ ${aggregate.total_limit.toLocaleString()}</span></div>
                        <div style="font-size:12px;color:#0a84ff;">${aggregate.total_remaining.toLocaleString()} requests remaining (${aggregate.percentage}% used)</div>
                    </div>
                </div>
                <div style="font-size:11px;color:#8e8e93;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Individual Key Breakdown</div>`;
            keys.forEach(key => {
                const barColor = key.percentage >= 95 ? 'var(--danger)' : key.percentage >= 80 ? 'var(--warn)' : 'var(--success)';
                html += `
                    <div style="background:#1c1c1e;border:1px solid #333;border-radius:10px;padding:14px;margin-bottom:10px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="font-weight:700;color:#fff;">Key #${key.id}</div>
                            <div style="font-size:13px;color:${barColor};font-weight:700;">${key.percentage}%</div>
                        </div>
                        <div style="display:flex;justify-content:space-between;font-size:12px;color:#8e8e93;margin-bottom:6px;">
                            <span>${key.usage.toLocaleString()} used</span>
                            <span>${key.remaining.toLocaleString()} remaining</span>
                        </div>
                        <div style="height:6px;background:#222;border-radius:3px;overflow:hidden;">
                            <div style="height:100%;background:${barColor};width:${key.percentage}%;transition:width 0.3s ease;"></div>
                        </div>
                    </div>`;
            });
            html += `<div style="margin-top:24px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;font-size:11px;color:#555;line-height:1.6;">ℹ️ Stats reset daily at midnight UTC. Keys rotate automatically based on usage.</div>`;
            content.innerHTML = html;
        }

        async function updateApiQuickStats() {
            const label = document.getElementById('apiStatusLabel');
            if (!label) return;
            label.innerText = '✅ Active';
            label.style.color = 'var(--success)';
        }

        function toggleShowCode() {
            const display = document.getElementById('cloudPinDisplay');
            const btn     = document.getElementById('showCodeBtn');
            const pin     = localStorage.getItem('efb_cloud_pin') || '';
            if (btn.innerText === 'Show') {
                display.innerText = pin; btn.innerText = 'Hide';
                setTimeout(() => { display.innerText = '•'.repeat(pin.length); btn.innerText = 'Show'; }, 5000);
            } else { display.innerText = '•'.repeat(pin.length); btn.innerText = 'Show'; }
        }

        // ================================================================
        // 6. GLOBAL STATE
        // ================================================================
        let currentWind     = { dir: 0, spd: 0 };
        let currentMetar    = { temp: 15, alt: 1013, altUnit: 'hPa' };
        let stationData     = null;
        let stationSunTimes = null;
        let useMetric       = true;
        let tafDataCache    = null;
        let lastMetarObj    = null;
        let meteoDataCache  = null;
        let cityList        = [];
        let stationOffsetSec = 0;
        let showLocalSun     = false;

        const CLOUD_ICON_PATH = "M25 15C25 10.58 21.42 7 17 7C16.5 7 16 7.05 15.54 7.15C14.73 4.19 12.06 2 9 2C5.13 2 2 5.13 2 9C2 9.17 2 9.35 2.03 9.5C0.84 10.19 0 11.5 0 13C0 15.21 1.79 17 4 17H25C27.76 17 30 14.76 30 12C30 9.24 27.76 7 25 7V15Z";

        // ================================================================
        // UNIT PREFERENCES & DASHBOARD CARD STYLE
        // ================================================================
        
        function getVisUnit()      { return localStorage.getItem('efb_vis_unit')        || 'sm'; }
        function getTempUnit()     { return localStorage.getItem('efb_temp_unit')       || 'c';  }
        function getDashCardStyle(){ return localStorage.getItem('efb_dash_card_style') || 'raw'; }
        
        /** Format visibility value (in SM) according to user's unit preference */
        function formatVisDisplay(smValue) {
            if (smValue == null) return '--';
            const unit = getVisUnit();
            if (unit === 'km') {
                const km = smValue * 1.60934;
                if (km >= 16) return '10 km or more';
                return `${km.toFixed(1)} km`;
            }
            // Statute miles
            if (smValue >= 10) return 'P6SM';
            return `${smValue} sm`;
        }
        
        /** Format Celsius temperature according to user's unit preference */
        function formatTempDisplay(celsius) {
            if (celsius == null) return '--';
            if (getTempUnit() === 'f') return `${Math.round(celsius * 1.8 + 32)}°F`;
            return `${celsius}°C`;
        }
        
        /** Decode cloud array to human-readable string (most significant layer) */
        function decodeCloudLayer(clouds) {
            if (!clouds || clouds.length === 0) return 'clear';
            const typeMap = {
                SKC: 'sky clear',    CLR: 'clear',            FEW: 'few clouds',
                SCT: 'scattered clouds', BKN: 'broken clouds', OVC: 'overcast',
                VV:  'vertical visibility'
            };
            // Prefer ceiling layer (BKN/OVC/VV), fallback to topmost
            const ceiling = clouds.find(c => ['BKN','OVC','VV'].includes(c.type));
            const layer   = ceiling || clouds[clouds.length - 1];
            const altFt   = (layer.altitude * 100).toLocaleString();
            return `${typeMap[layer.type] || layer.type} at ${altFt} ft`;
        }
        
        /** Set visibility unit and refresh dashboard */
        function setVisUnit(unit) {
            localStorage.setItem('efb_vis_unit', unit);
            document.getElementById('unitVisSm')?.classList.toggle('active-unit', unit === 'sm');
            document.getElementById('unitVisKm')?.classList.toggle('active-unit', unit === 'km');
            if (multiAirports.length > 0) renderMultiDashboard();
        }
        
        /** Set temperature unit and refresh dashboard */
        function setTempUnit(unit) {
            localStorage.setItem('efb_temp_unit', unit);
            document.getElementById('unitTempC')?.classList.toggle('active-unit', unit === 'c');
            document.getElementById('unitTempF')?.classList.toggle('active-unit', unit === 'f');
            if (multiAirports.length > 0) renderMultiDashboard();
        }

        function getPressUnit() { return localStorage.getItem('efb_press_unit') || 'hpa'; }
        
        function formatPressDisplay(altimeterValue) {
            if (!altimeterValue) return '--';
            let hpa, inhg;
            if (altimeterValue < 200) {          // value is inHg
                inhg = altimeterValue;
                hpa  = Math.round(altimeterValue * 33.8639);
            } else {                             // value is hPa
                hpa  = altimeterValue;
                inhg = (altimeterValue * 0.02953).toFixed(2);
            }
            return getPressUnit() === 'inhg'
                ? `${parseFloat(inhg).toFixed(2)} inHg`
                : `${hpa} hPa`;
        }
        
        function setPressUnit(unit) {
            localStorage.setItem('efb_press_unit', unit);
            document.getElementById('unitPressHpa')?.classList.toggle('active-unit',  unit === 'hpa');
            document.getElementById('unitPressInhg')?.classList.toggle('active-unit', unit === 'inhg');
            if (multiAirports.length > 0) renderMultiDashboard();
        }
    
        /** Set dashboard card style and refresh */
        function setDashCardStyle(style) {
            localStorage.setItem('efb_dash_card_style', style);
            document.getElementById('cardStyleRaw')?.classList.toggle('active-unit',      style === 'raw');
            document.getElementById('cardStyleDetailed')?.classList.toggle('active-unit', style === 'detailed');
            renderMultiDashboard();
        }
        
        /** Apply saved unit preferences to the Settings UI toggles */
        function loadUnitPreferences() {
            const vis   = getVisUnit();
            const temp  = getTempUnit();
            const press = getPressUnit();
            const card  = getDashCardStyle();
            document.getElementById('unitVisSm')?.classList.toggle('active-unit',    vis   === 'sm');
            document.getElementById('unitVisKm')?.classList.toggle('active-unit',    vis   === 'km');
            document.getElementById('unitTempC')?.classList.toggle('active-unit',    temp  === 'c');
            document.getElementById('unitTempF')?.classList.toggle('active-unit',    temp  === 'f');
            document.getElementById('unitPressHpa')?.classList.toggle('active-unit', press === 'hpa');
            document.getElementById('unitPressInhg')?.classList.toggle('active-unit',press === 'inhg');
            document.getElementById('cardStyleRaw')?.classList.toggle('active-unit',      card === 'raw');
            document.getElementById('cardStyleDetailed')?.classList.toggle('active-unit', card === 'detailed');
        }
    
        // ================================================================
        // 7. INITIALIZATION
        // ================================================================
        function toggleLegend(show) {
            const el = document.getElementById('legendModal');
            if (show) el.classList.add('active'); else el.classList.remove('active');
        }

        async function initApp() {
            const ready = await Storage.init();
            if (!ready) return;

            const mode = localStorage.getItem('efb_storage_mode');
            if (mode === 'cloud' && navigator.onLine) await cloudRestoreAll();

            renderStorageModeUI();
            updateApiQuickStats();
            initWorldClock();
            checkNightModeSaved();
            renderFavoritesSettings();
            renderHistory();
            await checkMultiDashboardEnabled();
            await checkNoGoBannerEnabled();
            loadUnitPreferences();
            if (typeof loadAeroSearchModeSetting === 'function') loadAeroSearchModeSetting();


            const savedDefault = await Storage.get('efb_default_station');
            const inputField   = document.getElementById('defaultIcaoInput');
            const dashEnabled  = await Storage.get('efb_multi_dashboard_enabled', false);
    
            // ── Apply correct starting tab BEFORE loading data ──
            // This prevents any flash of the METAR tab when dashboard mode is on
            if (dashEnabled) {
                setTab('weather');
                switchWeatherPane('metar');
            }
    
            if (savedDefault) {
                inputField.value = savedDefault;
                document.getElementById('icao').value = savedDefault;
                loadPreferredRunwaySettings(savedDefault); 
                loadData();   // data loads into whichever tab is already showing
                } else {
                    document.getElementById('icao').value = '';
                    // Show the full-tab overlay instead of inline welcome
                    if (!sessionStorage.getItem('welcome_dismissed')) {
                        setTimeout(showWelcomeOverlay, 350); // slight delay so tabs render first
                    }
                    showOnboarding();
                }
                

            const savedXW   = await Storage.get('efb_min_xw');
            const savedCeil = await Storage.get('efb_min_ceil');
            if (savedXW)   document.getElementById('minXW').value   = savedXW;
            if (savedCeil) document.getElementById('minCeil').value = savedCeil;

            setInterval(updateClock, 1000);
            setTimeout(() => { checkWhatsNew(); renderHelpWhatsNew(); }, 500);

            // Auto-refresh METAR every 10 minutes if an airport is loaded
            setInterval(() => {
                const icao = document.getElementById('icao').value.trim();
                if (icao) {
                    console.log('[Auto-refresh] Refreshing METAR for', icao);
                    loadData();
                }
            }, 600000);
            initHelpAccordion();
        }

        // ================================================================
        // 8. BACKEND FETCH LAYER
        // ================================================================
        async function secureFetch(endpoint) {
            const cacheKey = `cache_${endpoint}`;
            const cached   = localStorage.getItem(cacheKey);
            const cachedObj = cached ? (() => { try { return JSON.parse(cached); } catch(e) { return null; } })() : null;

            // Fresh cache (< 10 min) → return immediately
            if (cachedObj && Date.now() - cachedObj.ts < 300000) {
                return cachedObj.data;
            }

            // Build request headers — always send access code if stored
            const headers = {};
            const accessCode = localStorage.getItem('efb_access_code');
            if (accessCode) headers['x-access-code'] = accessCode;

            try {
                const res = await fetch(endpoint, { headers });

                // Access revoked — clear code and show gate
                if (res.status === 403) {
                    localStorage.removeItem('efb_access_code');
                    showAccessGate('🔒 Access revoked. Enter a new access code.');
                    throw new Error('Access revoked');
                }

                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                const data = await res.json();
                localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
                hideOfflineBanner();
                return data;
            } catch (err) {
                if (err.message === 'Access revoked') throw err;
                // Network failure — fall back to stale cache if available
                if (cachedObj) {
                    const ageMin = Math.round((Date.now() - cachedObj.ts) / 60000);
                    console.warn(`[Offline] Serving stale cache for ${endpoint} (${ageMin}m old)`);
                    showOfflineBanner(cachedObj.ts);
                    if (typeof showSourceFooters === 'function') showSourceFooters();
                    return cachedObj.data;
                }
                throw err;
            }
        }

        // ================================================================
        // 8b. ACCESS GATE
        // ================================================================
        function getStoredAccessCode() {
            return localStorage.getItem('efb_access_code') || null;
        }

        async function checkAccessGate() {
            const code = getStoredAccessCode();

            // No code stored — show gate immediately
            if (!code) {
                showAccessGate();
                return false;
            }

            // Validate stored code silently
            try {
                const res  = await fetch('/api/access', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ action: 'validate', code })
                });
                const data = await res.json();
                if (data.valid) {
                    console.log(`[Access] Welcome, ${data.name}!`);
                    return true;
                }
            } catch(e) {
                // Network error — allow app to load (offline tolerance)
                console.warn('[Access] Validation failed (network), allowing offline load');
                return true;
            }

            // Code was invalid / revoked
            localStorage.removeItem('efb_access_code');
            showAccessGate('🔒 Your access code was revoked. Contact the admin for a new one.');
            return false;
        }

        function showAccessGate(errorMsg) {
            const gate  = document.getElementById('accessGate');
            const input = document.getElementById('accessCodeInput');
            const msg   = document.getElementById('accessGateMsg');
            if (!gate) return;
            gate.style.display = 'flex';
            if (errorMsg && msg) { msg.innerText = errorMsg; msg.style.color = 'var(--danger)'; }
            if (input) { input.value = ''; setTimeout(() => input.focus(), 300); }
        }

        function hideAccessGate() {
            const gate = document.getElementById('accessGate');
            if (gate) gate.style.display = 'none';
        }

        async function submitAccessCode() {
            const input  = document.getElementById('accessCodeInput');
            const msg    = document.getElementById('accessGateMsg');
            const btn    = document.getElementById('accessGateBtn');
            const code   = (input?.value || '').trim().toUpperCase();

            if (code.length < 4) {
                msg.innerText   = '⚠️ Access code must be at least 4 characters';
                msg.style.color = 'var(--warn)';
                return;
            }

            msg.innerText   = '🔍 Verifying...';
            msg.style.color = '#8e8e93';
            if (btn) { btn.disabled = true; btn.innerText = 'Checking...'; }

            try {
                const res  = await fetch('/api/access', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ action: 'validate', code })
                });
                const data = await res.json();

                if (data.valid) {
                    msg.innerText   = `✅ Welcome, ${data.name}!`;
                    msg.style.color = 'var(--success)';
                    localStorage.setItem('efb_access_code', code);
                    setTimeout(() => {
                        hideAccessGate();
                        initApp();
                    }, 700);
                } else {
                    msg.innerText   = '❌ Invalid access code. Contact admin for access.';
                    msg.style.color = 'var(--danger)';
                    if (btn) { btn.disabled = false; btn.innerText = 'Enter →'; }
                    input.value = '';
                    input.focus();
                }
            } catch(e) {
                msg.innerText   = '⚠️ Could not connect. Check your internet.';
                msg.style.color = 'var(--warn)';
                if (btn) { btn.disabled = false; btn.innerText = 'Enter →'; }
            }
        }

        // ================================================================
        // 9. CORE DATA LOGIC
        // ================================================================
        function quickLoad(code) { document.getElementById('icao').value = code; loadData(); }

        async function saveDefaultStation() {
            const input = document.getElementById('defaultIcaoInput');
            const val   = input.value.trim().toUpperCase();
            const msg   = document.getElementById('saveMsg');
            if (val.length >= 3) {
                await Storage.set('efb_default_station', val);
                msg.innerText = "✅ Saved!"; msg.style.color = "var(--success)";
                showToast(`✅ Default airport set to ${val}`);
                dismissWelcomeOverlay();
                if (document.getElementById('icao').value === "") { document.getElementById('icao').value = val; loadData(); }
                // Load runway options for the new default airport
                loadPreferredRunwaySettings(val);
            } else { msg.innerText = "⚠️ Invalid ICAO"; msg.style.color = "var(--warn)"; }
            setTimeout(() => { msg.innerText = ""; }, 3000);
        }

        async function loadPreferredRunwaySettings(icao) {
            if (!icao) return;
            const section  = document.getElementById('prefRunwaySection');
            const sel      = document.getElementById('prefRunwaySelect');
            const label    = document.getElementById('prefRunwayIcaoLabel');
            if (!section || !sel) return;
        
            if (label) label.innerText = icao;
        
            try {
                const data    = await secureFetch(`/api/weather?type=station&station=${icao}`);
                const runways = data?.runways || [];
        
                if (runways.length === 0) { section.classList.add('hidden'); return; }
        
                const savedPref = await Storage.get(`efb_pref_rwy_${icao}`) || '';
        
                sel.innerHTML = '<option value="">🔀 Auto — Best for wind</option>';
                runways.forEach(r => {
                    [r.ident1, r.ident2].forEach(ident => {
                        const opt = document.createElement('option');
                        opt.value   = ident;
                        opt.text    = `RWY ${ident}`;
                        opt.selected = (ident === savedPref);
                        sel.appendChild(opt);
                    });
                });
        
                section.classList.remove('hidden');
            } catch(e) {
                section.classList.add('hidden');
            }
        }
        
        async function savePreferredRunway() {
            const icao = document.getElementById('defaultIcaoInput').value.trim().toUpperCase();
            const sel  = document.getElementById('prefRunwaySelect');
            if (!icao || !sel) return;
            const val = sel.value;
            await Storage.set(`efb_pref_rwy_${icao}`, val);
            showToast(val ? `✅ RWY ${val} set as preferred for ${icao}` : `✅ ${icao} will auto-select best runway`);
        
            // If this airport is currently loaded, instantly apply to METAR tab
            const currentIcao = document.getElementById('icao').value.trim().toUpperCase();
            if (currentIcao === icao && stationData) {
                // Apply to both rwySelect (main) and rwySelect2 (weather tab)
                ['rwySelect', 'rwySelect2'].forEach(id => {
                    const rwyEl = document.getElementById(id);
                    if (!rwyEl) return;
                    if (val && rwyEl.querySelector(`option[value="${val}"]`)) {
                        rwyEl.value = val;
                    } else if (!val) {
                        // Auto — recalculate best runway for wind
                        const mv      = stationData.magnetic_variation || 0;
                        const safeDir = (currentWind.dir === 'VRB') ? 0 : currentWind.dir;
                        const windMag = safeDir - mv;
                        let bestRwy = null, maxHW = -999;
                        (stationData.runways || []).forEach(r => {
                            const h1  = parseInt(r.ident1.replace(/\D/g, '')) * 10;
                            const hw1 = Math.cos((windMag - h1) * (Math.PI / 180)) * currentWind.spd;
                            if (hw1 > maxHW) { maxHW = hw1; bestRwy = r.ident1; }
                        });
                        if (bestRwy && rwyEl.querySelector(`option[value="${bestRwy}"]`)) {
                            rwyEl.value = bestRwy;
                        }
                    }
                });
                // Redraw wind rose and runway components with new selection
                drawWindRose();
                renderRunwaysComplex();
                checkMins();
            }
        }
    
        async function resetApp() {
            const mode = localStorage.getItem('efb_storage_mode');
            let message = "⚠️ Factory Reset App?\n\nThis will:\n• Clear all local settings\n• Remove saved airports & preferences\n• Return to the initial setup screen\n";
            if (mode === 'cloud') {
                message += "\n☁️ Your Cloud Backup is NOT deleted.\nYou can restore it with your Backup Code on the next setup screen.";
            } else {
                message += "\nThis cannot be undone.";
            }
            if (!confirm(message)) return;
        
            // 1. Clear localStorage first
            localStorage.clear();
        
            // 2. Close open IndexedDB connection BEFORE deleting — otherwise delete is blocked
            if (EFB_DB.db) {
                EFB_DB.db.close();
                EFB_DB.db = null;
            }
        
            // 3. Delete IndexedDB — handle blocked event so it doesn't silently fail
            await new Promise((resolve) => {
                const req = indexedDB.deleteDatabase('efb_storage_v1');
                req.onsuccess  = () => { console.log('[Reset] IndexedDB deleted ✅'); resolve(); };
                req.onerror    = () => { console.warn('[Reset] IndexedDB delete error');   resolve(); };
                req.onblocked  = () => { console.warn('[Reset] IndexedDB delete blocked'); resolve(); };
            });
        
            showToast('🗑️ App reset — returning to setup...');
            setTimeout(() => location.reload(), 800);
        }

        function renderHistory() {
            const container = document.getElementById('recentHistoryRow');
            container.innerHTML = '';
            const favs    = getFavorites();
            const history = JSON.parse(localStorage.getItem('efb_history')) || [];
            favs.forEach(code => {
                const chip = document.createElement('div');
                chip.className = 'quick-chip fav';
                chip.innerText = '★ ' + code;
                chip.onclick = () => quickLoad(code);
                container.appendChild(chip);
            });
            history.filter(h => !favs.includes(h)).slice(0, 6).forEach(code => {
                const chip = document.createElement('div');
                chip.className = 'quick-chip';
                chip.innerText = code;
                chip.onclick = () => quickLoad(code);
                container.appendChild(chip);
            });
        }

        function addToHistory(icao) {
            let history = JSON.parse(localStorage.getItem('efb_history')) || [];
            history = history.filter(item => item !== icao);
            history.unshift(icao);
            if (history.length > 5) history.pop();
            localStorage.setItem('efb_history', JSON.stringify(history));
            renderHistory();
        }

        // ================================================================
        // 10. FAVORITES
        // ================================================================
        function getFavorites() {
            const local = localStorage.getItem('efb_favorites');
            try { return local ? JSON.parse(local) : []; } catch(e) { return []; }
        }

        async function addFavorite() {
            const input = document.getElementById('favInput');
            const code  = input.value.trim().toUpperCase();
            if (code.length < 3) return;
            let favs = getFavorites();
            if (!favs.includes(code)) {
                favs.push(code);
                await Storage.set('efb_favorites', favs);
                renderFavoritesSettings(); renderHistory();
                showToast(`✅ ${code} added to favorites`);
            }
            input.value = '';
        }

        async function removeFavorite(code) {
            let favs = getFavorites().filter(f => f !== code);
            await Storage.set('efb_favorites', favs);
            renderFavoritesSettings(); renderHistory();
            showToast(`🗑️ ${code} removed`);
        }

        function renderFavoritesSettings() {
            const list = document.getElementById('favSettingsList');
            const favs = getFavorites();
            list.innerHTML = '';
            if (favs.length === 0) {
                list.innerHTML = '<span style="color:var(--sub-text);font-size:12px;font-style:italic;">No favorites added.</span>';
                return;
            }
            favs.forEach(code => {
                const chip = document.createElement('div');
                chip.className = 'quick-chip fav';
                chip.innerHTML = `${code} <span class="chip-del" onclick="removeFavorite('${code}')">✕</span>`;
                list.appendChild(chip);
            });
        }

        // ================================================================
        // 11. GPS LOCATE
        // ================================================================
        function locateUser() {
            const btn = document.querySelector('.search-box button[onclick="locateUser()"]')
                     || document.querySelector('.search-box button');
            btn.innerHTML = '⏳';

            if (!navigator.geolocation) {
                showToast('⚠️ Geolocation not supported on this device');
                btn.innerHTML = '📍';
                return;
            }

            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude: lat, longitude: lon } = pos.coords;
                try {
                    // Search up to 150nm radius
                    const data = await secureFetch(
                        `/api/weather?type=near&station=${lat},${lon}&distance=150`
                    );

                    if (!data || data.length === 0) {
                        showToast('⚠️ No aviation weather stations found within 150nm');
                        return;
                    }

                    const nearest = data[0];
                    const icao    = nearest.station.icao;
                    const nm      = Math.round(nearest.nautical_miles);
                    const name    = nearest.station.name || nearest.station.city || icao;

                    document.getElementById('icao').value = icao;
                    loadData();

                    // Friendly toast with airport info and distance
                    showToast(`📍 Nearest: ${icao} — ${name} · ${nm}nm away`);

                    // If there are more results, log them quietly for debugging
                    if (data.length > 1) {
                        console.log(
                            `[GPS Locate] Found ${data.length} stations within 150nm:`,
                            data.slice(0, 5).map(d =>
                                `${d.station.icao} (${Math.round(d.nautical_miles)}nm)`
                            ).join(', ')
                        );
                    }

                } catch(e) {
                    console.error('GPS locate error:', e);
                    showToast('❌ Error searching for nearby stations — check connection');
                } finally {
                    btn.innerHTML = '📍';
                }

            }, (err) => {
                const msg = err.code === 1
                    ? '🔒 Location permission denied — enable in browser settings'
                    : '❌ GPS unavailable or timed out';
                showToast(msg);
                btn.innerHTML = '📍';
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000   // accept a cached position up to 60s old
            });
        }

        // ================================================================
        // 11b. LOADING SKELETONS
        // ================================================================
        function showLoadingSkeletons() {
            // Mirror IDs for weather tab (suffix '2')
            const pairs = [
                ['rawMetar', 'rawMetar2'],
                ['skyLayersContainer', 'skyLayersContainer2'],
            ];
        
            // Raw METAR skeleton
            ['rawMetar', 'rawMetar2'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = `<div class="skeleton" style="height:80px;"></div>`;
            });
        
            // Sky section skeleton
            ['skyLayersContainer', 'skyLayersContainer2'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = `
                    <div class="skeleton-text" style="width:70%;"></div>
                    <div class="skeleton-text" style="width:85%;margin-top:8px;"></div>
                    <div class="skeleton-text" style="width:60%;margin-top:8px;"></div>`;
            });
        
            // Flight rule bars skeleton
            ['', '2'].forEach(sfx => {
                const lc = document.getElementById('labelCeilVal' + sfx);
                const lv = document.getElementById('labelVisVal'  + sfx);
                const gc = document.getElementById('gaugeCeil'    + sfx);
                const gv = document.getElementById('gaugeVis'     + sfx);
                const fm = document.getElementById('frMessage'    + sfx);
                if (lc) lc.innerText = '--';
                if (lv) lv.innerText = '--';
                if (gc) gc.style.width = '0%';
                if (gv) gv.style.width = '0%';
                if (fm) fm.innerText = 'Analyzing conditions...';
            });
        
            // Value cards skeleton
            ['mWind','mVis','mCeil','mAlt','mTempC'].forEach(base => {
                [base, base + '2'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.innerHTML = '<div class="skeleton" style="height:18px;width:70%;"></div>';
                });
            });
        
            // TAF skeleton
            ['rawTaf', 'rawTaf2'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = 'Loading forecast...';
            });
            ['tafBar', 'tafBar2'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = `
                    <div class="skeleton" style="height:40px;flex:1;margin-right:4px;"></div>
                    <div class="skeleton" style="height:40px;flex:1;margin-right:4px;"></div>
                    <div class="skeleton" style="height:40px;flex:1;"></div>`;
            });
        
            // NOTAM skeleton
            ['notamList', 'notamList2'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = `
                    <div class="skeleton-card">
                        <div class="skeleton-text" style="width:90%;"></div>
                        <div class="skeleton-text" style="width:75%;"></div>
                    </div>`;
            });
        }
    
// ================================================================
        // 12. MAIN DATA LOADER
        // ================================================================
        async function loadData(force = false) {
            const icaoVal = document.getElementById('icao').value;
            if (!icaoVal) return;
            
            if (force) {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('cache_')) localStorage.removeItem(key);
                });
                // Also clear FAA NOTAM cache which uses a different key prefix
                const icaoVal = document.getElementById('icao').value.trim().toUpperCase();
                if (icaoVal) localStorage.removeItem(`cache_faa_notam_${icaoVal}`);
                console.log('[Force Refresh] All caches cleared');
            }

            // Reset meteogram interval so new airport gets a fresh timer
            if (window._meteoNowInterval) {
                clearInterval(window._meteoNowInterval);
                window._meteoNowInterval = null;
            }
            
            const icao = icaoVal.toUpperCase();
            addToHistory(icao);
            localStorage.setItem('efb_last_load_ts', Date.now());
            document.getElementById('icao').blur();
            dismissWelcomeOverlay(); 
            document.getElementById('linkSkyVector').href = `https://skyvector.com/airport/${icao}`;
            updateHeaderCat('Loading', '');
            
            // Show skeletons immediately for instant feedback
            showLoadingSkeletons();
            document.getElementById('nearList').innerHTML = '<span style="color:#555;font-size:12px;">Scanning…</span>';

            try {
                // ── PHASE 1: Station data (fastest, ~100ms) ──
                stationData = await secureFetch(`/api/weather?type=station&station=${icao}`);
                if (stationData._meta) console.log(`%c[AVWX] Station - Key #${stationData._meta.key_used}`, 'color:#0a84ff;font-weight:bold;');
                
                renderInfo(stationData);
                updateAudioSection(icao);
                
                // ── PHASE 2: Start slow tasks in background (don't block) ──
                if (stationData?.latitude != null && stationData?.longitude != null) {
                    findNearbyStations(stationData.latitude, stationData.longitude);
                    fetchMeteogram(stationData.latitude, stationData.longitude);
                } else {
                    document.getElementById('nearList').innerHTML =
                        '<span style="color:#555;font-size:12px;">No coordinates for this station.</span>';
                }
                
                // ── PHASE 3: Weather data in parallel - render each as it completes ──
                const weatherPromises = Promise.allSettled([
                    secureFetch(`/api/weather?type=metar&station=${icao}`),
                    secureFetch(`/api/weather?type=taf&station=${icao}`),
                    fetchNotamsFAA(icao)
                ]);
                
                // Process results as they arrive
                weatherPromises.then(([metarRes, tafRes, notamRes]) => {
                    try {
                    // METAR
                    if (metarRes.status === 'fulfilled' && !metarRes.value.error) {
                        const m = metarRes.value;
                        if (m._meta) console.log(`%c[AVWX] METAR - Key #${m._meta.key_used}`, 'color:#0a84ff;font-weight:bold;');
                        
                        lastMetarObj = m;
                        let dirVal = m.wind_direction?.value;
                        if (m.wind_direction?.repr === 'VRB' || (dirVal === null && m.wind_speed?.value > 0)) dirVal = 'VRB';
                        currentWind = { dir: dirVal === null ? 0 : dirVal, spd: m.wind_speed?.value || 0 };
                        let altVal = m.altimeter?.value || 1013;
                        let altUnit = altVal < 200 ? 'inHg' : 'hPa';
                        currentMetar = { temp: m.temperature?.value || 15, alt: altVal, altUnit };
                        
                        renderMetar(m);
                        renderSkyVisuals(m);
                        renderFlightRuleBar(m);
                        setupRunwaySelect();
                        
                        // Store for trend analysis
                        storeMetarForTrend(icao, m);
                        // ── Sync dashboard card if this airport is tracked ──
                        if (multiAirports.includes(icao)) {
                            fetchMultiAirportData(icao);
                        }
                        
                        const liveBtn = document.getElementById('btnFetchLive');
                        if (icao === 'KMHR') liveBtn.classList.remove('hidden'); 
                        else liveBtn.classList.add('hidden');
                    } else {
                        updateHeaderCat('N/A', 'cat-ifr');
                        document.getElementById('rawMetar').innerHTML = `
                            <div style="text-align:center;padding:20px 10px;">
                                <div style="color:var(--danger);font-weight:800;margin-bottom:15px;">METAR UNAVAILABLE</div>
                            </div>`;
                    }
                    
                    // TAF
                    if (tafRes.status === 'fulfilled') {
                        const tafData = tafRes.value;
                        if (tafData._meta) console.log(`%c[AVWX] TAF - Key #${tafData._meta.key_used}`, 'color:#0a84ff;font-weight:bold;');
                        renderTaf(tafData);
                    } else {
                        document.getElementById('rawTaf').innerText = 'No TAF available for this station.';
                    }
                    
                    // NOTAMs
                    if (notamRes.status === 'fulfilled') {
                        renderNotams(notamRes.value);
                    } else {
                        document.getElementById('notamList').innerHTML = 
                            '<div style="color:#555;font-style:italic;padding:8px;">No NOTAMs available.</div>';
                    }
                    showSourceFooters();   
                    updateUSAirportLinks(icao);
                    mirrorToWeatherTab();
                    } catch(renderErr) {
                        console.error('[loadData] Render error:', renderErr);
                        showToast('⚠️ Data loaded but render failed — check console');
                    }
                });;

            } catch(e) {
                console.error('[loadData] Error:', e);
                updateHeaderCat('N/A', 'cat-ifr');
                const ic = document.getElementById('icao').value.toUpperCase();
                const isOffline = !navigator.onLine || (e?.message?.toLowerCase().includes('fetch') || e?.message?.toLowerCase().includes('network'));

                document.getElementById('rawMetar').innerHTML = isOffline ? `
                    <div style="text-align:center;padding:24px 16px;">
                        <div style="font-size:32px;margin-bottom:12px;">📡</div>
                        <div style="color:var(--danger);font-weight:800;margin-bottom:8px;">NO NETWORK</div>
                        <div style="color:#aaa;font-size:12px;line-height:1.7;margin-bottom:16px;">
                            Weather data requires an internet connection.<br>
                            Open the <b style="color:#fff;">Aviation Tools</b> tab — all calculators work offline.
                        </div>
                    </div>` : `
                    <div style="text-align:center;padding:20px 10px;">
                        <div style="color:var(--danger);font-weight:800;margin-bottom:15px;">STATION DATA UNAVAILABLE</div>
                        <a href="https://metar-taf.com/${ic}" target="_blank" class="atc-btn"
                           style="justify-content:center;background:var(--accent);border:none;color:#fff;">
                            <span>View on Metar-Taf.com ↗</span>
                        </a>
                    </div>`;

                if (isOffline && window.__efbOffline) window.__efbOffline.showBanner(null);
            }
        }

        // ================================================================
        // 13. NOTAMs
        // ================================================================
        function renderNotams(rawData) {
            const container = document.getElementById('notamList');

            // Handle both FAA format (array of objects) and legacy format
            let notams = [];
            if (Array.isArray(rawData)) {
                if (rawData.length === 0) { container.innerHTML = "No NOTAMs Found"; return; }

                // Detect FAA format: objects have a "text" or "traditional" string field
                if (rawData[0]?.text || rawData[0]?.traditional) {
                    // FAA aviationweather.gov format
                    notams = rawData.map(n => ({
                        raw:        n.traditional || n.text || '',
                        number:     n.notamNumber || '',
                        start:      n.startDate   || '',
                        end:        n.endDate      || '',
                        location:   n.icaoLocation || ''
                    }));
                } else {
                    // Legacy AVWX format: array of { raw, start_time, ... }
                    notams = rawData.map(n => ({
                        raw:   n.raw || '',
                        number:'',
                        start: n.start_time?.dt || '',
                        end:   '',
                        location: ''
                    }));
                }
            } else {
                container.innerHTML = "No NOTAMs Found";
                return;
            }

            // Classify
            const critical = [], warning = [], info = [];
            notams.forEach(n => {
                const raw = n.raw.toUpperCase();
                if (/(CLSD|CLOSED|U\/S|UNSERVICEABLE|FAIL|OTS|OUT OF SERVICE)/.test(raw))
                    critical.push(n);
                else if (/(OBST|OBSTACLE|WORK|WIP|TRIGGER|SNOW|ICE|DANGER|HAZARD|RESTRICTED|CRANE|LASER)/.test(raw))
                    warning.push(n);
                else
                    info.push(n);
            });

            const formatDate = (iso) => {
                if (!iso) return '';
                try {
                    const d = new Date(iso);
                    return `${d.getUTCDate().toString().padStart(2,'0')}/${(d.getUTCMonth()+1).toString().padStart(2,'0')} ${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}Z`;
                } catch(e) { return iso; }
            };

            const renderGroup = (list, title, color) => {
                if (list.length === 0) return '';
                return `
                    <div style="color:${color};font-weight:800;margin:14px 0 4px 0;font-size:11px;text-transform:uppercase;">
                        ${title} (${list.length})
                    </div>
                    ${list.map(n => `
                        <div style="margin-bottom:8px;border-left:3px solid ${color};background:rgba(255,255,255,0.03);border-radius:4px;padding:7px 8px;">
                            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                                <span style="color:${color};font-size:10px;font-weight:800;">${n.number || ''}</span>
                                <span style="color:#555;font-size:9px;">${formatDate(n.start)}${n.end ? ' → ' + formatDate(n.end) : ''}</span>
                            </div>
                            <div style="font-size:11px;font-family:'SF Mono',monospace;line-height:1.5;color:#ccc;white-space:pre-wrap;word-break:break-word;">
                                ${formatNotamText(n.raw)}
                            </div>
                        </div>`).join('')}`;
            };

            const html = renderGroup(critical, '⛔ CRITICAL', '#ff453a')
                       + renderGroup(warning,  '⚠️ CAUTION',  '#ff9f0a')
                       + renderGroup(info,     'ℹ️ INFO',      '#8e8e93');

            container.innerHTML = html ||
                '<div style="color:#555;font-style:italic;padding:8px;">No active NOTAMs.</div>';
        }

        // ================================================================
        // 13b. FAA NOTAM FETCH (aviationweather.gov — free, no key)
        // ================================================================
        async function fetchNotamsFAA(icao) {
            const url = `https://aviationweather.gov/api/data/notam?icaos=${icao}&format=json`;
            const cacheKey = `cache_faa_notam_${icao}`;

            // Check cache first (10 min)
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const c = JSON.parse(cached);
                if (Date.now() - c.ts < 600000) return c.data;
            }

            const res  = await fetch(url);
            if (!res.ok) throw new Error(`FAA NOTAM API: ${res.status}`);
            const data = await res.json();
            localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
            return data;
        }
    
        // ================================================================
        // 14. AUDIO SECTION
        // ================================================================
        function updateAudioSection(icao) {
            const container   = document.getElementById('audioPlayerTarget');
            const label       = document.getElementById('audioLabel');
            const liveAtcBtn = document.getElementById('btnLiveAtc');
            if (liveAtcBtn) {
                liveAtcBtn.onclick = () => showLiveAtcChoice(icao);
                liveAtcBtn.querySelector('span').innerText = `📡 LiveATC (${icao})`;
            }

            // Update Metar-Taf link with current airport
            const metarTafBtn = document.getElementById('btnMetarTaf');
            if (metarTafBtn) {
                metarTafBtn.onclick = () => openExternal(`https://metar-taf.com/${icao}`);
                metarTafBtn.querySelector('span').innerText = `☁️ Metar-Taf.com (${icao})`;
            }

            // Stream configs: [ICAO, labelText, streams[]]
            const streamConfigs = {
                RCTP: { label: "RCTP LIVE STREAMS (TWATC)", streams: [
                    { type: "ATIS",              src: "https://stream.twatc.net/RCTP_ATIS",     color: "var(--accent)" },
                    { type: "RCTP Airport",      src: "https://stream.twatc.net/RCTP_Scan2",    color: "var(--success)" },
                    { type: "Area Control/Approach", src: "https://stream.twatc.net/RCAA_Scan",     color: "var(--success)" },
                    { type: "Radar Control",     src: "https://stream.twatc.net/RCTP_App_Scan", color: "var(--ifr)" },
                    { type: "Strait",            src: "https://stream.twatc.net/RCAA",          color: "var(--mvfr)" }
                ]},
                RCSS: { label: "RCSS LIVE STREAMS", streams: [
                    { type: "ATIS",              src: "https://stream.twatc.net/RCSS_ATIS",     color: "var(--accent)" },
                    { type: "Approach/Ground/Tower/Clearance", src: "https://stream.twatc.net/RCSS_Scan", color: "var(--success)" },
                    { type: "RCSS Airport",      src: "https://stream.twatc.net/RCSS_Scan2",    color: "var(--success)" }
                ]},
                RCKH: { label: "RCKH LIVE STREAMS", streams: [
                    { type: "ATIS",        src: "https://stream.twatc.net/RCKH_ATIS",  color: "var(--accent)" },
                    { type: "ATC SCANNER", src: "https://stream.twatc.net/RCKH_Scan2", color: "var(--success)" }
                ]},
                RCMQ: { label: "RCMQ LIVE STREAMS", streams: [
                    { type: "ATIS", src: "https://stream.twatc.net/RCMQ_ATIS", color: "var(--accent)" }
                ]},
                RCBS: { label: "RCBS LIVE STREAMS", streams: [
                    { type: "ATIS", src: "https://stream.twatc.net/RCBS_ATIS", color: "var(--accent)" }
                ]},
                RCFN: { label: "RCFN LIVE STREAMS", streams: [
                    { type: "ATIS", src: "https://stream.twatc.net/RCFN_ATIS", color: "var(--accent)" }
                ]}
                
            };

            const cfg = streamConfigs[icao];
            if (cfg) {
                label.innerText = cfg.label;
                container.innerHTML = cfg.streams.map(s => `
                    <div style="margin-bottom:12px;">
                        <div class="m-label" style="color:${s.color};">${s.type}</div>
                        <audio controls 
                               style="width:100%;height:32px;border-radius:16px;"
                               onerror="this.style.display='none';
                                        this.nextElementSibling.style.display='flex';">
                            <source src="${s.src}" type="audio/mpeg">
                        </audio>
                        <div style="display:none;font-size:11px;color:var(--warn);
                                    padding:8px 10px;background:rgba(255,159,10,0.08);
                                    border-radius:8px;border:1px solid rgba(255,159,10,0.25);
                                    align-items:center;justify-content:space-between;gap:8px;">
                            <span>⚠️ Feed currently offline</span>
                            <span style="color:var(--accent);cursor:pointer;font-weight:700;
                                         white-space:nowrap;"
                                  onclick="openExternal('https://www.liveatc.net/search/?icao=${icao}')">
                                Try LiveATC ↗
                            </span>
                        </div>
                    </div>`).join('') +
                    `<div style="font-size:10px;color:#555;margin-top:8px;text-align:right;">Source: TWATC.net & LiveATC</div>`;
            } else {
                label.innerText = "AUDIO STREAMS";
                container.innerHTML = `<div style="color:var(--sub-text);font-size:13px;text-align:center;padding:10px 0;">No direct in-app stream available for ${icao}.<br><span style="font-size:11px;color:#555;">Use the LiveATC button below.</span></div>`;
            }
        }

        // ================================================================
        // LIVEATC CHOICE HANDLER
        // ================================================================
        let _liveAtcCurrentIcao = '';
        
        function showLiveAtcChoice(icao) {
            _liveAtcCurrentIcao = icao || '';
            const modal  = document.getElementById('liveAtcChoiceModal');
            const label  = document.getElementById('liveAtcChoiceIcao');
            if (label) label.innerText = icao ? `Airport: ${icao}` : '';
            modal.style.display = 'flex';
        }
        
        function closeLiveAtcChoice() {
            document.getElementById('liveAtcChoiceModal').style.display = 'none';
        }
        
        function openLiveAtcApp() {
            closeLiveAtcChoice();
            // App Store shows "Open" if installed, "Get" if not — no custom scheme needed
            window.location.href = 'https://apps.apple.com/app/id317809458';
        }
        
        function openLiveAtcBrowser() {
            closeLiveAtcChoice();
            openExternal(`https://www.liveatc.net/search/?icao=${_liveAtcCurrentIcao}`);
        }

    
        // ================================================================
        // 15. METEOGRAM
        // ================================================================
        async function fetchMeteogram(lat, lon) {
            const loader = document.getElementById('meteoLoading');
            loader.style.display = 'block'; loader.innerText = 'Loading...';
            meteoDataCache = null;
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,dewpoint_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,temperature_925hPa,windspeed_925hPa,winddirection_925hPa,temperature_850hPa,windspeed_850hPa,winddirection_850hPa,temperature_700hPa,windspeed_700hPa,winddirection_700hPa&wind_speed_unit=kn&forecast_days=1&timezone=auto`;
                const res  = await fetch(url);
                const data = await res.json();
                stationOffsetSec = data.utc_offset_seconds || 0;
                updateSunDisplay();
                if (data.hourly) {
                    meteoDataCache = data.hourly;
                    loader.style.display = 'none';
                    const loader2 = document.getElementById('meteoLoading2');
                    if (loader2) loader2.style.display = 'none';
                    setTimeout(() => {
                        drawMeteogram(meteoDataCache);
                        drawMeteogram2(meteoDataCache);
                    }, 50);
                    const now = new Date();
                    const idx = now.getUTCHours();
                    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
                    const fmtW = (d, s) => `${d}° / ${Math.round(s)}kt`;
                    const fmtT = t => `${Math.round(t)}°C`;
                    setEl('wind3k',  fmtW(data.hourly.winddirection_925hPa[idx], data.hourly.windspeed_925hPa[idx]));
                    setEl('temp3k',  fmtT(data.hourly.temperature_925hPa[idx]));
                    setEl('wind5k',  fmtW(data.hourly.winddirection_850hPa[idx], data.hourly.windspeed_850hPa[idx]));
                    setEl('temp5k',  fmtT(data.hourly.temperature_850hPa[idx]));
                    setEl('wind10k', fmtW(data.hourly.winddirection_700hPa[idx], data.hourly.windspeed_700hPa[idx]));
                    setEl('temp10k', fmtT(data.hourly.temperature_700hPa[idx]));
                }
            } catch(e) { console.error("Meteo Error:", e); loader.style.display = 'block'; loader.innerText = "⚠️ Model Data Unavailable"; }
        }

        function drawMeteogram(h, canvasId = 'meteoCanvas') {
            const cvs = document.getElementById(canvasId);
            if (!cvs) return;
            const ctx = cvs.getContext('2d');
            const dpr  = window.devicePixelRatio || 1;
            const rect = cvs.getBoundingClientRect();
            // If canvas is inside a hidden pane rect will be 0 — fall back to container/window width
            const W = rect.width  || cvs.closest('.meteogram-container')?.clientWidth
                                   || window.innerWidth - 56
                                   || 360;
            const H = 150;
            cvs.width  = W * dpr; cvs.height = H * dpr;
            ctx.scale(dpr, dpr);
            const padding = { top: 40, bottom: 35, left: 15, right: 15 };
            ctx.clearRect(0, 0, W, H);
            const len = 24; const now = new Date();
            let minT = 100, maxT = -100;
            for (let i = 0; i < len; i++) { minT = Math.min(minT, h.temperature_2m[i], h.dewpoint_2m[i]); maxT = Math.max(maxT, h.temperature_2m[i], h.dewpoint_2m[i]); }
            minT -= 2; maxT += 2; const rangeT = maxT - minT;
            const getX = (i) => padding.left + (i / (len - 1)) * (W - padding.left - padding.right);
            const getY = (v) => H - padding.bottom - ((v - minT) / rangeT) * (H - padding.top - padding.bottom);
            const getWxIcon = (code) => {
                if (code <= 1) return '☀️'; if (code <= 3) return '⛅'; if (code <= 48) return '🌫️';
                if (code <= 57) return '🌧️'; if (code <= 67) return '☔'; if (code <= 77) return '❄️';
                if (code <= 82) return '⛈️'; if (code <= 99) return '⚡'; return '☁️';
            };
            // Vertical grid
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.beginPath();
            for (let i = 0; i < len; i += 3) { const x = getX(i); ctx.moveTo(x, padding.top); ctx.lineTo(x, H - padding.bottom); }
            ctx.stroke();
            // Fog shading
            const stepX = (W - padding.left - padding.right) / (len - 1);
            for (let i = 0; i < len - 1; i++) {
                const spread = h.temperature_2m[i] - h.dewpoint_2m[i];
                const x = getX(i);
                ctx.beginPath();
                ctx.moveTo(x, getY(h.temperature_2m[i])); ctx.lineTo(x + stepX, getY(h.temperature_2m[i+1]));
                ctx.lineTo(x + stepX, getY(h.dewpoint_2m[i+1])); ctx.lineTo(x, getY(h.dewpoint_2m[i]));
                ctx.closePath(); ctx.fillStyle = spread < 2.0 ? 'rgba(255,69,58,0.25)' : 'rgba(255,204,0,0.05)'; ctx.fill();
            }
            // NOW line
            const nowUTCHour = now.getUTCHours() + (now.getUTCMinutes() / 60);
            let nowIndex = 0;
            if (h.time) {
                let smallest = 999;
                h.time.slice(0, len).forEach((t, i) => {
                    const d = new Date(t + 'Z');
                    const diff = Math.abs(d.getUTCHours() + (d.getUTCMinutes() / 60) - nowUTCHour);
                    if (diff < smallest) { smallest = diff; nowIndex = i; }
                });
            }
            const nowX = getX(nowIndex);
            ctx.save();
            const gradient = ctx.createLinearGradient(nowX - 12, 0, nowX + 12, 0);
            gradient.addColorStop(0, 'rgba(10,132,255,0)'); gradient.addColorStop(0.5, 'rgba(10,132,255,0.20)'); gradient.addColorStop(1, 'rgba(10,132,255,0)');
            ctx.fillStyle = gradient; ctx.fillRect(nowX - 12, padding.top, 24, H - padding.top - padding.bottom);
            ctx.strokeStyle = 'rgba(10,132,255,0.7)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.moveTo(nowX, padding.top); ctx.lineTo(nowX, H - padding.bottom); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(10,132,255,0.2)'; ctx.fillRect(nowX - 14, padding.top - 18, 28, 14);
            ctx.fillStyle = '#0a84ff'; ctx.font = '700 9px "SF Mono",monospace'; ctx.textAlign = 'center'; ctx.fillText('NOW', nowX, padding.top - 7);
            ctx.restore();
            if (!window._meteoNowInterval) {
                window._meteoNowInterval = setInterval(() => {
                    if (meteoDataCache) {
                        drawMeteogram(meteoDataCache, 'meteoCanvas');
                        drawMeteogram(meteoDataCache, 'meteoCanvas2');
                    }
                }, 60000);
            }
            // Lines
            const drawLine = (arr, color, width) => {
                ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
                for (let i = 0; i < len; i++) { const x = getX(i), y = getY(arr[i]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
                ctx.stroke();
            };
            drawLine(h.dewpoint_2m, '#0a84ff', 2); drawLine(h.temperature_2m, '#ff453a', 2);
            // Data Points
            ctx.textAlign = 'center';
            for (let i = 0; i < len; i += 3) {
                const x = getX(i);
                ctx.font = '14px sans-serif'; ctx.fillStyle = '#fff';
                ctx.fillText(getWxIcon(h.weather_code ? h.weather_code[i] : 3), x, padding.top - 15);
                const windDir = h.wind_direction_10m[i];
                const windSpd = Math.round(h.wind_speed_10m[i]);
                const windGust = Math.round(h.wind_gusts_10m[i]);
                ctx.save(); ctx.translate(x, H - 25); ctx.rotate((windDir + 180) * Math.PI / 180);
                ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(-5, 5); ctx.lineTo(0, 2); ctx.lineTo(5, 5); ctx.closePath();
                ctx.fillStyle = '#0a84ff'; ctx.fill(); ctx.restore();
                ctx.font = '700 11px "SF Mono",monospace';
                let spdText = `${windSpd}`;
                if (windGust > windSpd + 5) { spdText += `G${windGust}`; ctx.fillStyle = '#ff9f0a'; } else { ctx.fillStyle = '#fff'; }
                ctx.fillText(spdText, x, H - 10);
                ctx.fillStyle = '#666'; ctx.font = '10px sans-serif'; ctx.fillText(`${i}z`, x, H);
            }
        }

        // ================================================================
        // 16a. METAR TREND ANALYSIS
        // ================================================================
        function drawMeteogram2(h) {
            drawMeteogram(h, 'meteoCanvas2');
        }
    
        function storeMetarForTrend(icao, metar) {
            try {
                const key = `metar_history_${icao}`;
                let history = JSON.parse(localStorage.getItem(key)) || [];
                
                // Store timestamp + key values
                const record = {
                    ts: Date.now(),
                    ceil: metar.ceiling?.value || 99999,
                    vis: metar.visibility?.value || 10,
                    windSpd: metar.wind_speed?.value || 0
                };
                
                history.unshift(record);
                
                // Keep last 24 hours only
                const dayAgo = Date.now() - 86400000;
                history = history.filter(h => h.ts > dayAgo).slice(0, 50);
                
                localStorage.setItem(key, JSON.stringify(history));
            } catch(e) {
                console.error('[Trend] Storage error:', e);
            }
        }

        function analyzeTrend(icao, param, currentValue) {
            try {
                const key = `metar_history_${icao}`;
                const history = JSON.parse(localStorage.getItem(key)) || [];
                
                if (history.length < 2) return null; // Not enough data
                
                // Find readings from ~1h and ~3h ago
                const now = Date.now();
                const oneHourAgo = history.find(h => now - h.ts >= 3300000 && now - h.ts <= 4200000); // 55-70min
                const threeHoursAgo = history.find(h => now - h.ts >= 10200000 && now - h.ts <= 11400000); // 170-190min
                
                const compareValue = oneHourAgo?.[param] || threeHoursAgo?.[param];
                if (!compareValue) return null;
                
                // Determine trend based on parameter type
                let improving = false;
                let threshold = 0;
                
                if (param === 'ceil') {
                    // Higher ceiling = better
                    threshold = 500; // 500ft change
                    improving = currentValue > compareValue + threshold;
                    const worsening = currentValue < compareValue - threshold;
                    if (improving) return 'improving';
                    if (worsening) return 'worsening';
                } else if (param === 'vis') {
                    // Higher visibility = better
                    threshold = 1; // 1 statute mile
                    improving = currentValue > compareValue + threshold;
                    const worsening = currentValue < compareValue - threshold;
                    if (improving) return 'improving';
                    if (worsening) return 'worsening';
                } else if (param === 'windSpd') {
                    // Lower wind = better
                    threshold = 5; // 5 knots
                    improving = currentValue < compareValue - threshold;
                    const worsening = currentValue > compareValue + threshold;
                    if (improving) return 'improving';
                    if (worsening) return 'worsening';
                }
                
                return 'steady';
                
            } catch(e) {
                console.error('[Trend] Analysis error:', e);
                return null;
            }
        }

        function getTrendBadge(trend) {
            if (!trend) return '';
            
            const icons = {
                improving: '↗',
                worsening: '↘',
                steady: '→'
            };
            
            const labels = {
                improving: 'Better',
                worsening: 'Worse',
                steady: 'Steady'
            };
            
            return `<span class="trend-badge trend-${trend}">${icons[trend]} ${labels[trend]}</span>`;
        }
    
        // ================================================================
        // 16b. METAR RENDERING
        // ================================================================
         function renderMetar(d) {
            const rawContainer = document.getElementById('rawMetar');
            const now = new Date(), metarTime = new Date(d.time.dt);
            const minAgo = Math.floor((now - metarTime) / 60000);
            rawContainer.innerHTML = formatRawMetar(d.raw);
            if (minAgo > 60) rawContainer.insertAdjacentHTML('beforeend', `<div style="margin-top:12px;padding:10px;background:rgba(255,69,58,0.1);border:1px solid var(--danger);border-radius:6px;text-align:center;"><div style="color:var(--danger);font-weight:800;font-size:12px;">⚠️ DATA OUTDATED (${minAgo}m old)</div></div>`);
            const rules = d.flight_rules;
            let css = 'cat-vfr';
            if (rules === 'MVFR') css = 'cat-mvfr'; if (rules === 'IFR') css = 'cat-ifr'; if (rules === 'LIFR') css = 'cat-lifr';
            updateHeaderCat(rules, css);
            
            // ── GET CURRENT ICAO FOR TREND ANALYSIS ──
            const icao = document.getElementById('icao').value.toUpperCase();
            
            // ── WIND with trend ──
            const windText = `${currentWind.dir.toString().padStart(3,'0')}° / ${currentWind.spd}kt`;
            const windTrend = analyzeTrend(icao, 'windSpd', currentWind.spd);
            document.getElementById('mWind').innerHTML = windText + getTrendBadge(windTrend);
            
            // ── VISIBILITY with trend ──
            const visText = d.visibility ? `${d.visibility.value} sm` : '--';
            const visTrend = analyzeTrend(icao, 'vis', d.visibility?.value || 10);
            document.getElementById('mVis').innerHTML = visText + getTrendBadge(visTrend);
            
            // ── CEILING with trend ──
            const c = d.clouds?.[0];
            const ceilText = c ? `${c.type} ${c.altitude.toString().padStart(3,'0')}` : "CLR";
            const ceilValue = c ? c.altitude * 100 : 99999; // Convert to feet AGL
            const ceilTrend = analyzeTrend(icao, 'ceil', ceilValue);
            document.getElementById('mCeil').innerHTML = ceilText + getTrendBadge(ceilTrend);
            
            // ── REST OF FUNCTION (unchanged) ──
            const alt = d.altimeter?.value;
            if (alt) {
                if (currentMetar.altUnit === 'hPa') { const inHg = (alt * 0.02953).toFixed(2); document.getElementById('mAlt').innerText = `Q${alt} / A${inHg}`; }
                else { const hPa = Math.round(alt * 33.8639); document.getElementById('mAlt').innerText = `Q${hPa} / A${alt.toFixed(2)}`; }
            }
            const t = d.temperature?.value, dew = d.dewpoint?.value;
            if (t != null) {
                document.getElementById('mTempC').innerText = `${t}°C / ${dew != null ? dew : '--'}°C`;
                document.getElementById('mTempF').innerText = `(${Math.round(t * 1.8 + 32)}°F)`;
                document.getElementById('mSpread').innerText = `Spread: ${(t - dew).toFixed(1)}°C`;
                
                // Calculate Relative Humidity using Magnus formula
                if (dew != null) {
                    const rh = Math.round(100 * Math.exp((17.625 * dew) / (243.04 + dew)) / Math.exp((17.625 * t) / (243.04 + t)));
                    document.getElementById('mHumidity').innerText = `RH: ${rh}%`;
                    
                    // Color code based on humidity level
                    const humidityEl = document.getElementById('mHumidity');
                    if (rh < 30) {
                        humidityEl.style.color = 'var(--warn)'; // Dry
                    } else if (rh > 80) {
                        humidityEl.style.color = 'var(--accent)'; // Very humid
                    } else {
                        humidityEl.style.color = 'var(--sub-text)'; // Normal
                    }
                } else {
                    document.getElementById('mHumidity').innerText = 'RH: --%';
                }
            }
            const ageEl = document.getElementById('mAge');
            ageEl.innerText = `${minAgo}m ago`;
            ageEl.style.color      = minAgo > 60 ? 'var(--danger)' : 'var(--sub-text)';
            ageEl.style.fontWeight = minAgo > 60 ? '700' : '400';

        }

        function renderSkyVisuals(m) {
            const container = document.getElementById('skyLayersContainer');
            container.innerHTML = '';
            if (!m.clouds || m.clouds.length === 0) { container.innerHTML = '<div class="sky-no-data">Sky Clear (SKC/CLR)</div>'; return; }
            const sorted = [...m.clouds].sort((a, b) => b.altitude - a.altitude);
            sorted.forEach(c => {
                const count = { FEW: 2, SCT: 4, BKN: 7, OVC: 8, VV: 8 }[c.type] || 0;
                let iconsHtml = '';
                for (let i = 0; i < count; i++) iconsHtml += `<svg class="sky-icon" viewBox="0 0 30 20"><path d="${CLOUD_ICON_PATH}"/></svg>`;
                const typeName = { FEW: 'Few', SCT: 'Scattered', BKN: 'Broken', OVC: 'Overcast', VV: 'Vert. Vis' }[c.type] || c.type;
                const layer = document.createElement('div'); layer.className = 'sky-layer';
                layer.innerHTML = `<div class="sky-icons-row">${iconsHtml}</div><div class="sky-layer-text">${typeName} ${c.altitude * 100}'</div>`;
                container.appendChild(layer);
            });
        }

        function renderFlightRuleBar(m) {
            let ceiling = 99999;
            const ceilLayer = m.clouds?.find(c => ['BKN','OVC','VV'].includes(c.type));
            if (ceilLayer) ceiling = ceilLayer.altitude * 100;
            let vis = m.visibility ? m.visibility.value : 10;

            const getStats = (val, type) => {
                let pct = 0, color = 'var(--success)';
                if (type === 'ceil') {
                    if (val < 500)  { pct = (val / 500) * 25; color = 'var(--lifr)'; }
                    else if (val < 1000) { pct = 25 + ((val - 500) / 500) * 25; color = 'var(--danger)'; }
                    else if (val < 3000) { pct = 50 + ((val - 1000) / 2000) * 25; color = 'var(--mvfr)'; }
                    else { pct = 75 + Math.min(1, (val - 3000) / 3000) * 25; }
                }
                if (type === 'vis') {
                    if (val < 1) { pct = (val / 1) * 25; color = 'var(--lifr)'; }
                    else if (val < 3) { pct = 25 + ((val - 1) / 2) * 25; color = 'var(--danger)'; }
                    else if (val < 5) { pct = 50 + ((val - 3) / 2) * 25; color = 'var(--mvfr)'; }
                    else { pct = 100; }
                }
                return { width: Math.max(5, pct) + '%', color };
            };

            const cStats = getStats(ceiling, 'ceil');
            const vStats = getStats(vis, 'vis');
            const ceilBar = document.getElementById('gaugeCeil'); ceilBar.style.width = cStats.width; ceilBar.style.backgroundColor = cStats.color;
            document.getElementById('labelCeilVal').innerText = ceiling === 99999 ? 'Unlimited' : `${ceiling} ft`;
            document.getElementById('labelCeilVal').style.color = cStats.color;
            const visBar  = document.getElementById('gaugeVis'); visBar.style.width  = vStats.width; visBar.style.backgroundColor = vStats.color;
            document.getElementById('labelVisVal').innerText = `${vis} sm`;
            document.getElementById('labelVisVal').style.color = vStats.color;
            const rule  = m.flight_rules;
            const msgEl = document.getElementById('frMessage');
            const msgs  = { VFR: ["Visual Flight Rules (Vis > 5sm & Ceil > 3000')", 'var(--success)'], MVFR: ["Marginal VFR (Ceil 1000-3000' or Vis 3-5sm)", 'var(--mvfr)'], IFR: ["Instrument Flight Rules (Ceil < 1000' or Vis < 3sm)", 'var(--danger)'], LIFR: ["Low IFR (Ceil < 500' or Vis < 1sm)", 'var(--lifr)'] };
            if (msgs[rule]) { msgEl.innerText = msgs[rule][0]; msgEl.style.color = msgs[rule][1]; }
        }

        // Calculate bearing from point A to point B
        function getBearing(lat1, lon1, lat2, lon2) {
            const φ1 = lat1 * Math.PI / 180;
            const φ2 = lat2 * Math.PI / 180;
            const Δλ = (lon2 - lon1) * Math.PI / 180;
            
            const y = Math.sin(Δλ) * Math.cos(φ2);
            const x = Math.cos(φ1) * Math.sin(φ2) -
                      Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
            
            let θ = Math.atan2(y, x);
            let bearing = (θ * 180 / Math.PI + 360) % 360;
            return Math.round(bearing);
        }
        
        // Convert bearing to cardinal direction
        function bearingToCardinal(bearing) {
            const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                          'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            const index = Math.round(bearing / 22.5) % 16;
            return dirs[index];
        }
    
        // Safe distance extractor — handles both AVWX and cached shapes
        function getNm(item) {
            if (item.nautical_miles != null) return item.nautical_miles;      // cached old shape
            if (item.distance?.value != null) return item.distance.value;     // AVWX live shape
            return 0;
        }


        let _nearbyModalData = null;

        async function findNearbyStations(lat, lon) {
            console.log(`[Nearby] 🔍 Called with lat=${lat}, lon=${lon}`);
        
            const list  = document.getElementById('nearList');
            const list2 = document.getElementById('nearList2');
        
            if (!list) {
                console.error('[Nearby] ❌ Element #nearList not found!');
                return;
            }
        
            const loadingHTML = '<span style="color:#555;font-size:12px;">Scanning…</span>';
            list.innerHTML  = loadingHTML;
            if (list2) list2.innerHTML = loadingHTML;
        
            try {
                const url = `/api/weather?type=near&station=${lat},${lon}&distance=150`;
                console.log(`[Nearby] 📡 Fetching: ${url}`);
        
                const data = await secureFetch(url);
                console.log('[Nearby] 📦 Raw API response:', data);
        
                // AVWX returns {0:{...}, 1:{...}, _meta:{...}} — convert to array
                let items;
                if (Array.isArray(data)) {
                    items = data;
                } else if (typeof data === 'object' && data !== null) {
                    items = Object.values(data).filter(item =>
                        item && typeof item === 'object' && !item.hasOwnProperty('key_used')
                    );
                } else {
                    items = [];
                }
        
                console.log(`[Nearby] 📊 Extracted ${items.length} items`);
        
                const currentIcao = document.getElementById('icao').value.toUpperCase();
        
                const others = items
                    .filter(item => {
                        const icao = item.station?.icao || item.icao || '';
                        return icao !== currentIcao;
                    })
                    .sort((a, b) => getNm(a) - getNm(b))
                    .slice(0, 5);
        
                console.log(`[Nearby] ✂️  After filter: ${others.length} stations`);
        
                // Clear both lists
                list.innerHTML  = '';
                if (list2) list2.innerHTML = '';
        
                if (others.length === 0) {
                    const emptyHTML = '<span style="color:#555;font-size:12px;">No stations found within 150nm.</span>';
                    list.innerHTML  = emptyHTML;
                    if (list2) list2.innerHTML = emptyHTML;
                    return;
                }
        
                others.forEach(item => {
                    const icao = item.station?.icao || item.icao || '????';
                    const nm   = Math.round(getNm(item));
        
                    // Bearing calculation
                    const stn = item.station || item;
                    let bearingStr = '';
                    if (lat != null && lon != null && stn.latitude != null && stn.longitude != null) {
                        const bearing  = getBearing(lat, lon, stn.latitude, stn.longitude);
                        const cardinal = bearingToCardinal(bearing);
                        bearingStr = ` · ${bearing}° (${cardinal})`;
                    }
        
                    const innerHTML = `
                        <span>✈</span>
                        <span>${icao}</span>
                        <span style="color:var(--sub-text);font-size:10px;">${nm}nm${bearingStr}</span>`;
        
                    // ── Primary list (METAR tab) ──
                    const btn = document.createElement('div');
                    btn.className = 'nearby-btn';
                    btn.innerHTML = innerHTML;
                    btn.onclick   = () => openNearbyModal(item);
                    list.appendChild(btn);
        
                    // ── Mirror list (Weather tab) — clone with LIVE onclick handler ──
                    if (list2) {
                        const btn2 = document.createElement('div');
                        btn2.className = 'nearby-btn';
                        btn2.innerHTML = innerHTML;
                        btn2.onclick   = () => openNearbyModal(item);   // same closure, not innerHTML copy
                        list2.appendChild(btn2);
                    }
                });
        
                console.log('[Nearby] ✅ Rendered successfully in both lists');
        
            } catch(e) {
                console.error('[Nearby] ❌ Error:', e);
                const errHTML = '<span style="color:#555;font-size:12px;">Failed to load nearby stations.</span>';
                list.innerHTML  = errHTML;
                if (list2) list2.innerHTML = errHTML;
            }
        }

        async function openNearbyModal(item) {
            const stn  = item.station || item;
            const icao = stn.icao || '????';
            const nm   = Math.round(getNm(item));
            _nearbyModalData = { station: stn, nm };

            // Populate static fields immediately
            document.getElementById('nearModalIcao').innerText  = icao;
            document.getElementById('nearModalName').innerText  = stn.name || stn.city || '--';
            document.getElementById('nearModalDist').innerText  = `${nm} nm`;
            document.getElementById('nearModalElev').innerText  = stn.elevation_ft ? `${stn.elevation_ft} ft` : '--';
            document.getElementById('nearModalCoords').innerText =
                (stn.latitude != null && stn.longitude != null)
                    ? `${stn.latitude.toFixed(2)}, ${stn.longitude.toFixed(2)}`
                    : '--';

            const catEl = document.getElementById('nearModalCat');
            catEl.innerText = '--'; catEl.className = 'badge badge-cat';
            document.getElementById('nearModalWeather').innerHTML =
                '<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 0;">' +
                '<span style="color:var(--accent);">⏳</span><span>Fetching current weather...</span></div>';

            document.getElementById('nearbyModal').classList.add('active');

            // Fetch METAR for preview
            try {
                const m = await secureFetch(`/api/weather?type=metar&station=${icao}`);
                if (m && !m.error) {
                    const rules  = m.flight_rules || '--';
                    const cssMap = { VFR:'cat-vfr', MVFR:'cat-mvfr', IFR:'cat-ifr', LIFR:'cat-lifr' };
                    catEl.innerText = rules;
                    catEl.className = 'badge badge-cat ' + (cssMap[rules] || '');

                    const wind = m.wind_direction?.repr === 'VRB'
                        ? `VRB / ${m.wind_speed?.value || 0}kt`
                        : `${String(m.wind_direction?.value ?? 0).padStart(3,'0')}° / ${m.wind_speed?.value || 0}kt`;
                    const vis   = m.visibility ? `${m.visibility.value} sm` : '--';
                    const ceil  = m.clouds?.[0] ? `${m.clouds[0].type} ${m.clouds[0].altitude * 100}'` : 'CLR';
                    const temp  = m.temperature?.value != null ? `${m.temperature.value}°C` : '--';
                    const alt   = m.altimeter?.value
                        ? (m.altimeter.value < 200 ? `A${m.altimeter.value.toFixed(2)}` : `Q${m.altimeter.value}`)
                        : '--';
                    const mins  = Math.floor((Date.now() - new Date(m.time?.dt)) / 60000);
                    const ageColor = mins > 60 ? 'var(--danger)' : 'var(--sub-text)';

                    document.getElementById('nearModalWeather').innerHTML = `
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                            <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px;">
                                <div style="font-size:10px;color:var(--sub-text);margin-bottom:2px;text-transform:uppercase;">Wind</div>
                                <div style="font-size:14px;font-weight:700;color:var(--text);">${wind}</div>
                            </div>
                            <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px;">
                                <div style="font-size:10px;color:var(--sub-text);margin-bottom:2px;text-transform:uppercase;">Visibility</div>
                                <div style="font-size:14px;font-weight:700;color:var(--text);">${vis}</div>
                            </div>
                            <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px;">
                                <div style="font-size:10px;color:var(--sub-text);margin-bottom:2px;text-transform:uppercase;">Ceiling</div>
                                <div style="font-size:14px;font-weight:700;color:var(--text);">${ceil}</div>
                            </div>
                            <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px;">
                                <div style="font-size:10px;color:var(--sub-text);margin-bottom:2px;text-transform:uppercase;">Temp · Alt</div>
                                <div style="font-size:13px;font-weight:700;color:var(--text);">${temp} · ${alt}</div>
                            </div>
                        </div>
                        <div style="font-size:10px;color:${ageColor};text-align:right;padding-top:4px;border-top:1px solid var(--border);">
                            ${mins > 60 ? '⚠️ ' : ''}Updated ${mins}m ago
                        </div>`;
                } else {
                    document.getElementById('nearModalWeather').innerHTML =
                        '<div style="color:var(--sub-text);text-align:center;padding:8px;">No weather data for this station.</div>';
                }
            } catch(e) {
                document.getElementById('nearModalWeather').innerHTML =
                    '<div style="color:var(--sub-text);text-align:center;padding:8px;">Could not load weather. Check connection.</div>';
            }
        }

        function closeNearbyModal() {
            document.getElementById('nearbyModal').classList.remove('active');
            _nearbyModalData = null;
        }

        function loadNearbyFromModal() {
            if (!_nearbyModalData) return;
            const icao = _nearbyModalData.station.icao;
            closeNearbyModal();
            document.getElementById('icao').value = icao;
            loadData();
        }

        // ================================================================
        // SUPPLEMENTARY AIRPORT DATA (aviationweather.gov)
        // ================================================================
        async function fetchAirportSupplementary(icao) {
            const cacheKey = `cache_aw_airport_${icao}`;
            const cached   = localStorage.getItem(cacheKey);
            if (cached) {
                const c = JSON.parse(cached);
                if (Date.now() - c.ts < 3600000) return c.data; // 1h cache
            }
            try {
                const res  = await fetch(`https://aviationweather.gov/api/data/airport?ids=${icao}&format=json`);
                if (!res.ok) return null;
                const arr  = await res.json();
                const data = Array.isArray(arr) ? arr[0] : null;
                if (!data) return null;
        
                // Parse comm frequencies out of the freqs string if present
                // awc returns a simple object; extract what's useful
                const result = {
                    comms: [],
                    runwayStr: data.runways || ''
                };
        
                // Some stations have a freqs field as a pipe-separated string
                if (data.freqs) {
                    const parts = data.freqs.split('|').filter(Boolean);
                    parts.forEach(p => {
                        const m = p.match(/([A-Z\/\s]+)\s+([\d.]+)/);
                        if (m) result.comms.push({ type: m[1].trim(), frequency: m[2] });
                    });
                }
        
                localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: result }));
                return result;
            } catch(e) {
                console.warn('[AirportSupp] Failed:', e);
                return null;
            }
        }
    
        function renderInfo(d) {
            document.getElementById('infoName').innerText   = d.name;
            document.getElementById('infoLoc').innerText    = `${d.city || ''}, ${d.country || ''} (${d.icao})`;
            document.getElementById('infoCodes').innerText  = `${d.icao} / ${d.iata || '--'}`;
            document.getElementById('infoElev').innerText   = `${d.elevation_ft} ft`;
            document.getElementById('infoCoords').innerText = `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}`;
            const elev = d.elevation_ft, temp = currentMetar.temp;
            let qnhHpa = currentMetar.alt;
            if (currentMetar.altUnit === 'inHg') qnhHpa = currentMetar.alt * 33.8639;
            const pa      = Math.round(elev + (1013.25 - qnhHpa) * 30);
            const isaTemp = 15 - (2 * pa / 1000);
            const isaDev  = Math.round(temp - isaTemp);
            const da      = Math.round(pa + 120 * (temp - isaTemp));
            document.getElementById('calcPA').innerText  = `${pa} ft`;
            document.getElementById('calcDA').innerText  = `${da} ft`;
            document.getElementById('calcISA').innerText = `${isaDev >= 0 ? '+' : ''}${isaDev}°C`;
            checkDAWarning(da, elev);
            const fContainer = document.getElementById('freqContainer');
                        fContainer.innerHTML = '<div style="color:#555;font-size:12px;padding:4px;">Loading frequencies...</div>';
            
                        // Phone numbers
                        const phoneContainer = document.getElementById('atisPhones');
                        if (phoneContainer) {
                            phoneContainer.innerHTML = '<div style="color:#555;font-size:12px;padding:8px;">Loading...</div>';
                        }
            
                        // Fetch supplementary data from aviationweather.gov
                        fetchAirportSupplementary(d.icao).then(awData => {
                            // ── FREQUENCIES ──
                            fContainer.innerHTML = '';
                            const avwxFreqs = (d.frequencies || []).slice(0, 8);
                            const awFreqs   = awData?.comms || [];
            
                            const allFreqs = avwxFreqs.length > 0 ? avwxFreqs.map(f => ({
                                type: f.type, frequency: f.frequency
                            })) : awFreqs;
            
                            if (allFreqs.length > 0) {
                                allFreqs.slice(0, 9).forEach(f => {
                                    const card = document.createElement('div'); card.className = 'freq-card';
                                    card.innerHTML = `<div class="freq-type">${f.type || f.frequencyType || '--'}</div><div class="freq-val">${f.frequency || f.freq || '--'}</div>`;
                                    fContainer.appendChild(card);
                                });
                            } else {
                                fContainer.innerHTML = `
                                    <div style="grid-column:span 3;color:#555;font-size:12px;padding:8px;text-align:center;">
                                        No frequency data available.
                                        <a href="https://skyvector.com/airport/${d.icao}" target="_blank" 
                                           style="color:var(--accent);margin-left:6px;text-decoration:none;">
                                            View on SkyVector ↗
                                        </a>
                                    </div>`;
                            }
            
                            // ── ATIS/AWOS PHONES ──
                            if (phoneContainer) {
                                // Hardcoded Taiwan ATIS phone numbers (most reliable)
                                const twAtisPhones = {};
            
                                let phones = twAtisPhones[d.icao] || [];
            
                                // Also check AVWX communications field
                                if (phones.length === 0 && d.communications && Array.isArray(d.communications)) {
                                    phones = d.communications
                                        .filter(c => ['ATIS','AWOS','ASOS'].includes((c.type||'').toUpperCase()) && c.phone)
                                        .map(c => ({ type: c.type.toUpperCase(), phone: c.phone, freq: c.frequency ? `${c.frequency} MHz` : '' }));
                                }
            
                                if (phones.length > 0) {
                                    phoneContainer.innerHTML = phones.map(p => `
                                        <div class="phone-card">
                                            <div class="phone-label">${p.type}${p.freq ? ' · ' + p.freq : ''}</div>
                                            <a href="tel:${p.phone.replace(/[^\d+]/g,'')}" class="phone-number">
                                                📞 ${p.phone}
                                            </a>
                                        </div>`).join('');
                                } else {
                                    phoneContainer.innerHTML = `
                                        <div style="color:#555;font-size:12px;padding:8px;line-height:1.6;">
                                            No phone data available for ${d.icao}.<br>
                                            <a href="https://www.airnav.com/airport/${d.icao}" target="_blank" 
                                               style="color:var(--accent);text-decoration:none;">
                                                Check AirNav ↗
                                            </a>
                                        </div>`;
                                }
                            }
                        });
            
            updateSunDisplay();
            const sunEl = document.getElementById('infoSun');
            sunEl.style.cursor = "pointer"; sunEl.style.textDecoration = "underline"; sunEl.style.textDecorationColor = "#555";
            sunEl.title = "Tap to switch UTC / Local"; sunEl.onclick = toggleSunFormat;
            let helper = document.getElementById('sunHelper');
            if (!helper) {
                helper = document.createElement('div'); helper.id = 'sunHelper';
                helper.style.cssText = 'font-size:10px;color:var(--sub-text);margin-top:4px;font-style:italic;';
                sunEl.parentElement.appendChild(helper);
            }
            helper.innerText = "(Tap time to toggle UTC / Local)";
            const sData   = getSunTimes(d.latitude, d.longitude);
            const today   = new Date();
            const riseDate = new Date(today); riseDate.setUTCHours(sData.rawRise);
            const setDate  = new Date(today); setDate.setUTCHours(sData.rawSet);
            stationSunTimes = { sunrise: riseDate, sunset: setDate };
            if (tafDataCache && tafDataCache.length > 0) {
                updateTafSkyGradient(new Date(tafDataCache[0].start_time.dt), new Date(tafDataCache[tafDataCache.length-1].end_time.dt));
            }
        }

        function checkDAWarning(da, elev) {
            const daEl = document.getElementById('calcDA');
            if (da > elev + 2000) { daEl.style.color = "var(--warn)"; daEl.innerHTML = `${da} ft ⚠️`; }
            else { daEl.style.color = "var(--text)"; }
        }
