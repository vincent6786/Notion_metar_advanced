        // ================================================================
        // 17. RUNWAY SETUP & WIND ROSE
        // ================================================================
        function setupRunwaySelect() {
            const sel = document.getElementById('rwySelect');
            sel.innerHTML = '';
            const mv      = stationData.magnetic_variation || 0;
            const safeDir = (currentWind.dir === 'VRB') ? 0 : currentWind.dir;
            const windMag = safeDir - mv;
            let bestRwy = null, maxHW = -999;
        
            (stationData.runways || []).forEach(r => {
                sel.add(new Option(`RWY ${r.ident1}`, r.ident1));
                sel.add(new Option(`RWY ${r.ident2}`, r.ident2));
                const h1  = parseInt(r.ident1.replace(/\D/g, '')) * 10;
                const hw1 = Math.cos((windMag - h1) * (Math.PI / 180)) * currentWind.spd;
                if (hw1 > maxHW) { maxHW = hw1; bestRwy = r.ident1; }
                const h2  = parseInt(r.ident2.replace(/\D/g, '')) * 10;
                const hw2 = Math.cos((windMag - h2) * (Math.PI / 180)) * currentWind.spd;
                if (hw2 > maxHW) { maxHW = hw2; bestRwy = r.ident2; }
            });
        
            // Check for saved preferred runway for this airport
            const icao    = document.getElementById('icao').value.toUpperCase();
            const rawPref = localStorage.getItem(`efb_pref_rwy_${icao}`);
            let savedPref = null;
            try { savedPref = rawPref ? JSON.parse(rawPref) : null; } catch(e) {}
        
            if (savedPref && sel.querySelector(`option[value="${savedPref}"]`)) {
                sel.value = savedPref;
            } else if (bestRwy) {
                sel.value = bestRwy;
            } else if (stationData.runways?.length > 0) {
                sel.value = stationData.runways[0].ident1;
            }
        
            drawWindRose();
            renderRunwaysComplex();
            // Sync rwySelect2 (Weather tab) to match rwySelect
            const sel2 = document.getElementById('rwySelect2');
            if (sel2) {
                sel2.innerHTML = sel.innerHTML;
                sel2.value     = sel.value;
            }
        }

        function syncRwySelect(changedId) {
            const otherId = changedId === 'rwySelect' ? 'rwySelect2' : 'rwySelect';
            const changed = document.getElementById(changedId);
            const other   = document.getElementById(otherId);
            if (changed && other && other.querySelector(`option[value="${changed.value}"]`)) {
                other.value = changed.value;
            }
        }
    

        function drawWindRose(forceCanvasId) {
            const weatherTabActive = document.getElementById('tab-weather')?.classList.contains('active');
            const canvasId = forceCanvasId || (weatherTabActive ? 'windRose2' : 'windRose');
            const canvas   = document.getElementById(canvasId);
            const ctx      = canvas.getContext('2d');
            const w = 140, h = 140, cx = 70, cy = 70, r = 54;
            const rwyIdent = weatherTabActive
                ? (document.getElementById('rwySelect2').value || document.getElementById('rwySelect').value)
                : document.getElementById('rwySelect').value;
            // Color palette
            const cyanBlue  = '#00d2ff';
            const northRed  = '#ff3333';
            const rwyBg     = '#000000';
            const rwyDash   = '#ffffff';
            const textCalm  = '#32d74b';
            const textVrb   = '#ff9f0a';

            ctx.clearRect(0, 0, w, h);

            // Compass ring
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.strokeStyle = cyanBlue; ctx.lineWidth = 2; ctx.stroke();

            // Compass labels
            ctx.font = '800 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = northRed; ctx.fillText('N', cx, cy - r + 14);
            ctx.fillStyle = cyanBlue;
            ctx.fillText('E', cx + r - 14, cy);
            ctx.fillText('S', cx, cy + r - 14);
            ctx.fillText('W', cx - r + 14, cy);

            const mv      = stationData?.magnetic_variation || 0;
            const safeDir = (currentWind.dir === 'VRB') ? 0 : currentWind.dir;
            const windMag = safeDir - mv;

            // Runway strip
            if (rwyIdent) {
                const rwyHdg = parseInt(rwyIdent.replace(/\D/g, '')) * 10;
                const rwyRad = (rwyHdg - 90) * (Math.PI / 180);
                ctx.save(); ctx.translate(cx, cy); ctx.rotate(rwyRad);
                const rwyLen = r * 1.7, rwyW = 22;
                ctx.fillStyle = rwyBg; ctx.strokeStyle = 'rgba(0,210,255,0.3)'; ctx.lineWidth = 1;
                ctx.fillRect(-rwyLen / 2, -rwyW / 2, rwyLen, rwyW);
                ctx.strokeRect(-rwyLen / 2, -rwyW / 2, rwyLen, rwyW);
                // Centerline dashes
                ctx.fillStyle = rwyDash;
                const dashCount = 5, dashW = 12, dashH = 2;
                const totalDashSpan = rwyLen * 0.85;
                const gap = (totalDashSpan - (dashCount * dashW)) / (dashCount - 1);
                let currentX = -totalDashSpan / 2;
                for (let i = 0; i < dashCount; i++) { ctx.fillRect(currentX, -dashH / 2, dashW, dashH); currentX += dashW + gap; }
                ctx.restore();

                // Wind components
                const diff  = (windMag - rwyHdg) * (Math.PI / 180);
                const hw    = Math.round(Math.cos(diff) * currentWind.spd);
                const xw    = Math.round(Math.sin(diff) * currentWind.spd);
    
                // Update BOTH tab's wind component displays
                const hwEls = [
                    document.getElementById('valHW'),
                    document.getElementById('valHW2')
                ];
                const xwEls = [
                    document.getElementById('valXW'),
                    document.getElementById('valXW2')
                ];
    
                hwEls.forEach(el => {
                    if (!el) return;
                    if (currentWind.spd === 0) {
                        el.innerText = "Calm";
                        el.style.color = textCalm;
                    } else if (currentWind.dir === 'VRB') {
                        el.innerText = "VRB";
                        el.style.color = textVrb;
                    } else {
                        el.innerText = hw >= 0 ? `${hw}kt Head` : `${Math.abs(hw)}kt Tail`;
                        el.style.color = hw < 0 ? 'var(--danger)' : 'var(--success)';
                    }
                });
    
                xwEls.forEach(el => {
                    if (!el) return;
                    if (currentWind.spd === 0) {
                        el.innerText = "Calm";
                    } else if (currentWind.dir === 'VRB') {
                        el.innerText = "VRB";
                    } else {
                        el.innerText = `${Math.abs(xw)}kt ${xw >= 0 ? 'R' : 'L'}`;
                    }
                });
    
                checkMins();
            }

            // Wind status / arrow
            ctx.font = '800 16px "SF Mono",monospace'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
            if (currentWind.spd === 0) {
                ctx.fillStyle = textCalm; ctx.fillText("CALM", cx, cy);
            } else if (currentWind.dir === 'VRB') {
                ctx.fillStyle = textVrb; ctx.fillText("VRB", cx, cy);
                ctx.beginPath(); ctx.arc(cx, cy, 25, 0, 2 * Math.PI);
                ctx.strokeStyle = textVrb; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
            } else {
                const windRad = (windMag + 90) * (Math.PI / 180);
                ctx.save(); ctx.translate(cx, cy); ctx.rotate(windRad);
                const halfLen = 30;
                // Source triangle on ring
                ctx.beginPath(); ctx.moveTo(-r - 4, 0); ctx.lineTo(-r - 14, -5); ctx.lineTo(-r - 14, 5); ctx.closePath();
                ctx.fillStyle = cyanBlue; ctx.fill();
                // Arrow shaft
                ctx.beginPath(); ctx.moveTo(-halfLen, 0); ctx.lineTo(halfLen, 0);
                ctx.strokeStyle = cyanBlue; ctx.lineWidth = 3; ctx.stroke();
                // Arrow head
                ctx.beginPath(); ctx.moveTo(halfLen, 0); ctx.lineTo(halfLen - 10, -6); ctx.lineTo(halfLen - 10, 6); ctx.closePath();
                ctx.fillStyle = cyanBlue; ctx.fill();
                ctx.restore();
            }
        }

        function drawWindRoseOnCanvas(canvasId) {
            const orig = document.getElementById('rwySelect');
            const copy = document.getElementById('rwySelect2');
            if (copy && orig) copy.value = orig.value;
            drawWindRose(canvasId);
        }
    
        function renderRunwaysComplex() {
            const container = document.getElementById('runwayListComplex');
            container.innerHTML = '';
            const d = stationData; if (!d || !d.runways) return;
            const magVar         = d.magnetic_variation || 0;
            const safeWindDir = (currentWind.dir === 'VRB') ? 0 : currentWind.dir;
            const windMagDir = safeWindDir - magVar;
            const userLimitXW    = parseFloat(localStorage.getItem('efb_min_xw')) || 999;

            d.runways.forEach((r) => {
                const dimStr   = useMetric ? `${Math.round(r.length_ft * 0.3048)}m` : `${r.length_ft}'`;
                const rwy1Hdg  = parseInt(r.ident1.replace(/\D/g, '')) * 10;
                const diffRad  = (windMagDir - rwy1Hdg) * (Math.PI / 180);
                const hw       = Math.round(Math.cos(diffRad) * currentWind.spd);
                const xw       = Math.round(Math.sin(diffRad) * currentWind.spd);
                const absXW    = Math.abs(xw);
                const isExceeded = absXW > userLimitXW;
                const rowOpacity = isExceeded ? '0.7' : '1';
                const warnBadge  = isExceeded ? `<span style="background:var(--danger);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;margin-left:8px;font-weight:800;">⚠️ LIMIT (${userLimitXW}kt)</span>` : '';
                const color1 = hw >= 0 ? 'var(--success)' : 'var(--danger)';
                const color2 = hw < 0  ? 'var(--success)' : 'var(--danger)';
                const div = document.createElement('div'); div.className = 'rwy-complex';
                if (isExceeded) div.style.border = '1px solid var(--danger)';
                div.innerHTML = `
                    <div class="rc-header" style="opacity:${rowOpacity}">
                        <div class="rc-idents"><span style="color:${color1}">${r.ident1}</span> / <span style="color:${color2}">${r.ident2}</span>${warnBadge}</div>
                        <div class="rc-dims">${dimStr}</div>
                    </div>
                    <div class="rc-strip" style="opacity:${rowOpacity}">
                        <div class="rc-id-v">${r.ident1}</div>
                        <div class="rc-data">
                            <div class="wind-comp" style="color:${color1}"><span style="font-weight:700;">${Math.abs(hw)}kt</span><span>${hw >= 0 ? '⬆' : '⬇'}</span></div>
                            <div class="wind-comp" style="margin-left:12px;color:#0a84ff;"><span style="font-weight:700;${isExceeded ? 'color:var(--danger);' : ''}">${absXW}kt</span><span>${xw >= 0 ? '➡' : '⬅'}</span></div>
                        </div>
                        <div class="rc-id-v" style="transform:rotate(0deg);">${r.ident2}</div>
                    </div>`;
                container.appendChild(div);
            });
        }

        // ================================================================
        // 18. TAF RENDERING
        // ================================================================

        // --- Weather Crosscheck helpers ---

        function getCeilingFt(clouds) {
            if (!clouds || clouds.length === 0) return null;
            const layer = clouds.find(c => ['BKN','OVC','VV'].includes(c.type));
            return layer ? layer.altitude * 100 : null;
        }

        function wxSeverity(wxCodes) {
            if (!wxCodes || wxCodes.length === 0) return 0;
            const r = wxCodes.map(x => x.repr.toUpperCase()).join(' ');
            if (r.includes('TS')) return 4;
            if (/FZ|GR|GS/.test(r)) return 3;
            if (/SN|SG|PL|IC/.test(r)) return 2;
            if (/RA|DZ|SH|FG|BR|HZ|FU|VA|SA|DU/.test(r)) return 1;
            return 0;
        }

        function renderCrosscheck() {
            const panel  = document.getElementById('tafCrosscheck');
            const panel2 = document.getElementById('tafCrosscheck2');
            if (!panel) return;

            const isOpen = localStorage.getItem('efb_crosscheck_open') === 'true';
            const display = isOpen ? 'block' : 'none';
            panel.style.display = display;
            if (panel2) panel2.style.display = display;

            // Sync button active state
            ['', '2'].forEach(s => {
                const btn = document.getElementById('crosscheckBtn' + s);
                if (!btn) return;
                btn.style.background   = isOpen ? 'rgba(10,132,255,0.2)' : 'rgba(10,132,255,0.08)';
                btn.style.borderColor  = isOpen ? 'var(--accent)' : '#333';
                btn.style.color        = isOpen ? 'var(--accent)' : 'var(--sub-text)';
            });

            if (!isOpen) return;

            // Guard: need both TAF periods and current METAR
            if (!tafDataCache || !lastMetarObj) {
                const msg = `<div style="color:var(--sub-text);font-size:11px;text-align:center;padding:12px;">${!tafDataCache ? 'Load an airport to see the TAF crosscheck.' : 'No METAR data loaded.'}</div>`;
                panel.innerHTML = msg;
                if (panel2) panel2.innerHTML = msg;
                return;
            }

            // Find active TAF period
            const now = new Date();
            const activeIdx = tafDataCache.findIndex(f => {
                const s = new Date(f.start_time.dt), e = new Date(f.end_time.dt);
                return now >= s && now < e;
            });
            if (activeIdx === -1) {
                const msg = `<div style="color:var(--sub-text);font-size:11px;text-align:center;padding:12px;">⚠️ No active TAF period — TAF may be expired.</div>`;
                panel.innerHTML = msg;
                if (panel2) panel2.innerHTML = msg;
                return;
            }

            const taf = tafDataCache[activeIdx];
            const m   = lastMetarObj;

            // Period label
            const ps = new Date(taf.start_time.dt), pe = new Date(taf.end_time.dt);
            const periodStr = `${ps.getUTCHours().toString().padStart(2,'0')}z – ${pe.getUTCHours().toString().padStart(2,'0')}z`;

            // Badge builder
            function xBadge(color, label) {
                const bg = color === 'green' ? 'rgba(50,215,75,0.15)'  : color === 'amber' ? 'rgba(255,159,10,0.15)' : 'rgba(255,69,58,0.15)';
                const fg = color === 'green' ? 'var(--success)' : color === 'amber' ? 'var(--warn)' : 'var(--danger)';
                return `<span class="xcheck-badge" style="background:${bg};color:${fg};">${label}</span>`;
            }

            let score = 0, total = 0;
            const rows = [];

            // Wind Direction
            const tafDir   = taf.wind_direction?.value;
            const metarDir = m.wind_direction?.value;
            if (tafDir != null && metarDir != null) {
                total++;
                const diff = Math.min(Math.abs(tafDir - metarDir), 360 - Math.abs(tafDir - metarDir));
                const col  = diff <= 20 ? 'green' : diff <= 45 ? 'amber' : 'red';
                if (col === 'green') score++;
                rows.push(['Wind Dir', `${tafDir}°`, `${metarDir}°`, xBadge(col, `±${diff}°`)]);
            } else {
                rows.push(['Wind Dir', tafDir == null ? 'VRB' : `${tafDir}°`, metarDir == null ? 'VRB' : `${metarDir}°`, xBadge('green', 'N/A')]);
            }

            // Wind Speed
            const tafSpd   = taf.wind_speed?.value ?? 0;
            const metarSpd = m.wind_speed?.value ?? 0;
            total++;
            const spdDiff = Math.abs(tafSpd - metarSpd);
            const spdCol  = spdDiff <= 5 ? 'green' : spdDiff <= 10 ? 'amber' : 'red';
            if (spdCol === 'green') score++;
            rows.push(['Wind Spd', `${tafSpd} kt`, `${metarSpd} kt`, xBadge(spdCol, `±${spdDiff} kt`)]);

            // Gust
            const tafGust   = taf.wind_gust?.value ?? null;
            const metarGust = m.wind_gust?.value ?? null;
            if (tafGust != null || metarGust != null) {
                total++;
                let gustCol, gustLabel;
                if (tafGust == null && metarGust != null) {
                    gustCol   = metarGust > 15 ? 'red' : 'amber';
                    gustLabel = `!G${metarGust}`;
                } else if (tafGust != null && metarGust == null) {
                    gustCol   = 'green';
                    gustLabel = 'No gust';
                } else {
                    const gd  = Math.abs(tafGust - metarGust);
                    gustCol   = gd <= 5 ? 'green' : gd <= 10 ? 'amber' : 'red';
                    gustLabel = `±${gd} kt`;
                }
                if (gustCol === 'green') score++;
                rows.push(['Gust', tafGust ? `G${tafGust} kt` : 'None', metarGust ? `G${metarGust} kt` : 'None', xBadge(gustCol, gustLabel)]);
            }

            // Visibility
            const tafVisSM   = taf.visibility ? visToSM(taf.visibility.value, tafUnitsCache?.visibility) : 10;
            const metarVisSM = m.visibility   ? visToSM(m.visibility.value, m.units?.visibility)         : null;
            if (metarVisSM != null) {
                total++;
                const tafV   = Math.min(tafVisSM, 10), metarV = Math.min(metarVisSM, 10);
                const visDiff = Math.abs(tafV - metarV);
                const visCol  = visDiff <= 1 ? 'green' : visDiff <= 3 ? 'amber' : 'red';
                if (visCol === 'green') score++;
                const tafVStr   = tafV   >= 10 ? 'P6SM' : formatVisDisplay(tafVisSM);
                const metarVStr = metarV >= 10 ? 'P6SM' : formatVisDisplay(metarVisSM);
                rows.push(['Visibility', tafVStr, metarVStr, xBadge(visCol, `±${visDiff.toFixed(1)} SM`)]);
            }

            // Ceiling
            const tafCeil   = getCeilingFt(taf.clouds);
            const metarCeil = getCeilingFt(m.clouds);
            total++;
            if (tafCeil == null && metarCeil == null) {
                score++;
                rows.push(['Ceiling', 'SKC', 'SKC', xBadge('green', 'Clear')]);
            } else if (tafCeil == null || metarCeil == null) {
                const ceilVal = tafCeil == null ? metarCeil : tafCeil;
                const ceilCol = ceilVal > 3000 ? 'green' : ceilVal > 1000 ? 'amber' : 'red';
                if (ceilCol === 'green') score++;
                const sign = tafCeil == null ? '+' : '-';
                rows.push(['Ceiling', tafCeil ? `${tafCeil.toLocaleString()}'` : 'SKC', metarCeil ? `${metarCeil.toLocaleString()}'` : 'SKC', xBadge(ceilCol, `${sign}${ceilVal.toLocaleString()}'`)]);
            } else {
                const cDiff   = Math.abs(tafCeil - metarCeil);
                const ceilCol = cDiff <= 500 ? 'green' : cDiff <= 1000 ? 'amber' : 'red';
                if (ceilCol === 'green') score++;
                rows.push(['Ceiling', `${tafCeil.toLocaleString()}'`, `${metarCeil.toLocaleString()}'`, xBadge(ceilCol, `±${cDiff.toLocaleString()}'`)]);
            }

            // Weather phenomena
            const tafSev    = wxSeverity(taf.wx_codes);
            const metarSev  = wxSeverity(m.wx_codes);
            const tafWxStr  = taf.wx_codes?.length  ? taf.wx_codes.map(x => x.repr).join(' ')  : 'NSW';
            const metarWxStr = m.wx_codes?.length   ? m.wx_codes.map(x => x.repr).join(' ')   : 'None';
            total++;
            const sevDiff = Math.abs(tafSev - metarSev);
            const wxCol   = sevDiff === 0 ? 'green' : sevDiff === 1 ? 'amber' : 'red';
            if (wxCol === 'green') score++;
            rows.push(['Weather', tafWxStr, metarWxStr, xBadge(wxCol, sevDiff === 0 ? 'Match' : sevDiff === 1 ? 'Close' : 'Miss')]);

            // Flight category badges
            const tafRules   = taf.flight_rules || '--';
            const metarRules = m.flight_rules   || '--';
            const catBadge = (rules) => {
                const cls = rules.toLowerCase();
                return `<span class="badge cat-${cls}" style="padding:2px 8px;border-radius:5px;font-size:11px;font-weight:800;">${rules}</span>`;
            };

            // Score + educational tip
            const pct = total > 0 ? score / total : 0;
            const scoreColor = pct >= 0.83 ? 'var(--success)' : pct >= 0.5 ? 'var(--warn)' : 'var(--danger)';
            const tip = pct >= 0.83 ? 'TAF highly accurate — weather evolving as forecast.'
                      : pct >= 0.5  ? 'Minor deviations — common in transitional weather. Check trends.'
                      :               'Significant deviations — always verify with latest METAR before flight.';

            // Table rows HTML
            const rowsHTML = rows.map(([param, tafVal, metarVal, badgeHtml]) => `
                <tr>
                    <td class="xcheck-param">${param}</td>
                    <td class="xcheck-val">${tafVal}</td>
                    <td class="xcheck-val">${metarVal}</td>
                    <td style="text-align:right;">${badgeHtml}</td>
                </tr>`).join('');

            const html = `
                <div class="xcheck-header">
                    <span>TAF vs METAR Crosscheck</span>
                    <span style="font-weight:400;color:#555;text-transform:none;letter-spacing:0;">Period: ${periodStr}</span>
                </div>
                <div class="xcheck-cat-row">
                    <span style="font-size:10px;font-weight:700;color:var(--sub-text);text-transform:uppercase;letter-spacing:0.4px;">Forecast</span>
                    ${catBadge(tafRules)}
                    <span style="color:#444;margin:0 2px;">→</span>
                    <span style="font-size:10px;font-weight:700;color:var(--sub-text);text-transform:uppercase;letter-spacing:0.4px;">Actual</span>
                    ${catBadge(metarRules)}
                </div>
                <table class="xcheck-table">
                    <thead>
                        <tr>
                            <td class="xcheck-param"></td>
                            <td style="font-size:10px;font-weight:700;color:var(--sub-text);text-transform:uppercase;letter-spacing:0.4px;padding:4px 4px 6px;">TAF Forecast</td>
                            <td style="font-size:10px;font-weight:700;color:var(--sub-text);text-transform:uppercase;letter-spacing:0.4px;padding:4px 4px 6px;">METAR Actual</td>
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>${rowsHTML}</tbody>
                </table>
                <div class="xcheck-score">
                    <span style="color:${scoreColor};font-weight:800;">${score}/${total} within tolerance</span>
                    <span style="margin-left:6px;">— ${tip}</span>
                </div>`;

            panel.innerHTML = html;
            if (panel2) { panel2.innerHTML = html; }
        }

        function toggleCrosscheck() {
            const nowOpen = localStorage.getItem('efb_crosscheck_open') !== 'true';
            localStorage.setItem('efb_crosscheck_open', String(nowOpen));
            renderCrosscheck();
        }

        function renderTaf(d) {
            // Raw TAF text
            document.getElementById('rawTaf').innerText = d.raw || "No TAF Data";
            
            // Issued + Expiry times
            const issuedEl = document.getElementById('tafIssued');
            if (d.time && d.forecast && d.forecast.length > 0) {
                const issued = new Date(d.time.dt);
                const expiry = new Date(d.forecast[d.forecast.length - 1].end_time.dt);
                const now = new Date();
                
                const issuedStr = `${issued.getUTCDate().toString().padStart(2,'0')}/${(issued.getUTCMonth()+1).toString().padStart(2,'0')} ${issued.getUTCHours().toString().padStart(2,'0')}:${issued.getUTCMinutes().toString().padStart(2,'0')}Z`;
                
                const remainMs = expiry - now;
                const remainHrs = Math.floor(remainMs / 3600000);
                const remainMins = Math.floor((remainMs % 3600000) / 60000);
                
                let timeLeftStr = '';
                if (remainMs > 0) {
                    if (remainHrs > 0) {
                        timeLeftStr = `${remainHrs}h ${remainMins}m left`;
                    } else if (remainMins > 0) {
                        timeLeftStr = `${remainMins}m left`;
                    } else {
                        timeLeftStr = 'Expiring soon';
                    }
                } else {
                    timeLeftStr = '⚠️ EXPIRED';
                }
                
                const expiryColor = remainMs < 1800000 ? 'var(--warn)' : 'var(--sub-text)';  // warn if <30min
                
                issuedEl.innerHTML = `
                    <span style="white-space:nowrap;">Issued: ${issuedStr}</span>
                    <span style="color:${expiryColor};white-space:nowrap;margin-left:8px;">⏱ ${timeLeftStr}</span>
                `;
                issuedEl.style.cssText = 'display:flex;align-items:center;flex-wrap:nowrap;overflow:hidden;min-width:0;font-size:11px;';
            } else {
                issuedEl.innerText = '--';
            }
            tafDataCache = d.forecast;
            tafUnitsCache = d.units || {};
            const bar  = document.getElementById('tafBar');
            const axis = document.getElementById('tafAxis');
            bar.innerHTML = ''; axis.innerHTML = '';
            document.getElementById('tafDetail').classList.add('hidden');
            if (!d.forecast || d.forecast.length === 0) return;
            const startT = new Date(d.forecast[0].start_time.dt);
            const endT   = new Date(d.forecast[d.forecast.length - 1].end_time.dt);
            const totalDur = endT - startT;
            const now    = new Date();

            if (now >= startT && now < endT) {
                const p      = ((now - startT) / totalDur) * 100;
                const needle = document.getElementById('tafNeedle');
                needle.style.display = 'block';
                needle.style.left    = `${p}%`;
                needle.style.cursor  = 'pointer';
                needle.dataset.utc   = now.toISOString();
            }

            d.forecast.forEach((f, index) => {
                const block = document.createElement('div'); block.className = 'taf-block'; block.style.flex = "1";
                let col = '#555';
                if (f.flight_rules === 'VFR')  col = 'var(--success)';
                if (f.flight_rules === 'MVFR') col = 'var(--mvfr)';
                if (f.flight_rules === 'IFR')  col = 'var(--danger)';
                if (f.flight_rules === 'LIFR') col = 'var(--lifr)';
                block.style.backgroundColor = col;

                // Check if this period is currently active
                const fStart = new Date(f.start_time.dt);
                const fEnd   = new Date(f.end_time.dt);
                const isActive = now >= fStart && now < fEnd;
                if (isActive) {
                    block.style.outline = '2px solid #fff';
                    block.style.outlineOffset = '-2px';
                    block.style.zIndex = '1';
                    block.style.position = 'relative';
                    block.innerHTML = `<span style="font-size:9px;font-weight:900;letter-spacing:0.3px;display:block;">${f.type}</span><span style="font-size:8px;opacity:0.85;">NOW</span>`;
                } else {
                    block.innerText = f.type;
                }
                block.setAttribute('onclick', `showTafDetail(${index}, '${col}')`);
                bar.appendChild(block);
                if (index % 2 === 0) {
                    const s   = new Date(f.start_time.dt);
                    const lbl = document.createElement('div'); lbl.className = 'taf-axis-lbl'; lbl.style.flex = "2";
                    lbl.innerText = `${s.getUTCHours()}z`; axis.appendChild(lbl);
                }
            });

            // Auto-expand the currently active forecast period
            const activeIdx = d.forecast.findIndex(f => {
                const s = new Date(f.start_time.dt), e = new Date(f.end_time.dt);
                return now >= s && now < e;
            });
            if (activeIdx !== -1) {
                const activeForecast = d.forecast[activeIdx];
                let activeCol = '#555';
                if (activeForecast.flight_rules === 'VFR')  activeCol = 'var(--success)';
                if (activeForecast.flight_rules === 'MVFR') activeCol = 'var(--mvfr)';
                if (activeForecast.flight_rules === 'IFR')  activeCol = 'var(--danger)';
                if (activeForecast.flight_rules === 'LIFR') activeCol = 'var(--lifr)';
                showTafDetail(activeIdx, activeCol);
            }
            if (stationSunTimes) updateTafSkyGradient(startT, endT);
            renderCrosscheck();
        }

        function toggleTafNeedleTooltip() {
            const tooltip   = document.getElementById('tafNeedleTooltip');
            if (!tooltip) return;
            const isVisible = tooltip.classList.contains('visible');
            if (isVisible) { tooltip.classList.remove('visible'); return; }
            const now    = new Date();
            const utcStr = now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false });
            let localStr = '--:--', localLabel = 'Local';
            if (stationOffsetSec !== 0) {
                const localDate = new Date(now.getTime() + (stationOffsetSec * 1000));
                localStr  = localDate.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false });
                const offsetHrs = stationOffsetSec / 3600;
                localLabel = `UTC${offsetHrs >= 0 ? '+' : ''}${offsetHrs}`;
            }
            tooltip.innerHTML = `
                <div style="color:#ff453a;font-weight:800;margin-bottom:3px;font-size:10px;">NOW</div>
                <div style="color:#fff;">${utcStr} <span style="color:#8e8e93;">UTC</span></div>
                <div style="color:#0a84ff;">${localStr} <span style="color:#8e8e93;">${localLabel}</span></div>`;
            tooltip.classList.add('visible');
            setTimeout(() => tooltip.classList.remove('visible'), 3000);
        }

        function showTafDetail(index, color) {
            const f = tafDataCache[index];
            if (!f) return;
            const s = new Date(f.start_time.dt), e = new Date(f.end_time.dt);
            const timeStr  = `${s.getUTCHours()}z ➔ ${e.getUTCHours()}z`;
            const windStr  = `${f.wind_direction?.value || 'VRB'}° / ${f.wind_speed?.value || 0}kt`;
            const visStr   = f.visibility ? formatVisDisplay(visToSM(f.visibility.value, tafUnitsCache?.visibility)) : 'P6SM';
            const wxStr    = f.wx_codes ? f.wx_codes.map(x => x.repr).join(' ') : 'NSW';
            let cStr = 'SKC';
            if (f.clouds && f.clouds.length > 0) cStr = f.clouds.map(c => `${c.type}${c.altitude.toString().padStart(3, '0')}`).join(' ');
        
            // Update both the original and weather-tab duplicate
            ['', '2'].forEach(suffix => {
                const card = document.getElementById('tafDetail' + suffix);
                if (!card) return;
                card.style.borderLeftColor = color;
                card.classList.remove('hidden');
                const set = (id, val) => { const el = document.getElementById(id + suffix); if (el) el.innerText = val; };
                set('tdTime',  timeStr);
                set('tdType',  f.type);
                set('tdWind',  windStr);
                set('tdVis',   visStr);
                set('tdWx',    wxStr);
                set('tdCloud', cStr);
            });
        }

        function updateTafSkyGradient(startT, endT) {
            if (!stationSunTimes || !startT || !endT) return;
            const getH = (d) => d.getUTCHours() + (d.getUTCMinutes() / 60);
            const sr = getH(stationSunTimes.sunrise), ss = getH(stationSunTimes.sunset);
            const cNight = "#0f172a", cDay = "#0ea5e9", cDawn = "#f97316";
            const stops = [], totalDur = endT - startT;
            let curr = new Date(startT);
            while (curr <= endT) {
                const hh = getH(curr), pct = ((curr - startT) / totalDur) * 100;
                const isDay = (hh >= sr && hh < ss);
                let color = isDay ? cDay : cNight;
                if (Math.abs(hh - sr) < 0.8 || Math.abs(hh - ss) < 0.8) color = cDawn;
                stops.push(`${color} ${pct.toFixed(1)}%`); curr.setMinutes(curr.getMinutes() + 30);
            }
            document.getElementById('tafSkyStrip').style.background = `linear-gradient(to right, ${stops.join(', ')})`;
        }

        // ================================================================
        // 19. WORLD CLOCK
        // ================================================================
        async function initWorldClock() {
            if (shouldBackupCities() && navigator.onLine) {
                const cloudCities = await Storage.get('efb_cities_v47');
                if (cloudCities && Array.isArray(cloudCities)) {
                    cityList = cloudCities;
                    localStorage.setItem('efb_cities_v47', JSON.stringify(cityList));
                    return;
                }
            }
            const stored = localStorage.getItem('efb_cities_v47');
            if (stored) {
                cityList = JSON.parse(stored);
            } else {
                cityList = [
                    { n: "Taipei",   icao: "RCTP", z: "Asia/Taipei" },
                    { n: "New York", icao: "KJFK", z: "America/New_York" },
                    { n: "London",   icao: "EGLL", z: "Europe/London" }
                ];
                localStorage.setItem('efb_cities_v47', JSON.stringify(cityList));
            }
            // At end of initWorldClock():
            const wc = document.getElementById('worldContainer');
            if (wc) initSortable(wc, 'clock-card', 'btnReorderCities', async (from, to, isSave) => {
                if (isSave) {
                    // Done button pressed — persist final DOM order
                    const items = [...wc.querySelectorAll('.clock-card')];
                    const newOrder = items.map(el => {
                        const icao = el.querySelector('.clock-diff')?.innerText.match(/[A-Z]{4}/)?.[0];
                        return cityList.find(c => c.icao === icao) || null;
                    }).filter(Boolean);
                    if (newOrder.length === cityList.length) {
                        cityList = newOrder;
                        localStorage.setItem('efb_cities_v47', JSON.stringify(cityList));
                        if (shouldBackupCities()) await savecitiesToCloud();
                        showToast('✅ Order saved');
                    }
                    return;
                }
                // Live swap during drag
                const moved = cityList.splice(from, 1)[0];
                cityList.splice(to, 0, moved);
            });
            
        }

        function updateClock() {
            const now = new Date();
            const mainEl = document.getElementById('zuluTimeMain');
            const offsetEl = document.getElementById('zuluTimeOffset');
            
            if (!mainEl || !offsetEl) return;
            
            if (showLocalTime && stationData?.latitude && meteoDataCache) {
                // LOCAL time at the searched airport
                const offsetSec = stationOffsetSec || 0;
                const localTime = new Date(now.getTime() + (offsetSec * 1000));
                const timeStr = `${localTime.getUTCHours().toString().padStart(2,'0')}:${localTime.getUTCMinutes().toString().padStart(2,'0')}`;
                mainEl.innerText = timeStr;
                
                const offsetHrs = Math.round(offsetSec / 3600);
                const sign = offsetHrs >= 0 ? '+' : '';
                offsetEl.innerText = `LOCAL`;
                offsetEl.style.color = 'var(--accent)';
            } else {
                // ZULU time (UTC)
                const zuluStr = `${now.getUTCHours().toString().padStart(2,'0')}:${now.getUTCMinutes().toString().padStart(2,'0')}Z`;
                mainEl.innerText = zuluStr;
                
                // Show UTC offset for current airport if available
                if (stationData?.latitude && meteoDataCache) {
                    const offsetSec = stationOffsetSec || 0;
                    const offsetHrs = Math.round(offsetSec / 3600);
                    if (offsetHrs === 0) {
                        offsetEl.innerText = 'UTC';
                    } else {
                        const sign = offsetHrs > 0 ? '+' : '';
                        offsetEl.innerText = `UTC${sign}${offsetHrs}`;
                    }
                } else {
                    offsetEl.innerText = 'UTC';
                }
                offsetEl.style.color = 'var(--sub-text)';
            }

            // World clock updates (existing code)
            if (document.getElementById('tab-world').classList.contains('active')) {
                const container = document.getElementById('worldContainer');
                if (window._sortMode?.active && window._sortMode?.container === container) return;
                container.innerHTML = '';
                cityList.forEach((c, index) => {
                    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: c.z, hour: '2-digit', minute: '2-digit', hour12: false });
                    const cityDate = new Date(now.toLocaleString('en-US', { timeZone: c.z }));
                    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
                    const diffHrs = Math.round((cityDate - utcDate) / 3600000);
                    let offsetLabel = diffHrs === 0 ? "UTC" : (diffHrs > 0 ? `UTC +${diffHrs}` : `UTC ${diffHrs}`);
                    const card = document.createElement('div'); card.className = 'clock-card';
                    card.innerHTML = `
                        <div class="clock-left">
                            <div class="clock-diff">${offsetLabel} ${c.icao ? '• ' + c.icao : ''}</div>
                            <div class="clock-city">${c.n}</div>
                        </div>
                        <div style="display:flex;align-items:center;">
                            <div class="clock-time">${timeStr}</div>
                            <button class="clock-del-btn" onclick="removeCity(${index})">✕</button>
                        </div>`;
                    container.appendChild(card);
                });
            }
        }

        async function savecitiesToCloud() { await Storage.set('efb_cities_v47', cityList); }

        async function promptWorldClockBackup() {
            const mode = localStorage.getItem('efb_storage_mode');
            if (mode !== 'cloud') return;
            if (localStorage.getItem('efb_worldclock_backup_asked')) return;
            const toast = document.createElement('div');
            toast.style.cssText = `position:fixed;bottom:max(80px,env(safe-area-inset-bottom)+50px);left:50%;transform:translateX(-50%);background:#1c1c1e;border:1px solid #38383a;color:#fff;padding:14px 16px;border-radius:14px;font-size:13px;z-index:9999;width:90%;max-width:320px;box-shadow:0 8px 24px rgba(0,0,0,0.5);animation:slideUpFade 0.3s ease-out;`;
            toast.id = 'worldClockBackupToast';
            toast.innerHTML = `
                <div style="font-weight:700;margin-bottom:6px;">☁️ Back Up World Clock?</div>
                <div style="font-size:12px;color:#8e8e93;margin-bottom:12px;line-height:1.5;">Save your cities to your Cloud Backup so they restore on any device.</div>
                <div style="display:flex;gap:8px;">
                    <button onclick="declineWorldClockBackup()" style="flex:1;background:#333;border:1px solid #555;color:#8e8e93;padding:8px;border-radius:8px;font-size:12px;cursor:pointer;">No Thanks</button>
                    <button onclick="enableWorldClockBackup()" style="flex:1;background:var(--accent);border:none;color:#fff;padding:8px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">Yes, Back Up</button>
                </div>`;
            document.body.appendChild(toast);
        }

        function declineWorldClockBackup() {
            localStorage.setItem('efb_worldclock_backup_asked', 'declined');
            document.getElementById('worldClockBackupToast')?.remove();
            showToast('👍 Cities saved locally only');
        }

        async function enableWorldClockBackup() {
            localStorage.setItem('efb_worldclock_backup_asked', 'enabled');
            localStorage.setItem('efb_worldclock_backup', 'true');
            document.getElementById('worldClockBackupToast')?.remove();
            await savecitiesToCloud();
            showToast('☁️ Cities backed up!');
        }

        function shouldBackupCities() { return localStorage.getItem('efb_worldclock_backup') === 'true'; }

        async function addCustomCity() {
            const input = document.getElementById('newCityInput');
            const val   = input.value.trim().toUpperCase();
            if (!val) return;
            
            const btn = document.getElementById('btnAddCity');
            btn.innerText = "⏳";
            btn.disabled = true;
            
            try {
                console.log(`[World Clock] Searching for: ${val}`);
                
                // Try AVWX search API
                const res = await secureFetch(`/api/weather?type=search&station=${val}`);
                console.log('[World Clock] Search result:', res);
                
                // Handle various response shapes
                let station;
                if (Array.isArray(res)) {
                    station = res.length > 0 ? res[0] : null;
                } else if (res && typeof res === 'object') {
                    // Check if it's {0: {...}, 1: {...}} format
                    const items = Object.values(res).filter(item => 
                        item && typeof item === 'object' && item.icao
                    );
                    station = items.length > 0 ? items[0] : res;
                } else {
                    station = res;
                }
                
                if (!station || !station.latitude || !station.longitude) {
                    throw new Error("Airport not found in database");
                }
                
                console.log('[World Clock] Station found:', station);
                
                // Get timezone from Open-Meteo
                const tzRes = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${station.latitude}&longitude=${station.longitude}&current=temperature_2m&timezone=auto`
                );
                
                if (!tzRes.ok) throw new Error("Timezone API failed");
                
                const tzData = await tzRes.json();
                console.log('[World Clock] Timezone data:', tzData);
                
                if (!tzData.timezone) {
                    throw new Error("Could not determine timezone");
                }
                
                const cityName = station.city || station.name || station.icao;
                const newCity = { 
                    n: cityName, 
                    icao: station.icao, 
                    z: tzData.timezone 
                };
                
                // Check for duplicates
                const exists = cityList.some(c => c.icao === station.icao);
                if (exists) {
                    showToast(`⚠️ ${station.icao} already in list`);
                    input.value = '';
                    return;
                }
                
                cityList.push(newCity);
                localStorage.setItem('efb_cities_v47', JSON.stringify(cityList));
                
                if (shouldBackupCities()) { 
                    await savecitiesToCloud(); 
                    showToast(`✅ ${cityName} added & backed up`); 
                } else { 
                    promptWorldClockBackup(); 
                }
                
                input.value = '';
                updateClock();
                
            } catch(e) { 
                console.error('[World Clock] Error:', e);
                showToast(`❌ Could not add ${val}. Try a valid ICAO code.`);
            } finally {
                btn.innerText = "Add";
                btn.disabled = false;
            }
        }

        async function removeCity(index) {
            if (confirm("Delete this city?")) {
                cityList.splice(index, 1);
                localStorage.setItem('efb_cities_v47', JSON.stringify(cityList));
                if (shouldBackupCities()) await savecitiesToCloud();
                updateClock();
            }
        }

        // ================================================================
        // 19b. ZULU TIME TOGGLE
        // ================================================================
        let showLocalTime = false;

        function toggleTimeDisplay() {
            if (!stationData?.latitude || !meteoDataCache) {
                showToast('⚠️ Search an airport first');
                return;
            }
            showLocalTime = !showLocalTime;
            updateClock();
            
            // Visual feedback
            const badge = document.getElementById('zuluTime');
            badge.style.transform = 'scale(0.95)';
            setTimeout(() => { badge.style.transform = 'scale(1)'; }, 100);
        }
    
        // ================================================================
        // 20. TOOLS — PERSONAL MINIMUMS & E6B
        // ================================================================
        // ================================================================
        // PERSONAL MINIMUMS - PROFILE BASED
        // ================================================================
        const MINS_PROFILES = {
            solo: {
                name: 'SOLO',
                minCeil: 2000,
                minVis: 5,
                maxSteady: 15,
                maxPeak: 15,
                maxGust: 5,
                maxXW: 10,
                ceilXC: 5000  // Cross-country ceiling
            },
            dual: {
                name: 'DUAL',
                minCeil: 1500,
                minVis: 3,
                maxSteady: 25,
                maxPeak: 30,
                maxGust: 10,
                maxXW: 17,
                ceilXC: 3000
            },
            kmhr: {
                name: 'KMHR',
                minCeil: 1500,      // KMHR pattern altitude considerations
                minVis: 3,          // Local area familiarity
                maxSteady: 20,      // Moderate wind tolerance
                maxPeak: 25,        // Peak wind with gust consideration
                maxGust: 8,         // Gust factor for local operations
                maxXW: 15,          // Crosswind for KMHR runways
                ceilXC: 3000,
                useAwos: true       // Flag to indicate AWOS available
            }
        };

        let activeMinsProfile = null;

        function togglePersonalMins() {
            const content = document.getElementById('minsExpandedContent');
            const icon = document.getElementById('minsExpandIcon');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.style.transform = 'rotate(180deg)';
            } else {
                content.style.display = 'none';
                icon.style.transform = 'rotate(0deg)';
            }
        }

        function toggleEvaInfo() {
            const content = document.getElementById('evaInfoContent');
            const icon = document.getElementById('evaInfoIcon');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.style.transform = 'rotate(180deg)';
            } else {
                content.style.display = 'none';
                icon.style.transform = 'rotate(0deg)';
            }
        }

        async function switchMinsProfile(profile) {
            // Safety check - prevent crashes if profile is undefined/null
            if (!profile || typeof profile !== 'string') {
                profile = 'solo';
            }
            
            // Update button states
            const buttons = ['btnProfileSolo', 'btnProfileDual', 'btnProfileKmhr', 'btnProfileCustom'];
            buttons.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.style.background = 'transparent';
                    btn.style.color = 'var(--sub-text)';
                }
            });
            
            const activeBtn = document.getElementById(`btnProfile${profile.charAt(0).toUpperCase() + profile.slice(1)}`);
            if (activeBtn) {
                activeBtn.style.background = 'var(--accent)';
                activeBtn.style.color = '#fff';
            }

            // Show/hide KMHR AWOS notice
            const kmhrNotice = document.getElementById('kmhrAwosNotice');
            const currentIcao = document.getElementById('icao')?.value?.toUpperCase();
            if (kmhrNotice) {
                kmhrNotice.style.display = (profile === 'kmhr' && currentIcao === 'KMHR') ? 'block' : 'none';
            }

            // Show/hide custom inputs
            const customInputs = document.getElementById('minsCustomInputs');
            if (customInputs) {
                customInputs.style.display = profile === 'custom' ? 'block' : 'none';
            }

            // Load profile or custom
            if (profile === 'custom') {
                const saved = await Storage.get('efb_mins_custom');
                if (saved) {
                    activeMinsProfile = typeof saved === 'string' ? JSON.parse(saved) : saved;
                    document.getElementById('customMinCeil').value = activeMinsProfile.minCeil || '';
                    document.getElementById('customMinVis').value = activeMinsProfile.minVis || '';
                    document.getElementById('customMaxSteady').value = activeMinsProfile.maxSteady || '';
                    document.getElementById('customMaxPeak').value = activeMinsProfile.maxPeak || '';
                    document.getElementById('customMaxGust').value = activeMinsProfile.maxGust || '';
                    document.getElementById('customMaxXW').value = activeMinsProfile.maxXW || '';
                } else {
                    activeMinsProfile = { name: 'CUSTOM', minCeil: 1000, minVis: 3, maxSteady: 20, maxPeak: 25, maxGust: 8, maxXW: 15 };
                }
            } else {
                activeMinsProfile = MINS_PROFILES[profile];
            }

            await Storage.set('efb_mins_active_profile', profile);
            updateMinsDisplay();
            checkMins();
        }

        function saveCustomMins() {
            const custom = {
                name: 'CUSTOM',
                minCeil: parseFloat(document.getElementById('customMinCeil').value) || 1000,
                minVis: parseFloat(document.getElementById('customMinVis').value) || 3,
                maxSteady: parseFloat(document.getElementById('customMaxSteady').value) || 20,
                maxPeak: parseFloat(document.getElementById('customMaxPeak').value) || 25,
                maxGust: parseFloat(document.getElementById('customMaxGust').value) || 8,
                maxXW: parseFloat(document.getElementById('customMaxXW').value) || 15
            };
            Storage.set('efb_mins_custom', JSON.stringify(custom));
            activeMinsProfile = custom;
            updateMinsDisplay();
            checkMins();
            
            // Show feedback
            const btn = event.target;
            const orig = btn.innerText;
            btn.innerText = 'SAVED ✓';
            btn.style.background = 'var(--success)';
            setTimeout(() => {
                btn.innerText = orig;
                btn.style.background = 'var(--accent)';
            }, 1500);
        }

        function updateMinsDisplay() {
            if (!activeMinsProfile) return;
            
            document.getElementById('activeMinsProfile').innerText = activeMinsProfile.name;
            document.getElementById('displayMinCeil').innerText = activeMinsProfile.minCeil;
            document.getElementById('displayMinVis').innerText = activeMinsProfile.minVis;
            document.getElementById('displayMaxSteady').innerText = activeMinsProfile.maxSteady;
            document.getElementById('displayMaxPeak').innerText = activeMinsProfile.maxPeak;
            document.getElementById('displayMaxGust').innerText = activeMinsProfile.maxGust;
            document.getElementById('displayMaxXW').innerText = activeMinsProfile.maxXW;
        }

        function checkMins() {
            const card = document.getElementById('minsCard');
            const compactStatus = document.getElementById('minsStatusCompact');
            const detailsDiv = document.getElementById('minsStatusDetails');
            const banner = document.getElementById('minBanner');
            const kmhrNotice = document.getElementById('kmhrAwosNotice');

            // Update KMHR AWOS notice visibility
            const currentIcao = document.getElementById('icao')?.value?.toUpperCase();
            if (kmhrNotice && activeMinsProfile) {
                kmhrNotice.style.display = (activeMinsProfile.name === 'KMHR' && currentIcao === 'KMHR') ? 'block' : 'none';
            }

            // If no profile selected
            if (!activeMinsProfile) {
                compactStatus.innerText = 'TAP TO SET LIMITS';
                compactStatus.style.backgroundColor = '#333';
                compactStatus.style.color = '#aaa';
                card.style.borderLeftColor = '#555';
                banner.className = 'hidden';
                detailsDiv.innerHTML = 'Load airport data to check limits';
                return;
            }

            // If no data loaded
            if (!currentMetar || !stationData) {
                compactStatus.innerText = 'LOAD AIRPORT DATA';
                compactStatus.style.backgroundColor = '#333';
                compactStatus.style.color = '#aaa';
                card.style.borderLeftColor = '#555';
                banner.className = 'hidden';
                detailsDiv.innerHTML = 'Select an airport to check against your minimums';
                return;
            }

            // Calculate actual conditions
            const rwyIdent = document.getElementById('rwySelect').value;
            let actualXW = 0;
            if (rwyIdent && currentWind.dir !== 'VRB') {
                const mv = stationData.magnetic_variation || 0;
                const rwyHdg = parseInt(rwyIdent.replace(/\D/g, '')) * 10;
                const diff = (currentWind.dir - mv - rwyHdg) * (Math.PI / 180);
                const speedForXW = currentWind.gust > 0 ? currentWind.gust : currentWind.spd;
                actualXW = Math.abs(Math.sin(diff) * speedForXW);
            }

            let actualCeil = 9999;
            if (lastMetarObj?.clouds) {
                const cl = lastMetarObj.clouds.find(c => ['BKN','OVC','VV'].includes(c.type));
                if (cl) actualCeil = cl.altitude * 100;
            }

            const actualVis = visToSM(lastMetarObj?.visibility?.value, lastMetarObj?.units?.visibility) ?? 10;
            const actualSteady = currentWind.spd || 0;
            const actualGust = currentWind.gust || 0;
            const actualGustFactor = actualGust > 0 ? (actualGust - actualSteady) : 0;
            const actualPeak = Math.max(actualSteady, actualGust);

            // Check each limit
            const violations = [];
            if (actualCeil < activeMinsProfile.minCeil) violations.push(`Ceiling ${actualCeil}ft < ${activeMinsProfile.minCeil}ft`);
            if (actualVis < activeMinsProfile.minVis) violations.push(`Visibility ${actualVis}SM < ${activeMinsProfile.minVis}SM`);
            if (actualSteady > activeMinsProfile.maxSteady) violations.push(`Steady wind ${Math.round(actualSteady)}kt > ${activeMinsProfile.maxSteady}kt`);
            if (actualPeak > activeMinsProfile.maxPeak) violations.push(`Peak wind ${Math.round(actualPeak)}kt > ${activeMinsProfile.maxPeak}kt`);
            if (actualGustFactor > activeMinsProfile.maxGust) violations.push(`Gust factor ${Math.round(actualGustFactor)}kt > ${activeMinsProfile.maxGust}kt`);
            if (rwyIdent && actualXW > activeMinsProfile.maxXW) violations.push(`Crosswind ${Math.round(actualXW)}kt > ${activeMinsProfile.maxXW}kt`);

            // KMHR-specific note about AWOS
            const kmhrAwosNote = (activeMinsProfile.name === 'KMHR' && currentIcao === 'KMHR') 
                ? '<div style="margin-top:10px; padding:8px; background:rgba(10,132,255,0.08); border-radius:6px; font-size:11px; color:var(--accent);">💡 Live AWOS available - check for most current conditions</div>'
                : '';

            // Update UI
            if (violations.length > 0) {
                compactStatus.innerText = 'NO-GO ⛔';
                compactStatus.style.backgroundColor = 'var(--danger)';
                compactStatus.style.color = '#fff';
                card.style.borderLeftColor = 'var(--danger)';
                
                // Check if NO-GO banner is enabled in settings (use localStorage for immediate sync access)
                const bannerEnabledStr = localStorage.getItem('efb_no_go_banner_enabled');
                const bannerEnabled = bannerEnabledStr === null ? false : bannerEnabledStr === 'true';
                
                if (bannerEnabled) {
                    banner.className = '';
                    banner.innerText = `⚠️ NO-GO: ${violations.length} LIMIT${violations.length > 1 ? 'S' : ''} EXCEEDED`;
                } else {
                    banner.className = 'hidden';
                }
                
                detailsDiv.innerHTML = '<div style="color:var(--danger); font-weight:700; margin-bottom:6px;">❌ VIOLATIONS:</div>' +
                    violations.map(v => `<div style="color:var(--danger);">• ${v}</div>`).join('') +
                    kmhrAwosNote;
            } else {
                compactStatus.innerText = `GO ✅ (${activeMinsProfile.name})`;
                compactStatus.style.backgroundColor = 'var(--success)';
                compactStatus.style.color = '#000';
                card.style.borderLeftColor = 'var(--success)';
                banner.className = 'hidden';
                
                detailsDiv.innerHTML = `
                    <div style="color:var(--success); font-weight:700; margin-bottom:6px;">✅ ALL LIMITS MET</div>
                    <div>• Ceiling: ${actualCeil}ft (min ${activeMinsProfile.minCeil}ft)</div>
                    <div>• Visibility: ${actualVis}SM (min ${activeMinsProfile.minVis}SM)</div>
                    <div>• Steady: ${Math.round(actualSteady)}kt (max ${activeMinsProfile.maxSteady}kt)</div>
                    <div>• Peak: ${Math.round(actualPeak)}kt (max ${activeMinsProfile.maxPeak}kt)</div>
                    <div>• Gust Factor: ${Math.round(actualGustFactor)}kt (max ${activeMinsProfile.maxGust}kt)</div>
                    ${rwyIdent ? `<div>• Crosswind: ${Math.round(actualXW)}kt (max ${activeMinsProfile.maxXW}kt)</div>` : ''}
                ` + kmhrAwosNote;
            }
        }

        // Initialize on load
        window.addEventListener('DOMContentLoaded', async () => {
            const savedProfile = (await Storage.get('efb_mins_active_profile')) || 'solo';
            switchMinsProfile(savedProfile);
        });

        function calcE6B() {
            const uQnh  = document.getElementById('unitQnh').value;
            const uTemp = document.getElementById('unitTemp').value;
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
            if (dewC !== null) { cloudBase = `${Math.max(0, Math.round(((tempC - dewC) / 2.5) * 1000))} ft`; }
            if (tempC > 0) { freezingLvl = `${Math.round(alt + (tempC / 2) * 1000)} ft`; } else { freezingLvl = "Surface"; }

            document.getElementById('resDA').innerText    = `${Math.round(da)} ft`;
            document.getElementById('resTAS').innerText   = `${Math.round(tas)} kt`;
            document.getElementById('resCloud').innerText = cloudBase;
            document.getElementById('resFrz').innerText   = freezingLvl;
            const daEl = document.getElementById('resDA');
            daEl.style.color = da > alt + 2000 ? "var(--warn)" : "var(--accent)";

            // Pressure Altitude
            const paEl = document.getElementById('resPA');
            if (paEl) paEl.innerText = `${Math.round(pa)} ft`;

            // ISA Deviation
            const isaDev = tempC - isaTemp;
            const isaEl  = document.getElementById('resISA');
            if (isaEl) {
                const sign = isaDev >= 0 ? '+' : '';
                isaEl.innerText = `${sign}${isaDev.toFixed(1)}°C`;
                isaEl.style.color = Math.abs(isaDev) > 15 ? 'var(--warn)' : 'var(--text)';
            }
        }

        // ================================================================
        // 20b. FORMULA EXPLANATION MODAL
        // ================================================================

        const FORMULA_CONTENT = {
            pa: {
                title: 'Pressure Altitude',
                body: `<p style="color:var(--sub-text);font-size:13px;line-height:1.6;margin:0 0 14px;">Pressure Altitude is the altitude indicated when the altimeter is set to the standard pressure of <strong>1013.25 hPa (29.92 inHg)</strong>. It is the reference used for density altitude, TAS, and flight levels.</p><div style="background:#111;border-radius:10px;padding:14px 16px;font-family:'SF Mono',monospace;font-size:14px;color:var(--accent);margin-bottom:14px;line-height:2;">PA = Indicated Alt + (1013.25 − QNH) × 30</div><p style="color:var(--sub-text);font-size:12px;line-height:1.5;margin:0;">QNH in hPa. The <strong>30 ft/hPa</strong> factor is the standard pressure lapse rate near sea level. QNH below 1013 → PA above indicated altitude. QNH above 1013 → PA below indicated altitude.</p>`
            },
            da: {
                title: 'Density Altitude',
                body: `<p style="color:var(--sub-text);font-size:13px;line-height:1.6;margin:0 0 14px;">Density Altitude is Pressure Altitude corrected for non-standard temperature. It represents the altitude at which current air density exists in the ISA model. High DA = aircraft performs as if at a higher altitude.</p><div style="background:#111;border-radius:10px;padding:14px 16px;font-family:'SF Mono',monospace;font-size:13px;color:var(--accent);margin-bottom:14px;line-height:2.2;">ISA Temp = 15 − (2 × PA / 1000)<br>DA = PA + 120 × (OAT − ISA Temp)</div><p style="color:var(--sub-text);font-size:12px;line-height:1.5;margin:0 0 10px;"><strong>120 ft/°C</strong> is the standard approximation. Each degree above ISA adds ~120 ft of density altitude.</p><p style="color:#ff9f0a;font-size:12px;line-height:1.5;margin:0;">⚠️ METAR GO highlights DA in orange when it exceeds field elevation by more than 2,000 ft.</p>`
            },
            isa: {
                title: 'ISA Deviation',
                body: `<p style="color:var(--sub-text);font-size:13px;line-height:1.6;margin:0 0 14px;">ISA Deviation tells you how much warmer or colder the actual air is compared to the standard atmosphere at your pressure altitude.</p><div style="background:#111;border-radius:10px;padding:14px 16px;font-family:'SF Mono',monospace;font-size:14px;color:var(--accent);margin-bottom:14px;line-height:2.2;">ISA Temp = 15 − (2 × PA / 1000)<br>ISA Dev = OAT − ISA Temp</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;"><div style="background:#111;border-radius:8px;padding:10px;font-size:12px;"><div style="color:var(--sub-text);margin-bottom:4px;">ISA Standard</div><div style="color:#fff;font-weight:700;">SL: 15°C</div><div style="color:#fff;font-weight:700;">2,000 ft: 11°C</div><div style="color:#fff;font-weight:700;">5,000 ft: 5°C</div><div style="color:#fff;font-weight:700;">10,000 ft: −5°C</div></div><div style="background:#111;border-radius:8px;padding:10px;font-size:12px;color:var(--sub-text);line-height:1.6;"><strong style="color:#fff;">ISA+10</strong> = 10°C warmer than standard<br><br><strong style="color:#fff;">ISA−10</strong> = 10°C colder than standard</div></div><p style="color:var(--sub-text);font-size:12px;line-height:1.5;margin:0;">Positive ISA Dev → less dense air → higher DA → reduced performance. Lapse rate: <strong>−2°C per 1,000 ft</strong>.</p>`
            },
            tas: {
                title: 'True Airspeed (TAS)',
                body: `<p style="color:var(--sub-text);font-size:13px;line-height:1.6;margin:0 0 14px;">TAS is your actual speed through the air mass. IAS decreases relative to TAS as altitude increases because the air is less dense.</p><div style="background:#111;border-radius:10px;padding:14px 16px;font-family:'SF Mono',monospace;font-size:14px;color:var(--accent);margin-bottom:14px;line-height:2;">TAS ≈ IAS × (1 + 0.02 × Alt / 1,000)</div><p style="color:var(--sub-text);font-size:12px;line-height:1.5;margin:0;">The <strong>2% rule</strong>: TAS increases by ~2% per 1,000 ft. At 10,000 ft, TAS is roughly 20% higher than IAS.</p>`
            },
            cloudbase: {
                title: 'Cloud Base (AGL)',
                body: `<p style="color:var(--sub-text);font-size:13px;line-height:1.6;margin:0 0 14px;">Estimated using the temperature/dewpoint spread — the <strong>Lifted Condensation Level (LCL)</strong> approximation.</p><div style="background:#111;border-radius:10px;padding:14px 16px;font-family:'SF Mono',monospace;font-size:14px;color:var(--accent);margin-bottom:14px;line-height:2;">Cloud Base ≈ (Temp − Dewpoint) / 2.5 × 1,000 ft</div><p style="color:var(--sub-text);font-size:12px;line-height:1.5;margin:0;"><strong>2.5°C spread = 1,000 ft AGL.</strong> Valid for surface-based convective clouds. Less accurate for stratiform layers. Requires dewpoint input.</p>`
            },
            frz: {
                title: 'Freezing Level',
                body: `<p style="color:var(--sub-text);font-size:13px;line-height:1.6;margin:0 0 14px;">The altitude at which temperature drops to 0°C. Above this level, liquid water droplets can freeze on contact with the aircraft.</p><div style="background:#111;border-radius:10px;padding:14px 16px;font-family:'SF Mono',monospace;font-size:14px;color:var(--accent);margin-bottom:14px;line-height:2;">Frz Lvl ≈ Alt + (OAT / 2) × 1,000 ft</div><p style="color:var(--sub-text);font-size:12px;line-height:1.5;margin:0 0 10px;">Standard lapse rate <strong>2°C per 1,000 ft</strong>. OAT = 20°C → freezing level ~10,000 ft AGL.</p><p style="color:#ff453a;font-size:12px;margin:0;">⚠️ If OAT ≤ 0°C, freezing level is at the surface.</p>`
            }
        };

        function showFormulaModal(key) {
            const data = FORMULA_CONTENT[key];
            if (!data) return;
            const modal = document.getElementById('formula-modal');
            const sheet = document.getElementById('formula-modal-sheet');
            const body  = document.getElementById('formula-modal-body');
            if (!modal || !sheet || !body) return;
            body.innerHTML = `<div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:14px;padding-right:32px;">${data.title}</div>${data.body}`;
            modal.style.display = 'flex';
            sheet.getBoundingClientRect();
            sheet.style.transform = 'translateY(0)';
        }

        function closeFormulaModal() {
            const modal = document.getElementById('formula-modal');
            const sheet = document.getElementById('formula-modal-sheet');
            if (!modal || !sheet) return;
            sheet.style.transform = 'translateY(100%)';
            setTimeout(() => { modal.style.display = 'none'; }, 320);
        }

        // ================================================================
        // 21. COCKPIT TIMER
        // ================================================================
        let fuelInterval  = null;
        let fuelSeconds   = 1800;
        let fuelStartValue = 1800;
        let isFuelRunning = false;

        function setFuelTime(minutes) {
            if (isFuelRunning) toggleFuelTimer();
            fuelStartValue = minutes * 60; fuelSeconds = fuelStartValue;
            updateFuelDisplay();
            document.querySelectorAll('#btnFuel15,#btnFuel30,#btnFuel45,#btnFuel60').forEach(b => b.classList.remove('active-fuel'));
            document.getElementById(`btnFuel${minutes}`)?.classList.add('active-fuel');
            resetFuelVisuals();
        }

        function toggleFuelTimer() {
            const btn = document.getElementById('btnFuelStart');
            if (isFuelRunning) {
                clearInterval(fuelInterval); isFuelRunning = false;
                btn.innerText = "RESUME"; btn.style.background = "var(--warn)";
            } else {
                isFuelRunning = true; btn.innerText = "PAUSE"; btn.style.background = "var(--mvfr)";
                fuelInterval = setInterval(() => {
                    if (fuelSeconds > 0) { fuelSeconds--; updateFuelDisplay(); }
                    else { clearInterval(fuelInterval); isFuelRunning = false; fuelAlert(); }
                }, 1000);
            }
        }

        function resetFuelTimer() {
            clearInterval(fuelInterval); isFuelRunning = false;
            fuelSeconds = fuelStartValue; resetFuelVisuals(); updateFuelDisplay();
        }

        function resetFuelVisuals() {
            document.getElementById('btnFuelStart').innerText = "START";
            document.getElementById('btnFuelStart').style.background = "var(--success)";
            document.getElementById('fuelCard').style.background = "var(--card-bg)";
            document.getElementById('fuelDisplay').style.color = "var(--text)";
        }

        function updateFuelDisplay() {
            const m = Math.floor(fuelSeconds / 60).toString().padStart(2, '0');
            const s = (fuelSeconds % 60).toString().padStart(2, '0');
            document.getElementById('fuelDisplay').innerText = `${m}:${s}`;
        }

        function fuelAlert() {
            document.getElementById('fuelCard').style.background = "var(--danger)";
            document.getElementById('fuelDisplay').innerText = "CHECK";
            document.getElementById('fuelDisplay').style.color = "#fff";
            if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
        }

        // ================================================================
        // 22. SUN TIMES (NOAA Algorithm)
        // ================================================================
        function getSunTimes(lat, lon) {
            const date = new Date();
            const lw   = -lon * Math.PI / 180;
            const phi  = lat * Math.PI / 180;
            const d    = Math.floor(date.getTime() / 86400000) - 10957.5;
            const M    = (357.5291 + 0.98560028 * d) * Math.PI / 180;
            const C    = (1.9148 * Math.sin(M) + 0.0200 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) * Math.PI / 180;
            const L    = (M + C + 102.9372 * Math.PI / 180 + Math.PI) % (2 * Math.PI);
            const sinDec = 0.39779 * Math.sin(L);
            const dec    = Math.asin(sinDec);
            const cosDec = Math.sqrt(1 - sinDec * sinDec);
            const y  = Math.tan(23.4397 * Math.PI / 180 / 2);
            const yy = y * y;
            const J_time = (yy * Math.sin(2 * L) - 2 * 0.01671 * Math.sin(M) + 4 * 0.01671 * yy * Math.sin(M) * Math.cos(2 * L) - 0.5 * yy * yy * Math.sin(4 * L) - 1.25 * 0.01671 * 0.01671 * Math.sin(2 * M)) * 180 / Math.PI * 4;
            const cosH = (Math.sin(-0.833 * Math.PI / 180) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * cosDec);
            if (cosH > 1 || cosH < -1) return { sunrise: "--:--", sunset: "--:--", rawRise: 0, rawSet: 0 };
            const H            = Math.acos(cosH) * 180 / Math.PI;
            const noonUTC      = 720 - 4 * lon - J_time;
            const riseMinutes  = noonUTC - H * 4;
            const setMinutes   = noonUTC + H * 4;

            function fmt(minutesUTC) {
                if (isNaN(minutesUTC)) return "--:--";
                let ts = new Date();
                ts.setUTCHours(0); ts.setUTCMinutes(0); ts.setUTCSeconds(0);
                let timeStamp = ts.getTime() + (minutesUTC * 60 * 1000);
                if (showLocalSun) timeStamp += (stationOffsetSec * 1000);
                const finalDate = new Date(timeStamp);
                const str = finalDate.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false });
                return str + (showLocalSun ? 'L' : 'Z');
            }
            return { sunrise: fmt(riseMinutes), sunset: fmt(setMinutes), rawRise: riseMinutes / 60, rawSet: setMinutes / 60 };
        }

        function toggleSunFormat() { showLocalSun = !showLocalSun; updateSunDisplay(); }

        function updateSunDisplay() {
            if (!stationData) return;
            const s = getSunTimes(stationData.latitude, stationData.longitude);
            document.getElementById('infoSun').innerText = `🌅 ${s.sunrise}  🌇 ${s.sunset}`;
        }

        // ================================================================
        // 23. FORMATTING HELPERS
        // ================================================================
        function formatRawMetar(rawText) {
            if (!rawText) return "";
            let html = rawText;
            html = html.replace(/(G\d{2,3}KT)/g, '<span style="color:var(--danger);font-weight:800;">$1</span>');
            html = html.replace(/(\s)(M?(\d\/\d|[0-2]))(SM)/g, '$1<span style="color:var(--lifr);font-weight:800;">$2$4</span>');
            html = html.replace(/(VV\d{3}|OVC00[0-4])/g, '<span style="color:var(--danger);font-weight:800;">$1</span>');
            html = html.replace(/(\s)(\+?\w*TS\w*|\+RA|\+SN|SQ|FC)(\s|$)/g, '$1<span style="color:var(--warn);font-weight:800;">$2</span>$3');
            return html;
        }

        function formatNotamText(raw) {
            if (!raw) return "";
            let h = raw;
            h = h.replace(/\b(CLSD|CLOSED|U\/S|UNSERVICEABLE)\b/g, '<span class="n-crit">$1</span>');
            h = h.replace(/\b(OBST|OBSTACLE|WORK|WIP|DANGER|CAUTION|FUGRO)\b/g, '<span class="n-warn">$1</span>');
            h = h.replace(/\b(RWY|TWY|RUNWAY|TAXIWAY|APRON|TWR)\b/g, '<span class="n-bold">$1</span>');
            return h;
        }

        // ================================================================
        // 24. UI HELPERS
        // ================================================================
        // ── Theme engine ──
        const THEME_CLASSES = {
            default:    null,
            cockpit:    'cockpit-dark',
            sectional:  'theme-sectional',
            ifr:        'theme-ifr',
            phosphor:   'theme-phosphor',
            contrast:   'theme-contrast',
        };

        const THEME_SWATCH_COLORS = {
            default:   '#0a84ff',
            cockpit:   '#ff0000',
            sectional: '#c49a3c',
            ifr:       '#4a9eff',
            phosphor:  '#00ff41',
            contrast:  '#ffffff',
        };

        function setTheme(name) {
            if (!THEME_CLASSES.hasOwnProperty(name)) name = 'default';

            // Remove all theme classes
            Object.values(THEME_CLASSES).forEach(cls => {
                if (cls) document.body.classList.remove(cls);
            });

            // Apply selected theme class
            const cls = THEME_CLASSES[name];
            if (cls) document.body.classList.add(cls);

            // Update dropdown & swatch
            const sel = document.getElementById('themeSelect');
            if (sel) sel.value = name;
            const swatch = document.getElementById('themeSwatch');
            if (swatch) swatch.style.background = THEME_SWATCH_COLORS[name] || '#0a84ff';

            // Persist
            Storage.set('efb_theme', name);

            // Redraw wind rose if active
            if (document.getElementById('rwySelect')?.value) drawWindRose();
        }

        async function initTheme() {
            // Migrate from old night-mode key
            const legacy = localStorage.getItem('efb_night_mode');
            const saved  = await Storage.get('efb_theme');

            if (!saved && legacy === 'true') {
                setTheme('cockpit');
                localStorage.removeItem('efb_night_mode');
                return;
            }

            setTheme(saved || 'default');
        }

        function setTab(name) {
                    // Scroll content area back to top on every tab switch
                    const scroller = document.getElementById('content-scroll');
                    if (scroller) scroller.scrollTop = 0;

                    document.querySelectorAll('.view-section').forEach(el => {
                        el.classList.remove('active');
                        el.style.display = '';
                    });
                    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
                    const targetSection = document.getElementById('tab-' + name);
                    if (targetSection) {
                        targetSection.classList.remove('hidden');
                        targetSection.classList.add('active');
                    }
                    document.querySelectorAll('.tab').forEach(t => {
                        if (t.getAttribute('onclick')?.includes("'" + name + "'")) {
                            t.classList.add('active');
                            // ← ADD THIS: scroll tab pill into view on mobile
                            t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }

                    });
                    if (name === 'world') updateClock();
                    if (name === 'taf' && meteoDataCache) setTimeout(() => drawMeteogram(meteoDataCache), 50);
                    // Redraw wind rose after tab is visible — iOS Safari discards canvas draws on hidden elements
                    if (name === 'metar') setTimeout(() => { if (document.getElementById('rwySelect').value) drawWindRose(); }, 50);
                    if (name === 'weather') setTimeout(() => {
                        if (document.getElementById('rwySelect').value) drawWindRose();
                        drawWindRoseOnCanvas('windRose2');
                    }, 50);
                }

        async function checkMultiDashboardEnabled() {
                    const enabled = await Storage.get('efb_multi_dashboard_enabled', false);
                    const toggle = document.getElementById('toggleMultiDashboard');
                    if (toggle) toggle.checked = !!enabled;
                    applyDashboardMode(!!enabled);
                    if (enabled) {
                        await loadMultiAirports();
                        if (multiRefreshInterval) clearInterval(multiRefreshInterval);
                        if (multiAirports.length > 0) {
                            multiRefreshInterval = setInterval(refreshMultiData, 300000);
                        }
                    }
                }

        async function checkNoGoBannerEnabled() {
                    const enabled = await Storage.get('efb_no_go_banner_enabled', false); // Default to false
                    const toggle = document.getElementById('toggleNoGoBanner');
                    if (toggle) toggle.checked = !!enabled;
                }
        
        async function toggleMultiDashboard() {
            const toggle  = document.getElementById('toggleMultiDashboard');
            const enabled = toggle?.checked || false;
            await Storage.set('efb_multi_dashboard_enabled', enabled);
            applyDashboardMode(enabled);
            if (enabled) {
                setTab('dashboard');
                await loadMultiAirports();
                showToast('📊 Dashboard enabled');
                if (!multiRefreshInterval && multiAirports.length > 0) {
                    multiRefreshInterval = setInterval(refreshMultiData, 300000);
                }
            } else {
                setTab('metar');
                if (multiRefreshInterval) {
                    clearInterval(multiRefreshInterval);
                    multiRefreshInterval = null;
                }
                showToast('Dashboard disabled');
            }
        
            // Redraw wind rose onto the correct canvas after tab switch settles
            if (stationData) {
                setTimeout(() => {
                    drawWindRose();
                    renderRunwaysComplex();
                }, 100);
            }
        }

        async function toggleNoGoBanner() {
            const toggle  = document.getElementById('toggleNoGoBanner');
            const enabled = toggle?.checked || false;
            const banner  = document.getElementById('minBanner');
            
            // Write to both Storage (cloud/IndexedDB) AND localStorage so
            // the synchronous checkMins() read is always in sync
            localStorage.setItem('efb_no_go_banner_enabled', String(enabled));
            await Storage.set('efb_no_go_banner_enabled', enabled);
            
            // Immediately update banner visibility
            if (banner) {
                if (enabled) {
                    // Re-check minimums to show banner if needed
                    if (typeof checkMins === 'function') {
                        checkMins();
                    }
                } else {
                    // Immediately hide banner
                    banner.className = 'hidden';
                }
            }
            
            showToast(enabled ? '⚠️ NO-GO banner enabled' : 'NO-GO banner disabled');
        }
    
        function applyDashboardMode(enabled) {
            const tabMetar     = document.getElementById('tabMetar');
            const tabTaf       = document.getElementById('tabTaf');
            const tabDashboard = document.getElementById('tabDashboard');
            const tabWeather   = document.getElementById('tabWeather');
        
            if (enabled) {
                tabMetar?.classList.add('hidden');
                tabTaf?.classList.add('hidden');
                tabDashboard?.classList.remove('hidden');
                tabWeather?.classList.remove('hidden');
            } else {
                tabMetar?.classList.remove('hidden');
                tabTaf?.classList.remove('hidden');
                tabDashboard?.classList.add('hidden');
                tabWeather?.classList.add('hidden');
            }
            // ── NEW: show/hide Dashboard Card Style section in Settings ──
            const cardSection = document.getElementById('dashCardStyleSection');
            if (cardSection) {
                enabled
                    ? cardSection.classList.remove('hidden')
                    : cardSection.classList.add('hidden');
            }
            
        }
        
        function switchWeatherPane(pane) {
            const metarPane = document.getElementById('weather-metar-pane');
            const tafPane   = document.getElementById('weather-taf-pane');
            const pillMetar = document.getElementById('pillMetar');
            const pillTaf   = document.getElementById('pillTaf');
            if (!metarPane || !tafPane) return;
        
            if (pane === 'taf') {
                metarPane.style.display = 'none';
                tafPane.style.display   = '';
                pillMetar?.classList.remove('active');
                pillTaf?.classList.add('active');
                if (meteoDataCache) setTimeout(() => drawMeteogram(meteoDataCache, 'meteoCanvas2'), 120);
            } else {
                tafPane.style.display   = 'none';
                metarPane.style.display = '';
                pillTaf?.classList.remove('active');
                pillMetar?.classList.add('active');
            }
        }
        
        // Mirror all METAR/TAF render calls to the weather tab duplicates
        function mirrorToWeatherTab() {
            const enabled = document.getElementById('toggleMultiDashboard')?.checked;
            if (!enabled) return;
        
            // Mirror simple text fields
            const mirrors = [
                ['mWind','mWind2'], ['mVis','mVis2'], ['mCeil','mCeil2'],
                ['mAlt','mAlt2'], ['mTempC','mTempC2'], ['mTempF','mTempF2'],
                ['mAge','mAge2'], ['mSpread','mSpread2'], ['mHumidity','mHumidity2'],
                ['mWx','mWx2'], ['mSpeciBadge','mSpeciBadge2'],
                ['rawMetar','rawMetar2'], ['rawTaf','rawTaf2'],
                ['frMessage','frMessage2'], ['labelCeilVal','labelCeilVal2'],
                ['labelVisVal','labelVisVal2'], ['tafIssued','tafIssued2'],
                ['notamList','notamList2'], ['sigairmetList','sigairmetList2']
            ];
            mirrors.forEach(([orig, copy]) => {
                const o = document.getElementById(orig);
                const c = document.getElementById(copy);
                if (o && c) { c.innerHTML = o.innerHTML; c.style.cssText = o.style.cssText; }
            });
        
            // Mirror gauge widths and colors
            const gauges = [['gaugeCeil','gaugeCeil2'],['gaugeVis','gaugeVis2']];
            gauges.forEach(([orig, copy]) => {
                const o = document.getElementById(orig);
                const c = document.getElementById(copy);
                if (o && c) { c.style.width = o.style.width; c.style.backgroundColor = o.style.backgroundColor; }
            });
        
            // Mirror sky layers
            const sky1 = document.getElementById('skyLayersContainer');
            const sky2 = document.getElementById('skyLayersContainer2');
            if (sky1 && sky2) sky2.innerHTML = sky1.innerHTML;
        
            // Mirror runway select
            const r1 = document.getElementById('rwySelect');
            const r2 = document.getElementById('rwySelect2');
            if (r1 && r2) { r2.innerHTML = r1.innerHTML; r2.value = r1.value; }
        
            // Mirror AWOS button
            const b1 = document.getElementById('btnFetchLive');
            const b2 = document.getElementById('btnFetchLive2');
            if (b1 && b2) { b2.className = b1.className; }
        
            // Mirror TAF detail card
            const tafFields = [['tdTime','tdTime2'],['tdType','tdType2'],
                               ['tdWind','tdWind2'],['tdVis','tdVis2'],
                               ['tdWx','tdWx2'],['tdCloud','tdCloud2'],
                               ['tafBar','tafBar2'],['tafAxis','tafAxis2'],
                               ['tafSkyStrip','tafSkyStrip2']];
            tafFields.forEach(([orig, copy]) => {
                const o = document.getElementById(orig);
                const c = document.getElementById(copy);
                if (o && c) { c.innerHTML = o.innerHTML; c.style.cssText = o.style.cssText; }
            });

            // Mirror TAF needle (NOW indicator)
            const needle1 = document.getElementById('tafNeedle');
            const needle2 = document.getElementById('tafNeedle2');
            if (needle1 && needle2) {
                needle2.style.display = needle1.style.display;
                needle2.style.left    = needle1.style.left;
            }
            
            // Mirror wind rose values
            ['valHW','valXW'].forEach(id => {
                const o = document.getElementById(id);
                const c = document.getElementById(id + '2');
                if (o && c) { c.innerHTML = o.innerHTML; c.style.color = o.style.color; }
            });
        
            // Redraw wind rose on weather tab canvas
            const r2sel = document.getElementById('rwySelect2');
            if (r2sel) drawWindRoseOnCanvas('windRose2');
        }
    
        function updateHeaderCat(status, colorClass) {
            const badge = document.getElementById('headerCat');
            badge.innerText = status; badge.className = 'badge badge-cat ' + colorClass;
        }

        function toggleClearBtn() {
            const val = document.getElementById('icao').value;
            document.getElementById('clearBtn').style.display = val ? 'block' : 'none';
        }

        function clearSearch() {
            document.getElementById('icao').value = '';
            document.getElementById('icao').focus();
            toggleClearBtn();
        }

        // ================================================================
        // 25. AWOS MODAL
        // ================================================================
        function openAwosModal() {
            const modal  = document.getElementById('awosModal');
            const iframe = document.getElementById('awosFrame');
            if (!modal || !iframe) { console.error('AWOS modal elements not found'); return; }
            modal.classList.add('active');
            iframe.srcdoc = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:-apple-system,sans-serif;flex-direction:column;gap:16px;"><div style="width:40px;height:40px;border:3px solid #333;border-top-color:#0a84ff;border-radius:50%;animation:spin 1s linear infinite;"></div><div style="color:#8e8e93;font-size:13px;">Loading KMHR Live Sensor...</div><style>@keyframes spin{to{transform:rotate(360deg);}}</style></div>`;
            fetch('/api/awos')
                .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
                .then(html => { iframe.srcdoc = html; })
                .catch(error => {
                    iframe.srcdoc = `<div style="padding:40px 20px;text-align:center;font-family:-apple-system,sans-serif;background:#000;color:#fff;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;"><div style="font-size:48px;">⚠️</div><div style="font-size:18px;font-weight:700;">Unable to Load Live Sensor</div><div style="color:#8e8e93;font-size:13px;max-width:280px;">${error.message}<br><br>The KMHR sensor website may be offline or unreachable.</div><a href="http://kmhr.awosnet.com/text.php" target="_blank" style="background:#0a84ff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">Open KMHR.net Directly ↗</a></div>`;
                });
        }

        function closeAwosModal() {
            const modal = document.getElementById('awosModal');
            modal.classList.remove('active');
            setTimeout(() => { document.getElementById('awosFrame').srcdoc = ''; }, 300);
        }

        /* ── Detect US airport & derive local code ── */
        function isUSAirport(icao) {
            // US airports typically begin with K, P (Pacific), or have country US
            if (!icao) return false;
            if (stationData?.country === 'US') return true;
            return /^K[A-Z0-9]{3}$/i.test(icao) ||
                   /^P[A,F,G,H,J,K,L,M,O][A-Z0-9]{2}$/i.test(icao); // Alaska/Pacific prefixes
        }
        
        function getLocalCode(icao, iata) {
            // For standard K airports: KMHR → MHR
            if (icao && icao.length === 4 && icao[0].toUpperCase() === 'K') {
                return icao.slice(1).toUpperCase();
            }
            // Fallback to IATA, then ICAO
            return (iata || icao || '').toUpperCase();
        }
        
        /* ── Build URLs for current airport ── */
        function getUSLinks() {
            const icao  = (document.getElementById('icao').value || '').trim().toUpperCase();
            const iata  = stationData?.iata || '';
            const local = getLocalCode(icao, iata);
        
            return {
                airnav:        `https://www.airnav.com/airport/${local}`,
                ifpAirport:    `https://www.iflightplanner.com/Airports/${icao}`,
                ifpVFR:        `https://www.iflightplanner.com/AviationCharts/?Map=Sectional&L=${local}&MPA=AeroWeather`,
                ifpIFR:        `https://www.iflightplanner.com/AviationCharts/?Map=IFRLOW&L=${local}&MPA=AeroWeather`,
                flightservice: `https://www.1800wxbrief.com/Website/AirportInfo?idFromMenu=${local}`
            };
        }
        
        /* ── Track current modal type for Open ↗ button ── */
        let _usLinkType = null;
        let _ifpActiveTab = 'airport';

        async function openInAppBrowser(url, title) {
            const modal   = document.getElementById('usLinkModal');
            const frame   = document.getElementById('usLinkFrame');
            const loader  = document.getElementById('usLinkLoader');
            const tabs    = document.getElementById('iflightplannerTabs');
            const titleEl = document.getElementById('usLinkModalTitle');
            const openBtn = document.getElementById('usLinkOpenExternal');

            _usLinkType = 'generic';
            tabs.style.display   = 'none';
            titleEl.innerText    = title;
            loader.style.display = 'flex';
            frame.src            = 'about:blank';

            openBtn.onclick = () => window.open(url, '_blank');
            modal.classList.add('active');

            // Check if the URL allows iframe embedding before loading
            try {
                const resp = await fetch(`/api/check-frame?url=${encodeURIComponent(url)}`);
                const data = await resp.json();
                if (!data.embeddable) {
                    loader.style.display = 'none';
                    const safeUrl  = url.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
                    const safeText = url.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                    frame.srcdoc = `<html><body style="margin:0;background:#000;display:flex;flex-direction:column;
                        align-items:center;justify-content:center;height:100vh;
                        font-family:-apple-system,sans-serif;text-align:center;padding:30px;
                        box-sizing:border-box;">
                        <div style="font-size:48px;margin-bottom:16px;">🔒</div>
                        <div style="font-size:17px;font-weight:800;color:#fff;margin-bottom:10px;">
                            Cannot display in-app
                        </div>
                        <div style="font-size:13px;color:#8e8e93;line-height:1.7;max-width:280px;margin-bottom:28px;">
                            This site blocks embedded viewing for security reasons.
                            Tap the button below to open it in your browser.
                        </div>
                        <a href="${safeUrl}" target="_blank"
                           style="background:#0a84ff;color:#fff;padding:13px 28px;
                                  border-radius:12px;text-decoration:none;
                                  font-size:15px;font-weight:800;display:inline-block;">
                            Open in Browser ↗
                        </a>
                        <div style="margin-top:16px;font-size:11px;color:#444;">${safeText}</div>
                    </body></html>`;
                    return;
                }
            } catch (e) {
                // Check failed — proceed with loading anyway; the iframe will show its own error
            }

            // Small delay so 'about:blank' clears the previous page visually
            setTimeout(() => { frame.src = url; }, 80);
        }
    
        function openUsLink(type) {
            _usLinkType  = type;
            _ifpActiveTab = 'airport';
        
            const modal   = document.getElementById('usLinkModal');
            const frame   = document.getElementById('usLinkFrame');
            const loader  = document.getElementById('usLinkLoader');
            const tabs    = document.getElementById('iflightplannerTabs');
            const title   = document.getElementById('usLinkModalTitle');
            const openBtn = document.getElementById('usLinkOpenExternal');
        
            const links = getUSLinks();
        
            // Reset loader
            loader.style.display = 'flex';
            frame.src = 'about:blank';
        
            if (type === 'iflightplanner') {
                tabs.style.display = 'block';
                title.innerText    = 'iFlightPlanner';
                frame.src          = links.ifpAirport;
                openBtn.onclick    = () => window.open(links.ifpAirport, '_blank');
                // Reset tab pill styles
                switchIFPTab('airport', false); // false = don't reload (we just set src above)
            } else if (type === 'airnav') {
                openInAppBrowser(links.airnav, 'AirNav');
                return; // openInAppBrowser handles modal.classList.add itself
            } else if (type === 'flightservice') {
                // 1800wxbrief blocks iframes — show a friendly fallback instead
                tabs.style.display = 'none';
                title.innerText    = 'FlightService (1800wxbrief)';
                openBtn.onclick    = () => window.open(links.flightservice, '_blank');
                loader.style.display = 'none';
                frame.srcdoc = `
                    <html>
                    <body style="margin:0;background:#000;display:flex;flex-direction:column;
                                 align-items:center;justify-content:center;height:100vh;
                                 font-family:-apple-system,sans-serif;text-align:center;padding:30px;
                                 box-sizing:border-box;">
                        <div style="font-size:48px;margin-bottom:16px;">🛡️</div>
                        <div style="font-size:17px;font-weight:800;color:#fff;margin-bottom:10px;">
                            Cannot display in-app
                        </div>
                        <div style="font-size:13px;color:#8e8e93;line-height:1.7;max-width:280px;
                                    margin-bottom:28px;">
                            1800wxbrief.com blocks embedded viewing for security reasons.
                            Tap the button below to open it in your browser.
                        </div>
                        <a href="${links.flightservice}" target="_blank"
                           style="background:#0a84ff;color:#fff;padding:13px 28px;
                                  border-radius:12px;text-decoration:none;
                                  font-size:15px;font-weight:800;display:inline-block;">
                            Open FlightService ↗
                        </a>
                        <div style="margin-top:16px;font-size:11px;color:#444;">
                            ${links.flightservice}
                        </div>
                    </body>
                    </html>`;
                modal.classList.add('active');
                return;
            }
        
            modal.classList.add('active');
        }
        
        function switchIFPTab(tab, loadFrame = true) {
            _ifpActiveTab = tab;
            const links   = getUSLinks();
            const openBtn = document.getElementById('usLinkOpenExternal');
        
            // Tab pill styles
            const tabIds = { airport: 'iFPTabAirport', vfr: 'iFPTabVFR', ifr: 'iFPTabIFR' };
            Object.entries(tabIds).forEach(([key, id]) => {
                const el = document.getElementById(id);
                if (!el) return;
                const active = key === tab;
                el.style.background = active ? 'var(--accent)' : 'transparent';
                el.style.color      = active ? '#fff' : 'var(--sub-text)';
            });
        
            const urlMap = {
                airport: links.ifpAirport,
                vfr:     links.ifpVFR,
                ifr:     links.ifpIFR
            };
            const url = urlMap[tab] || links.ifpAirport;
            openBtn.onclick = () => window.open(url, '_blank');
        
            if (loadFrame) {
                document.getElementById('usLinkLoader').style.display = 'flex';
                document.getElementById('usLinkFrame').src = url;
            }
        }
        
        function closeUsLinkModal() {
            document.getElementById('usLinkModal').classList.remove('active');
            // Blank the frame so audio/video stops
            setTimeout(() => {
                document.getElementById('usLinkFrame').src = 'about:blank';
            }, 250);
        }
        
        
        /* ── Show/hide US airport section in ATC tab ── */
        function updateUSAirportLinks(icao) {
            const section = document.getElementById('usAirportLinks');
            if (!section) return;
            if (isUSAirport(icao)) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        }
        
        
        /* ── Show source footers and stamp fetch time ── */
        function showSourceFooters() {
            const icao = (document.getElementById('icao').value || '').trim().toUpperCase();
            if (!icao) return;
        
            const now    = new Date();
            const timeZ  = `${now.getUTCHours().toString().padStart(2,'0')}:${now.getUTCMinutes().toString().padStart(2,'0')}Z`;
        
            ['metarSourceFooter','tafSourceFooter',
             'weatherMetarSourceFooter','weatherTafSourceFooter'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('hidden');
            });
        
            const timeEls = ['metarSourceTime','tafSourceTime'];
            timeEls.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = timeZ;
            });
        }

        // ================================================================
        // WELCOME OVERLAY
        // ================================================================
        function showWelcomeOverlay() {
            const overlay = document.getElementById('welcomeOverlay');
            if (!overlay) return;
        
            // Position top flush with the bottom of the tabs bar
            const tabs = document.querySelector('.tabs');
            if (tabs) {
                overlay.style.top = tabs.getBoundingClientRect().bottom + 'px';
            } else {
                overlay.style.top = '108px';
            }
            overlay.classList.remove('hidden');
            overlay.style.opacity = '0';
            requestAnimationFrame(() => { overlay.style.opacity = '1'; });
        }
        
        function dismissWelcomeOverlay() {
            const overlay = document.getElementById('welcomeOverlay');
            if (!overlay) return;
            overlay.style.opacity = '0';
            setTimeout(() => overlay.classList.add('hidden'), 400);
            // Remember so it doesn't reappear on tab switches
            sessionStorage.setItem('welcome_dismissed', '1');
        }
        
        // Reposition on resize (e.g. device rotation)
        window.addEventListener('resize', () => {
            const overlay = document.getElementById('welcomeOverlay');
            if (!overlay || overlay.classList.contains('hidden')) return;
            const tabs = document.querySelector('.tabs');
            if (tabs) overlay.style.top = tabs.getBoundingClientRect().bottom + 'px';
        });
    
        // ================================================================
        // 26. TOAST & OFFLINE BANNER
        // ================================================================
        function showToast(message, duration = 3000) {
            document.querySelector('.toast-msg')?.remove();
            const toast = document.createElement('div');
            toast.className = 'toast-msg'; toast.innerText = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), duration);
        }

        function retryOnline() {
            if (navigator.onLine) { loadData(true); hideOfflineBanner(); }
        }

        function showOfflineBanner(ts) {
            const ageMin = Math.round((Date.now() - ts) / 60000);
            const ageStr = ageMin < 1  ? 'just now'
                         : ageMin < 60 ? `${ageMin}m ago`
                         : `${Math.round(ageMin / 60)}h ago`;

            const banner = document.getElementById('offlineBanner');
            if (!banner) return;

            banner.innerHTML = `
                <span>⚡ OFFLINE MODE</span>
                <span style="margin:0 8px;opacity:0.3;">|</span>
                <span>Showing cached data · ${ageStr}</span>
                <span style="margin-left:8px;background:rgba(0,0,0,0.25);padding:2px 10px;border-radius:10px;font-size:10px;">
                    ${navigator.onLine ? 'Tap to refresh ↻' : 'No connection'}
                </span>`;

            banner.classList.remove('hidden');

            const zuluEl = document.getElementById('zuluTime');
            if (zuluEl) zuluEl.style.borderLeft = '3px solid #ff9f0a';
        }

        function hideOfflineBanner() {
            const banner = document.getElementById('offlineBanner');
            if (banner) banner.classList.add('hidden');
            const zuluEl = document.getElementById('zuluTime');
            if (zuluEl) zuluEl.style.borderLeft = '';
        }

        window.addEventListener('online', () => {
            hideOfflineBanner(); showToast('✅ Back online');
            if (localStorage.getItem('efb_storage_mode') === 'cloud') cloudRestoreAll();
        });
        window.addEventListener('offline', () => { showOfflineBanner(Date.now()); });

        // ── AUTO-REFRESH ON APP REOPEN ──────────────────────────────────────────
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') return;
            const icao = document.getElementById('icao').value.trim();
            if (!icao) return;
            const lastLoad = parseInt(localStorage.getItem('efb_last_load_ts') || '0');
            const elapsed  = Date.now() - lastLoad;
            const ONE_HOUR = 60 * 60 * 1000;
            const FIVE_MIN = 5 * 60 * 1000;
            if (elapsed > ONE_HOUR) {
                // Data is stale — force refresh (clear all caches)
                console.log(`[Reopen] ${Math.round(elapsed/60000)}m elapsed — FORCE refreshing ${icao} (data > 1hr)`);
                showToast(`⚠️ Data expired — refreshing ${icao}…`);
                loadData(true);
                // Also force-refresh dashboard airports if enabled
                if (typeof multiAirports !== 'undefined' && multiAirports.length > 0) {
                    forceRefreshDashboard();
                }
            } else if (elapsed > FIVE_MIN) {
                console.log(`[Reopen] ${Math.round(elapsed/60000)}m elapsed — auto-refreshing ${icao}`);
                showToast(`↻ Refreshing ${icao}…`);
                loadData();
            }
        });
    
        // ================================================================
        // 26b. CLIPBOARD FUNCTIONS
        // ================================================================
        // ── DECODED METAR VIEWER ──────────────────────────────────────────────────
        function openDecodedMetar() {
            const icao = document.getElementById('icao').value.trim().toUpperCase();
            if (!icao) { showToast('⚠️ Load an airport first'); return; }
        
            // e6bx.com includes decoded METAR + TAF with plain-English explanations
            const url = `https://e6bx.com/weather/${icao}/?hoursBeforeNow=0&includeTaf=1&showDecoded=1`;
            openInAppBrowser(url, `Decoded Weather · ${icao}`);
        }
    
        async function copyMetar() {
            const element = document.getElementById('rawMetar');
            const text = element.innerText?.trim();
            if (!text || text.includes('Select an airport') || text.length < 10) {
                showToast('⚠️ No METAR to copy'); return;
            }
            
            try {
                await navigator.clipboard.writeText(text);
                showToast('✅ METAR copied');
            } catch(e) {
                // Fallback for older browsers or iOS
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showToast('✅ METAR copied');
            }
        }

        async function copyTaf() {
            const element = document.getElementById('rawTaf');
            if (!element) return;
            
            const text = element.innerText || element.textContent;
            
            if (!text || text === '--' || text === 'Loading forecast...') {
                showToast('⚠️ No TAF to copy');
                return;
            }
            
            try {
                await navigator.clipboard.writeText(text);
                showToast('✅ TAF copied');
            } catch(e) {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showToast('✅ TAF copied');
            }
        }

        // ================================================================
        // SHARE BRIEFING — Web Share API with clipboard fallback
        // ================================================================
        async function shareBriefing() {
            if (!lastMetarObj) { showToast('⚠️ Load an airport first'); return; }

            const icao = document.getElementById('icao').value.trim().toUpperCase();
            const now  = new Date();
            const utcStr = `${now.getUTCDate().toString().padStart(2,'0')} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getUTCMonth()]} · ${now.getUTCHours().toString().padStart(2,'0')}:${now.getUTCMinutes().toString().padStart(2,'0')}Z`;

            // ── Station header ──
            const stName = stationData?.name || icao;
            const stElev = stationData?.elevation_ft != null ? ` · ${stationData.elevation_ft} ft MSL` : '';
            const header = `✈️  ${icao} — Flight Briefing\n${stName}${stElev}\nGenerated: ${utcStr}`;

            // ── Flight category ──
            const catEmoji = { VFR: '🟢', MVFR: '🟡', IFR: '🔴', LIFR: '🟣' };
            const rules = lastMetarObj.flight_rules || '—';
            const catLine = `\n${catEmoji[rules] || '⬛'} ${rules}`;

            // ── METAR section ──
            const raw = lastMetarObj.raw || '—';
            const m = lastMetarObj;

            // Wind
            const wDir = m.wind_direction?.repr === 'VRB' ? 'VRB' : (m.wind_direction?.value != null ? String(m.wind_direction.value).padStart(3,'0') + '°' : '—');
            const wSpd  = m.wind_speed?.value != null ? `${windToKt(m.wind_speed.value, m.units?.wind_speed)} kt` : '—';
            const wGust = m.wind_gust?.value  ? ` G${windToKt(m.wind_gust.value, m.units?.wind_speed)} kt` : '';
            const windLine = `${wDir} / ${wSpd}${wGust}`;

            // Visibility
            const visRaw  = m.visibility?.value;
            const visUnit = (m.units?.visibility || 'sm').toLowerCase();
            let visLine = '—';
            if (visRaw != null) {
                if (visUnit === 'm')        visLine = visRaw >= 9999 ? '10km+ (CAVOK)' : `${visRaw}m`;
                else if (visUnit === 'km')  visLine = visRaw >= 10   ? '10km+ (CAVOK)' : `${visRaw}km`;
                else                        visLine = visRaw >= 10    ? 'P6SM'           : `${visRaw} SM`;
            }

            // Ceiling / sky
            const ceilLayer = m.clouds?.find(c => ['BKN','OVC','VV'].includes(c.type));
            const skyLayer  = m.clouds?.[0];
            let ceilLine = 'CLR (no ceiling)';
            if (ceilLayer)      ceilLine = `${ceilLayer.type} ${String(ceilLayer.altitude * 100).padStart(0,'')} ft (ceiling)`;
            else if (skyLayer)  ceilLine = `${skyLayer.type} ${skyLayer.altitude * 100} ft (not a ceiling)`;

            // Temp / dew
            const t = m.temperature?.value, d = m.dewpoint?.value;
            const tempLine = (t != null && d != null) ? `${t}°C / ${d}°C · Spread ${(t - d).toFixed(1)}°C` : '—';

            // QNH
            const alt = m.altimeter?.value;
            let qnhLine = '—';
            if (alt != null) {
                if (alt < 200) { qnhLine = `A${alt.toFixed(2)} / Q${Math.round(alt * 33.8639)}`; }
                else           { qnhLine = `Q${alt} / A${(alt * 0.02953).toFixed(2)}`; }
            }

            // Present wx
            const wxCodes = (m.wx_codes || []).map(w => w.repr).join(' ');

            const metarSection = [
                `\n📡 METAR`,
                raw,
                `• Wind:       ${windLine}`,
                `• Visibility: ${visLine}`,
                wxCodes ? `• Weather:    ${wxCodes}` : null,
                `• Ceiling:    ${ceilLine}`,
                `• Temp/Dew:   ${tempLine}`,
                `• QNH:        ${qnhLine}`,
            ].filter(Boolean).join('\n');

            // ── TAF section ──
            let tafSection = '\n📅 TAF\nNo TAF available.';
            if (tafDataCache && tafDataCache.length > 0) {
                const rawTaf = document.getElementById('rawTaf')?.innerText?.trim() || '';

                // Find current active period
                const nowTs = Date.now();
                const current = tafDataCache.find(f => {
                    const s = new Date(f.start_time.dt).getTime();
                    const e = new Date(f.end_time.dt).getTime();
                    return nowTs >= s && nowTs < e;
                });

                // Find worst period in next 12h
                const next12h = nowTs + 12 * 3600000;
                const catRank = { LIFR: 0, IFR: 1, MVFR: 2, VFR: 3 };
                let worstPeriod = null, worstRank = 99;
                tafDataCache.forEach(f => {
                    const s = new Date(f.start_time.dt).getTime();
                    if (s < nowTs || s > next12h) return;
                    const rank = catRank[f.flight_rules] ?? 3;
                    if (rank < worstRank) { worstRank = rank; worstPeriod = f; }
                });

                const fmtTafTime = dt => {
                    const d = new Date(dt);
                    return `${d.getUTCDate().toString().padStart(2,'0')}/${d.getUTCHours().toString().padStart(2,'0')}Z`;
                };

                const fmtTafWind = f => {
                    const wd = f.wind?.direction?.repr === 'VRB' ? 'VRB' : (f.wind?.direction?.value != null ? String(f.wind.direction.value).padStart(3,'0') + '°' : '—');
                    const ws = f.wind?.speed?.value != null ? `/${f.wind.speed.value}kt` : '';
                    return `${wd}${ws}`;
                };

                const fmtTafVis = f => {
                    const v = f.visibility?.value;
                    if (v == null) return '—';
                    const u = (f.visibility?.units || 'sm').toLowerCase();
                    if (u === 'm') return v >= 9999 ? '10km+' : `${v}m`;
                    return v >= 10 ? 'P6SM' : `${v}SM`;
                };

                const lines = ['\n📅 TAF'];
                if (current) {
                    const cWind = fmtTafWind(current);
                    const cVis  = fmtTafVis(current);
                    lines.push(`• Now (${fmtTafTime(current.start_time.dt)}): ${current.flight_rules} · ${cWind} · ${cVis}`);
                }
                if (worstPeriod && worstPeriod !== current) {
                    const wWind = fmtTafWind(worstPeriod);
                    const wVis  = fmtTafVis(worstPeriod);
                    lines.push(`• Worst next 12h (${fmtTafTime(worstPeriod.start_time.dt)}): ${worstPeriod.flight_rules} · ${wWind} · ${wVis}`);
                } else if (!worstPeriod) {
                    lines.push('• No significant changes forecast in next 12h');
                }
                if (rawTaf && rawTaf.length > 5 && !rawTaf.includes('No TAF')) {
                    lines.push(rawTaf);
                }
                tafSection = lines.join('\n');
            }

            // ── NOTAMs section ──
            let notamSection = '';
            try {
                const cacheKey = `cache_notam_${icao}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const c = JSON.parse(cached);
                    const notams = Array.isArray(c.data) ? c.data : [];
                    if (notams.length > 0) {
                        const critical = notams.filter(n => /(CLSD|CLOSED|U\/S|UNSERVICEABLE|FAIL|OTS|OUT OF SERVICE)/i.test(n.traditional || n.text || ''));
                        const warn     = notams.filter(n => /(OBST|OBSTACLE|WORK|WIP|SNOW|ICE|DANGER|HAZARD|CRANE)/i.test(n.traditional || n.text || '') && !critical.includes(n));
                        const summary  = `⚠️ NOTAMs: ${notams.length} active${critical.length ? ` (${critical.length} critical)` : ''}`;
                        const topLines = [...critical, ...warn].slice(0, 3).map(n => {
                            const txt = (n.traditional || n.text || '').slice(0, 120);
                            return `  • ${txt}`;
                        });
                        notamSection = '\n' + [summary, ...topLines].join('\n');
                    }
                }
            } catch(e) { /* NOTAM cache read failure is non-fatal */ }

            // ── Footer ──
            const footer = `\n${'─'.repeat(25)}\nShared via METAR GO · Advisory only — not for operational use`;

            // ── Assemble ──
            const briefing = [header, catLine, metarSection, tafSection, notamSection, footer]
                .filter(s => s && s.trim())
                .join('\n');

            // ── Share or copy ──
            const title = `${icao} Flight Briefing · ${rules}`;
            if (navigator.share) {
                try {
                    await navigator.share({ title, text: briefing });
                    return; // share sheet handled it
                } catch(e) {
                    if (e.name === 'AbortError') return; // user cancelled — don't fall through to copy
                }
            }

            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(briefing);
                showToast('📋 Briefing copied to clipboard');
            } catch(e) {
                const ta = document.createElement('textarea');
                ta.value = briefing;
                ta.style.cssText = 'position:fixed;opacity:0;';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showToast('📋 Briefing copied to clipboard');
            }
        }
    
        // ================================================================
        // 27. LAUNCH ANIMATION & STARTUP
        // ================================================================
        // ── Returns status only — does NOT touch the splash screen ──────────
        async function runLaunchAnimation() {
            const screen = document.getElementById('launchScreen');
            if (!screen) return { maintenance: false };

            if (sessionStorage.getItem('admin_bypass') === 'true') {
                console.log('[Admin] Bypass active — skipping maintenance check');
            }

            // Fetch status immediately in parallel with everything else
            try {
                const res = await fetch('/api/status');
                return await res.json();
            } catch {
                return { maintenance: false };
            }
        }

        // ── Dismiss the splash with a smooth fade ────────────────────────
        function dismissSplash() {
            const screen = document.getElementById('launchScreen');
            if (!screen) return;
            screen.classList.add('fade-out');
            setTimeout(() => { screen.style.display = 'none'; }, 420);
        }

        document.addEventListener('DOMContentLoaded', async () => {
            const screen = document.getElementById('launchScreen');

            // Minimum splash visibility (800ms) + status check — run in parallel
            const [status] = await Promise.all([
                runLaunchAnimation(),
                new Promise(r => setTimeout(r, 800))
            ]);

            // Maintenance redirect — before anything else
            const adminBypassed = sessionStorage.getItem('admin_bypass') === 'true';
            if (status.maintenance && !adminBypassed) {
                document.body.style.transition = 'opacity 0.4s ease';
                document.body.style.opacity = '0';
                setTimeout(() => window.location.replace('/maintenance.html'), 400);
                return;
            }

            // ── Access gate check ──────────────────────────────────────────
            const gateEl = document.getElementById('accessGate');
            if (gateEl) {
                const hasAccess = await checkAccessGate();
                if (!hasAccess) {
                    // Splash dismissed, access gate shown instead
                    dismissSplash();
                    return;
                }
            }

            // ── Run initApp — splash stays visible the whole time ──────────
            // initApp sets up Storage, settings, tabs, restores last ICAO,
            // kicks off loadData(). Once it returns the UI is fully ready.
            await initApp();

            // ── App is ready — now dismiss splash ──────────────────────────
            dismissSplash();

            window.addEventListener('resize', () => {
                if (meteoDataCache) drawMeteogram(meteoDataCache);
            });
        });

        // ================================================================
        // 27b. SWIPE NAVIGATION
        // ================================================================
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;

        function getTabOrder() {
            const enabled = document.getElementById('toggleMultiDashboard')?.checked;
            if (enabled) return ['dashboard', 'weather', 'info', 'atc', 'world', 'tools', 'settings', 'help'];
            return ['metar', 'taf', 'info', 'atc', 'world', 'tools', 'settings', 'help'];
        }
        function handleSwipe() {
            const swipeThreshold = 80;  // Minimum swipe distance
            const verticalThreshold = 50; // Maximum vertical movement
            
            const horizontalDiff = touchStartX - touchEndX;
            const verticalDiff = Math.abs(touchStartY - touchEndY);
            
            // Ignore if vertical scroll (not a horizontal swipe)
            if (verticalDiff > verticalThreshold) return;
            
            // Ignore if swipe too short
            if (Math.abs(horizontalDiff) < swipeThreshold) return;
            
            // Get current active tab
            const currentTab = document.querySelector('.view-section.active')?.id.replace('tab-', '');
            if (!currentTab) return;
            
            const tabOrder = getTabOrder();
            const currentIndex = tabOrder.indexOf(currentTab);
            if (currentIndex === -1) return;
            
            let newIndex;
            
            if (horizontalDiff > 0) {
                newIndex = (currentIndex + 1) % tabOrder.length;
            } else {
                newIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
            }
            
            setTab(tabOrder[newIndex]);
            
            // Visual feedback
            const newTab = document.getElementById(`tab-${tabOrder[newIndex]}`);
            if (newTab) {
                newTab.style.animation = 'none';
                setTimeout(() => {
                    newTab.style.animation = '';
                }, 10);
            }
        }

        // ================================================================
        // SWIPE NAVIGATION — minimal gesture detector, delegates to setTab()
        // ================================================================
        (function () {
            if (!('ontouchstart' in window)) return;

            let sx = 0, sy = 0, settled = false, isHoriz = false, locked = false;
            const MIN_DIST = 40;   // px before we commit
            const ANGLE    = 0.75; // tan(~37°) — must be more horizontal than this

            function blocked(t) {
                return t.closest('.quick-select-row') ||
                       t.closest('.tabs') ||
                       t.closest('#tools-extension-panel') ||
                       t.closest('#windsAloftModal') ||        // modal content — don't swipe
                       (t.tagName === 'INPUT' && t.type === 'range') || // sliders are horizontal too
                       document.getElementById('windsAloftModal')?.style.display === 'flex' || // backdrop tap
                       document.getElementById('formula-modal')?.style.display === 'flex' ||   // other modals
                       (typeof toolsExtensionState !== 'undefined' && toolsExtensionState.isOpen) ||
                       window._sortMode?.active;
            }

            document.addEventListener('touchstart', e => {
                // Always reset state on new touch
                settled = false;
                isHoriz = false;
                locked  = false;
                if (blocked(e.target)) {
                    locked = true;   // prevent any gesture from this touch
                    return;
                }
                sx = e.touches[0].clientX;
                sy = e.touches[0].clientY;
            }, { passive: true });

            document.addEventListener('touchmove', e => {
                if (locked) return;
                if (settled) { if (isHoriz) e.preventDefault(); return; }
                const dx = e.touches[0].clientX - sx;
                const dy = e.touches[0].clientY - sy;
                if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
                settled = true;
                isHoriz = Math.abs(dx) > Math.abs(dy) * ANGLE;
                if (!isHoriz) locked = true;
                else e.preventDefault();
            }, { passive: false });

            document.addEventListener('touchend', e => {
                if (!isHoriz || locked) return;
                const dx = e.changedTouches[0].clientX - sx;
                if (Math.abs(dx) < MIN_DIST) return;

                const order = getTabOrder();
                const cur   = document.querySelector('.view-section.active')?.id.replace('tab-', '');
                const idx   = order.indexOf(cur);
                if (idx === -1) return;

                // swipe right (dx > 0) → go to previous tab; left → next tab
                const next = dx > 0
                    ? order[(idx - 1 + order.length) % order.length]
                    : order[(idx + 1) % order.length];

                setTab(next);
            }, { passive: true });

        })();


        function openExternal(url) {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    
        // ================================================================
        // EDIT-MODE DRAG TO REORDER UTILITY
        // ================================================================
        window._sortMode = {
            active: false,
            dragEl: null,
            fromIndex: -1,
            toIndex: -1,
            startY: 0,
            container: null,
            itemClass: null
        };
        
        function initSortable(containerEl, itemClass, toggleBtnId, onReorder) {
            const toggleBtn = document.getElementById(toggleBtnId);
            if (!toggleBtn) return;
        
            // Toggle edit mode on/off
            toggleBtn.addEventListener('click', () => {
                const sm = window._sortMode;
                const entering = !sm.active;
                sm.active     = entering;
                sm.container  = entering ? containerEl : null;
                sm.itemClass  = itemClass;
        
                toggleBtn.innerText      = entering ? '✓ Done' : '⇅ Reorder';
                toggleBtn.style.background  = entering ? 'var(--success)' : 'rgba(10,132,255,0.12)';
                toggleBtn.style.color       = entering ? '#000' : 'var(--accent)';
                toggleBtn.style.borderColor = entering ? 'var(--success)' : 'var(--accent)';
        
                // Show/hide drag handles
                containerEl.querySelectorAll('.' + itemClass).forEach(el => {
                    let handle = el.querySelector('.sort-handle');
                    if (entering) {
                        if (!handle) {
                            handle = document.createElement('div');
                            handle.className = 'sort-handle';
                            handle.innerHTML = '&#8942;&#8942;'; // ⋮⋮
                            el.prepend(handle);
                        }
                        handle.style.display = 'flex';
                        el.style.transition = 'box-shadow 0.2s, transform 0.2s';
                    } else {
                        if (handle) handle.style.display = 'none';
                        el.style.transform = '';
                        el.style.boxShadow = '';
                        el.style.outline   = '';
                    }
                });
        
                if (entering) {
                    navigator.vibrate?.(30);
                } else {
                    onReorder(-1, -1, true); // signal "save final order"
                }
            });
        
            // Drag only active in edit mode
            containerEl.addEventListener('touchstart', e => {
                const sm = window._sortMode;
                if (!sm.active || sm.container !== containerEl) return;
                const item = e.target.closest('.' + itemClass);
                if (!item) return;
        
                sm.dragEl    = item;
                sm.startY    = e.touches[0].clientY;
                sm.fromIndex = [...containerEl.querySelectorAll('.' + itemClass)].indexOf(item);
                sm.toIndex   = sm.fromIndex;
        
                item.style.outline   = '2px solid var(--accent)';
                item.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
                item.style.transform = 'scale(0.98)';
                navigator.vibrate?.(25);
            }, { passive: true });
        
            containerEl.addEventListener('touchmove', e => {
                const sm = window._sortMode;
                if (!sm.active || !sm.dragEl || sm.container !== containerEl) return;
                e.preventDefault();
        
                const touchY = e.touches[0].clientY;
                const items  = [...containerEl.querySelectorAll('.' + sm.itemClass)];
                let overIndex = sm.toIndex;
        
                items.forEach((el, i) => {
                    const rect = el.getBoundingClientRect();
                    if (touchY >= rect.top && touchY <= rect.bottom) overIndex = i;
                });
        
                if (overIndex !== sm.toIndex && overIndex >= 0) {
                    const ref = overIndex < sm.toIndex
                        ? items[overIndex]
                        : items[overIndex].nextSibling;
                    containerEl.insertBefore(sm.dragEl, ref || null);
                    sm.toIndex = overIndex;
                }
            }, { passive: false });
        
            const endDrag = () => {
                const sm = window._sortMode;
                if (!sm.dragEl) return;
                sm.dragEl.style.outline   = '';
                sm.dragEl.style.boxShadow = '';
                sm.dragEl.style.transform = '';
        
                const from = sm.fromIndex;
                const to   = sm.toIndex;
                sm.dragEl  = null;
        
                if (from !== to) onReorder(from, to, false);
            };
        
            containerEl.addEventListener('touchend',    endDrag, { passive: true });
            containerEl.addEventListener('touchcancel', endDrag, { passive: true });
        }
    
        // ================================================================
        // 28. MULTI-AIRPORT DASHBOARD
        // ================================================================
        let multiAirports = [];
        let multiDataCache = {};
        let multiRefreshInterval = null;
        const _fetchingIcaos = new Set(); // guard against concurrent fetches for same airport

        async function loadMultiAirports() {
            // Try cloud first, then local
            const cloudData = await Storage.get('efb_multi_airports');
            const localData = localStorage.getItem('efb_multi_airports');
            
            if (cloudData && Array.isArray(cloudData)) {
                multiAirports = cloudData;
            } else if (localData) {
                multiAirports = JSON.parse(localData);
            } else {
                multiAirports = [];
            }
            renderMultiDashboard();
            
            // Auto-refresh every 5 minutes
            if (multiRefreshInterval) clearInterval(multiRefreshInterval);
            if (multiAirports.length > 0) {
                refreshMultiData();
                multiRefreshInterval = setInterval(refreshMultiData, 300000);
            }
        }

        async function saveMultiAirports() {
            localStorage.setItem('efb_multi_airports', JSON.stringify(multiAirports));
            await Storage.set('efb_multi_airports', multiAirports);
        }

        async function addMultiAirport() {
            const input = document.getElementById('multiAddInput');
            const raw   = input.value.trim().toUpperCase();

            if (!raw || raw.length < 3 || raw.length > 4) {
                showToast('⚠️ Enter a 3-letter IATA or 4-letter ICAO code');
                return;
            }

            if (multiAirports.length >= 8) {
                showToast('⚠️ Maximum 8 airports');
                return;
            }

            const addBtn = document.querySelector('.multi-add-btn');
            if (addBtn) { addBtn.innerText = '⏳'; addBtn.disabled = true; }

            let icao = raw;

            try {
                // If 3 letters, treat as IATA and resolve to ICAO via search
                if (raw.length === 3) {
                    const res = await secureFetch(`/api/weather?type=search&station=${raw}`);

                    // Handle both array and object-with-numeric-keys responses
                    let station = null;
                    if (Array.isArray(res)) {
                        station = res[0] || null;
                    } else if (res && typeof res === 'object') {
                        const items = Object.values(res).filter(
                            item => item && typeof item === 'object' && item.icao
                        );
                        station = items[0] || null;
                    }

                    if (!station?.icao) {
                        showToast(`❌ Could not find airport for "${raw}"`);
                        return;
                    }

                    icao = station.icao.toUpperCase();
                    showToast(`🔍 ${raw} → ${icao}`);
                }

                if (multiAirports.includes(icao)) {
                    showToast(`⚠️ Already tracking ${icao}`);
                    return;
                }

                multiAirports.push(icao);
                saveMultiAirports();
                input.value = '';

                renderMultiDashboard();
                fetchMultiAirportData(icao);

                if (!multiRefreshInterval) {
                    multiRefreshInterval = setInterval(refreshMultiData, 300000);
                }

            } catch(e) {
                console.error('[addMultiAirport] Error:', e);
                showToast(`❌ Failed to resolve "${raw}" — check connection`);
            } finally {
                if (addBtn) { addBtn.innerText = '+ Add'; addBtn.disabled = false; }
            }
        }

        function removeMultiAirport(icao) {
            multiAirports = multiAirports.filter(i => i !== icao);
            delete multiDataCache[icao];
            saveMultiAirports();
            renderMultiDashboard();
            
            if (multiAirports.length === 0 && multiRefreshInterval) {
                clearInterval(multiRefreshInterval);
                multiRefreshInterval = null;
            }
        }

        async function fetchMultiAirportData(icao) {
            if (_fetchingIcaos.has(icao)) return;   // already in-flight for this airport
            _fetchingIcaos.add(icao);
            try {
                // Check TAF cache first to avoid unnecessary fetch
                const tafCacheKey = `cache_/api/weather?type=taf&station=${icao}`;
                const tafCached   = localStorage.getItem(tafCacheKey);
                let tafPromise    = null;
                if (!tafCached) {
                    // Fire TAF fetch in parallel with METAR+Station
                    tafPromise = secureFetch(`/api/weather?type=taf&station=${icao}`).catch(() => null);
                }

                // Fetch METAR + Station in parallel
                const [metarRes, stationRes] = await Promise.allSettled([
                    secureFetch(`/api/weather?type=metar&station=${icao}`),
                    secureFetch(`/api/weather?type=station&station=${icao}`)
                ]);

                // Resolve TAF
                let hasTaf = false;
                if (tafCached) {
                    try { hasTaf = !!(JSON.parse(tafCached).data?.raw); } catch(e) {}
                } else if (tafPromise) {
                    const taf = await tafPromise;
                    hasTaf = !!(taf?.raw && !taf?.error);
                }

                if (metarRes.status === 'fulfilled' && metarRes.value && !metarRes.value.error) {
                    const station = stationRes.status === 'fulfilled' ? stationRes.value : null;
                    multiDataCache[icao] = {
                        metar:            metarRes.value,
                        hasTaf,
                        stationName:      station?.name || icao,
                        stationIata:      station?.iata || '',
                        stationElevation: station?.elevation_ft ?? null,
                        fetchTime:        Date.now()
                    };
                    renderMultiCard(icao);
                }
            } catch(e) {
                console.error(`[Multi] Error fetching ${icao}:`, e);
            } finally {
                _fetchingIcaos.delete(icao);            // always release the lock
            }
        }

        async function forceRefreshDashboard() {
            const btn = document.getElementById('multiRefreshBtn');
            if (btn) { btn.innerText = '⏳ Refreshing...'; btn.disabled = true; }
            
            // Clear cached METAR data for all tracked airports
            multiAirports.forEach(icao => {
                localStorage.removeItem(`cache_/api/weather?type=metar&station=${icao}`);
            });
            
            await refreshMultiData();
            
            const now = new Date();
            const timeStr = `${now.getUTCHours().toString().padStart(2,'0')}:${now.getUTCMinutes().toString().padStart(2,'0')}Z`;
            const el = document.getElementById('multiLastUpdated');
            if (el) el.innerText = `Last refreshed: ${timeStr}`;
            
            if (btn) { btn.innerHTML = '↻ Refresh'; btn.disabled = false; }
            showToast('✅ Dashboard refreshed');
        }
    
        async function refreshMultiData() {
            console.log('[Multi] Refreshing all airports...');
            await Promise.allSettled(
                multiAirports.map(icao => fetchMultiAirportData(icao))
            );
            // Update last-refreshed stamp
            const now = new Date();
            const timeStr = `${now.getUTCHours().toString().padStart(2,'0')}:${now.getUTCMinutes().toString().padStart(2,'0')}Z`;
            const el = document.getElementById('multiLastUpdated');
            if (el) el.innerText = `Auto-refreshed: ${timeStr}`;

            // Sync: if the currently loaded METAR airport is in the dashboard, refresh it too
            const currentIcao = document.getElementById('icao')?.value?.trim()?.toUpperCase();
            if (currentIcao && multiAirports.includes(currentIcao)) {
                console.log(`[Multi→METAR] Dashboard refreshed ${currentIcao} — syncing to METAR tab`);
                loadData();
            }
        }

        function renderMultiDashboard() {
            const grid = document.getElementById('multiGrid');
            
            if (multiAirports.length === 0) {
                grid.innerHTML = '<div class="multi-loading">Add airports above to start tracking</div>';
                return;
            }
            
            grid.innerHTML = multiAirports.map(icao => {
                const cached = multiDataCache[icao];
                if (!cached) {
                    return `
                        <div class="multi-card">
                            <div class="multi-header">
                                <div class="multi-icao">${icao}</div>
                                <div class="multi-remove" onclick="event.stopPropagation(); removeMultiAirport('${icao}')">×</div>
                            </div>
                            <div class="multi-loading">Loading...</div>
                        </div>`;
                }
                
                return renderMultiCardHTML(icao, cached);
            }).join('');
            // Enable drag reorder
            initSortable(grid, 'multi-card', 'btnReorderDashboard', async (from, to, isSave) => {
                if (isSave) {
                    // Done pressed — read final order from DOM
                    const items = [...grid.querySelectorAll('.multi-card')];
                    const newOrder = items.map(el => el.dataset.icao).filter(Boolean);
                    if (newOrder.length === multiAirports.length) {
                        multiAirports = newOrder;
                        await saveMultiAirports();
                        showToast('✅ Order saved');
                    }
                    renderMultiDashboard(); // re-render to restore Done→Reorder btn state
                    return;
                }
                // Live swap
                const moved = multiAirports.splice(from, 1)[0];
                multiAirports.splice(to, 0, moved);
            });
            
        }

        function renderMultiCard(icao) {
            const cached = multiDataCache[icao];
            if (!cached) return;
            
            const cardEl = document.querySelector(`[data-icao="${icao}"]`);
            if (cardEl) {
                cardEl.outerHTML = renderMultiCardHTML(icao, cached);
            } else {
                renderMultiDashboard();
            }
        }

        // Router — picks raw or detailed based on user preference
        function renderMultiCardHTML(icao, cached) {
            return getDashCardStyle() === 'detailed'
                ? renderDetailedCardHTML(icao, cached)
                : renderRawCardHTML(icao, cached);
        }

        function renderEmptyState(tabId) {
            const el = document.getElementById(tabId);
            if (!el) return;
            el.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                            min-height:55vh;text-align:center;padding:32px 24px;gap:20px;">
                    <div style="font-size:52px;opacity:0.25;">✈️</div>
                    <div style="font-size:18px;font-weight:800;color:#fff;opacity:0.6;">No airport selected</div>
                    <div style="font-size:14px;color:var(--sub-text);line-height:1.7;max-width:260px;">
                        Search for an airport above, or add one to your<br>favourites to get started.
                    </div>
                    <button onclick="document.getElementById('searchInput')?.focus()"
                            style="margin-top:8px;background:var(--accent);color:#fff;
                                   border:none;border-radius:10px;padding:11px 28px;
                                   font-size:15px;font-weight:700;cursor:pointer;
                                   box-shadow:0 2px 12px rgba(10,132,255,0.35);">
                        Search Airport
                    </button>
                </div>`;
        }
    
        // ── RAW view (original compact METAR string card) ──
        function renderRawCardHTML(icao, cached) {
            const m        = cached.metar;
            const rules    = m.flight_rules || 'UNKN';
            const rulesBg  = { VFR:'var(--success)', MVFR:'var(--mvfr)', IFR:'var(--danger)', LIFR:'var(--lifr)' }[rules] || '#555';
            const rulesColor = rules === 'VFR' ? '#000' : '#fff';
            const ageMin   = Math.floor((Date.now() - new Date(m.time.dt)) / 60000);
            const ageColor = ageMin > 60 ? 'var(--danger)' : 'var(--sub-text)';
            const rawMetar = m.raw || 'No raw data';
        
            return `
                <div class="multi-card" data-icao="${icao}" onclick="loadMultiAirport('${icao}')">
                    <div class="multi-header">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div style="display:flex;align-items:baseline;gap:5px;">
                                <div class="multi-icao">${icao}</div>
                                ${cached.stationIata
                                    ? `<div style="font-size:11px;font-weight:600;color:var(--sub-text);
                                                   font-family:'SF Mono',monospace;">${cached.stationIata}</div>`
                                    : ''}
                            </div>
                            <div style="background:${rulesBg};color:${rulesColor};font-size:11px;font-weight:900;padding:3px 9px;border-radius:5px;letter-spacing:0.5px;">${rules}</div>
                        </div>
                        <div class="multi-remove" onclick="event.stopPropagation();removeMultiAirport('${icao}')">×</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.04);border-radius:6px;padding:10px;font-family:'SF Mono',monospace;font-size:12px;color:#e0e0e0;line-height:1.6;word-break:break-all;white-space:pre-wrap;margin-top:6px;">${formatRawMetar(rawMetar)}</div>
                    <div class="multi-age" style="color:${ageColor};margin-top:6px;">${ageMin > 60 ? '⚠️ ' : ''}${ageMin}m ago · Tap to load full data</div>
                </div>`;
        }

        /**
         * Returns the worst flight category found in a cached TAF string.
         * Priority: LIFR > IFR > MVFR > VFR
         * Falls back to 'VFR' (green) if TAF not available or unparseable.
         */
        function tafRulesSummary(icao) {
            const cacheKey = `cache_/api/weather?type=taf&station=${icao}`;
            const priority = { LIFR: 4, IFR: 3, MVFR: 2, VFR: 1 };
            try {
                const raw = localStorage.getItem(cacheKey);
                if (!raw) return { initial: null, worst: null };
                const taf = JSON.parse(raw);
                const forecasts = (taf?.data?.forecast || []).filter(f => f.flight_rules);
        
                if (forecasts.length === 0) return { initial: null, worst: null };
        
                const initial = forecasts[0].flight_rules;
                let worst = initial;
        
                for (const f of forecasts) {
                    const rules = f.flight_rules || 'VFR';
                    if ((priority[rules] || 0) > (priority[worst] || 0)) {
                        worst = rules;
                    }
                }
        
                return { initial, worst };
            } catch(e) {
                return { initial: null, worst: null };
            }
        }
    
        function renderDetailedCardHTML(icao, cached) {
            const m          = cached.metar;
            const rules      = m.flight_rules || 'UNKN';
            const rulesBg    = { VFR:'var(--success)', MVFR:'var(--mvfr)', IFR:'var(--danger)', LIFR:'var(--lifr)' }[rules] || '#555';
            const rulesColor = rules === 'VFR' ? '#000' : '#fff';
            const ageMin     = Math.floor((Date.now() - new Date(m.time.dt)) / 60000);
            const ageColor   = ageMin > 60 ? 'var(--danger)' : 'var(--success)';
            const ageLabel   = ageMin > 60 ? 'expired' : `${ageMin} min`;
        
            // ── Wind ──
            const isVrb      = m.wind_direction?.repr === 'VRB';
            const windDirRaw = isVrb ? 0 : (m.wind_direction?.value ?? 0);
            const windSpd    = m.wind_speed?.value ?? 0;
            const windGust   = m.wind_gust?.value;
            const isCalm     = windSpd === 0;
            const windDirStr = isCalm ? 'CALM' : isVrb ? 'VRB' : String(windDirRaw).padStart(3,'0') + '°';
            const arrowRot   = (windDirRaw + 180) % 360;   // points toward source
        
            const arrowSvg = (!isCalm && !isVrb) ? `
                <svg width="16" height="16" viewBox="0 0 20 20"
                     style="flex-shrink:0;transform:rotate(${arrowRot}deg);margin-right:4px;margin-top:2px;">
                    <polygon points="10,1 5,17 10,13 15,17" fill="#ff453a"/>
                </svg>` : '';
        
            // ── Visibility ──
            const vis = formatVisDisplay(visToSM(m.visibility?.value, m.units?.visibility));
        
            // ── Clouds ──
            const cloudStr = decodeCloudLayer(m.clouds);

            // ── Present weather (wx_codes) ──
            const wxCodes = m.wx_codes || [];
            const wxColor = repr => {
                if (/TS/.test(repr))                              return 'var(--danger)';
                if (/FG|FZFG|FZRA|FZDZ|IC|PL|SQ|FC/.test(repr)) return 'var(--warn)';
                if (/SN|SG|GS|GR|BLSN|DRSN/.test(repr))         return '#85B7EB';
                return '#ccc';
            };
            const wxHtml = wxCodes.length > 0
                ? wxCodes.map(wx => `<span style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:${wxColor(wx.repr)};font-size:10px;font-weight:700;padding:1px 6px;border-radius:3px;">${wx.repr}</span>`).join(' ')
                : '';

            // ── Temp / Dew / RH ──
            const temp    = m.temperature?.value;
            const dew     = m.dewpoint?.value;
            const tempStr = formatTempDisplay(temp);
            const dewStr  = formatTempDisplay(dew);
            let rh = '--';
            if (temp != null && dew != null) {
                rh = Math.round(
                    100 * Math.exp((17.625 * dew) / (243.04 + dew))
                        / Math.exp((17.625 * temp) / (243.04 + temp))
                );
            }

            // ── Fog risk (T–Td spread ≤ 3 °C) ──
            const spread  = (temp != null && dew != null) ? temp - dew : null;
            const fogRisk = spread != null && spread <= 3;

            // ── Pressure ──
            const pressStr = formatPressDisplay(m.altimeter?.value);

            // ── Density Altitude ──
            let daStr = '';
            let daWarn = false;
            const elev = cached.stationElevation;
            if (elev != null && temp != null && m.altimeter?.value != null) {
                let qnhHpa = m.altimeter.value;
                if (m.units?.altimeter === 'inHg') qnhHpa *= 33.8639;
                const pa     = elev + (1013.25 - qnhHpa) * 30;    // keep exact for ISA calc
                const isaT   = 15 - (2 * pa / 1000);
                const da     = Math.round(pa + 120 * (temp - isaT)); // round only final result
                daStr  = `DA ${da.toLocaleString()} ft`;
                daWarn = da > elev + 2000;
            }

            // ── Badges & metadata ──
            const isAuto = !!(m.raw?.includes(' AUTO ') || m.raw?.startsWith('AUTO'));
            const hasTaf = cached.hasTaf;
            const name   = cached.stationName || icao;
            const iata   = cached.stationIata || '';
        
            const badge = (label, bg, color) =>
                `<div style="background:${bg};color:${color};
                             font-size:11px;font-weight:900;
                             padding:3px 0;border-radius:5px;
                             letter-spacing:0.4px;text-align:center;
                             width:44px;">${label}</div>`;
        
            return `
                <div class="multi-card" data-icao="${icao}"
                     onclick="loadMultiAirport('${icao}')"
                     style="padding:12px 14px;">
        
                    <!-- ═══════════════════════════════════════════════════
                         TOP ROW: Airport name (left) · ICAO + delete (right)
                         ═══════════════════════════════════════════════════ -->
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;
                                margin-bottom:10px;gap:8px;">
        
                        <!-- Airport name — scales font to fit, IATA dimmed after -->
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:14px;font-weight:800;color:#fff;
                                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${name}${iata ? `<span style="font-size:11px;font-weight:600;
                                                               color:var(--sub-text);margin-left:6px;">${iata}</span>` : ''}
                            </div>
                        </div>
        
                        <!-- ICAO + delete -->
                        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                            <div style="font-size:14px;font-weight:900;font-family:'SF Mono',monospace;
                                        color:#fff;letter-spacing:1px;">${icao}</div>
                            <div class="multi-remove"
                                 onclick="event.stopPropagation();removeMultiAirport('${icao}')">×</div>
                        </div>
                    </div>
        
                    <!-- ═══════════════════════════════════════════════════
                         MAIN ROW: Left column (weather) · Right column (split)
                         ═══════════════════════════════════════════════════ -->
                    <div style="display:flex;gap:8px;">
        
                        <!-- LEFT: wind · vis · clouds -->
                        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;">
        
                            <div style="display:flex;align-items:flex-start;">
                                ${arrowSvg}
                                <div>
                                    <span style="font-size:17px;font-weight:800;color:#fff;">${windDirStr}</span>
                                    ${!isCalm ? `
                                    <span style="font-size:15px;font-weight:700;color:#fff;margin-left:4px;">${windSpd}</span>
                                    <span style="font-size:11px;color:var(--sub-text);"> kt</span>
                                    ${windGust
                                        ? `<span style="font-size:12px;font-weight:800;
                                                      color:var(--danger);margin-left:3px;">G${windGust}</span>`
                                        : ''}
                                    ` : ''}
                                </div>
                            </div>
        
                            <div style="font-size:12px;color:#bbb;margin-top:2px;">${vis}</div>
                            <div style="font-size:12px;color:#bbb;">${cloudStr}</div>
                            ${wxHtml ? `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:3px;">${wxHtml}</div>` : ''}
                            ${fogRisk ? `<div style="font-size:10px;font-weight:700;color:var(--warn);margin-top:2px;">🌫 Fog risk</div>` : ''}

                        </div>
        
                        <!-- RIGHT: two sub-columns -->
                        <div style="display:flex;gap:10px;align-items:flex-start;flex-shrink:0;">
        
                            <!-- RIGHT-LEFT sub-column: numbers stacked -->
                            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                                <div style="font-size:19px;font-weight:700;color:#fff;line-height:1;">${tempStr}</div>
                                <div style="font-size:11px;color:var(--sub-text);">${dewStr} ${rh !== '--' ? rh+'%' : ''}</div>
                                <div style="font-size:11px;color:var(--sub-text);font-family:'SF Mono',monospace;">${pressStr}</div>
                                ${daStr ? `<div style="font-size:10px;font-weight:700;color:${daWarn ? 'var(--warn)' : 'var(--sub-text)'};font-family:'SF Mono',monospace;">${daStr}</div>` : ''}
                                <div style="font-size:13px;font-weight:800;color:${ageColor};margin-top:2px;">${ageLabel}</div>
                            </div>
        
                            <!-- RIGHT-RIGHT sub-column: badges only -->
                            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                                ${badge(rules, rulesBg, rulesColor)}
                                ${hasTaf ? (() => {
                                    const { initial, worst } = tafRulesSummary(icao);
                                    if (!initial) return '';
                                
                                    const bgMap    = { VFR: 'var(--success)', MVFR: 'var(--mvfr)', IFR: 'var(--danger)', LIFR: 'var(--lifr)' };
                                    const colorMap = { VFR: '#000', MVFR: '#fff', IFR: '#fff', LIFR: '#fff' };
                                
                                    const initBg    = bgMap[initial]  || '#555';
                                    const initColor = colorMap[initial] || '#fff';
                                
                                    // Single pill — same initial and worst condition
                                    if (initial === worst) {
                                        return `
                                            <div style="display:flex;border-radius:5px;overflow:hidden;width:44px;
                                                        font-size:11px;font-weight:900;letter-spacing:0.4px;">
                                                <div style="flex:1;background:${initBg};color:${initColor};
                                                            text-align:center;padding:3px 0;">TAF</div>
                                            </div>`;
                                    }
                                
                                    // Split pill — show initial | worst
                                    const worstBg    = bgMap[worst]  || '#555';
                                    const worstColor = colorMap[worst] || '#fff';
                                
                                    return `
                                        <div title="TAF: ${initial} initially → ${worst} worst"
                                             style="display:flex;border-radius:5px;overflow:hidden;
                                                    font-size:9px;font-weight:900;letter-spacing:0.2px;width:58px;">
                                            <div style="flex:1;background:${initBg};color:${initColor};
                                                        text-align:center;padding:3px 2px;line-height:1.2;">
                                                ${initial}
                                            </div>
                                            <div style="width:1px;background:rgba(0,0,0,0.3);"></div>
                                            <div style="flex:1;background:${worstBg};color:${worstColor};
                                                        text-align:center;padding:3px 2px;line-height:1.2;">
                                                ${worst}
                                            </div>
                                        </div>`;
                                })() : ''}
                                ${isAuto ? badge('AUTO', '#555', '#ccc')   : ''}
                            </div>
        
                        </div>
                    </div>
        
                </div>`;
        }
        function loadMultiAirport(icao) {
            document.getElementById('icao').value = icao;
            loadData();
            const enabled = document.getElementById('toggleMultiDashboard')?.checked;
            setTab(enabled ? 'weather' : 'metar');
            showToast(`Loading ${icao}...`);
        }

// ================================================================
        // FIRST-USE ONBOARDING
        // ================================================================
        function showOnboarding() {
            if (localStorage.getItem('efb_onboarded')) return;
            setTimeout(() => {
                document.getElementById('onboardingModal')?.classList.add('active');
            }, 700);
        }

        function dismissOnboarding() {
            localStorage.setItem('efb_onboarded', 'true');
            document.getElementById('onboardingModal')?.classList.remove('active');
        }

        function closeOnboardingAndGo(tab, targetId) {
            dismissOnboarding();
            setTab(tab);
            setTimeout(() => {
                const el = document.getElementById(targetId);
                if (!el) return;
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus?.();
                // Brief blue glow to highlight the target element
                const prev = el.style.boxShadow;
                el.style.transition = 'box-shadow 0.3s';
                el.style.boxShadow = '0 0 0 3px var(--accent)';
                setTimeout(() => { el.style.boxShadow = prev; }, 2200);
            }, 350);
        }
    

    
