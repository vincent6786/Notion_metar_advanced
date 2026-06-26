(function() {
    try {
        const dashEnabled = JSON.parse(localStorage.getItem('efb_multi_dashboard_enabled'));
        if (dashEnabled) {
            document.addEventListener('DOMContentLoaded', function() {
                // Show the dashboard/weather tabs in the tab bar
                document.getElementById('tabMetar')?.classList.add('hidden');
                document.getElementById('tabTaf')?.classList.add('hidden');
                document.getElementById('tabDashboard')?.classList.remove('hidden');
                document.getElementById('tabWeather')?.classList.remove('hidden');

                // Land on the DASHBOARD pane on reopen (not Weather) so the
                // user sees their multi-airport grid right away.
                document.getElementById('tab-metar')?.classList.remove('active');
                document.getElementById('tab-weather')?.classList.remove('active');
                const dashEl = document.getElementById('tab-dashboard');
                if (dashEl) {
                    dashEl.classList.remove('hidden');
                    dashEl.classList.add('active');
                }
                // Mark the tab bar Dashboard chip as active
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.getElementById('tabDashboard')?.classList.add('active');
            }, { once: true });
        }
    } catch(e) {}
})();
