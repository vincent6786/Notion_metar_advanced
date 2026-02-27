(function() {
    try {
        const dashEnabled = JSON.parse(localStorage.getItem('efb_multi_dashboard_enabled'));
        if (dashEnabled) {
            document.addEventListener('DOMContentLoaded', function() {
                document.getElementById('tabMetar')?.classList.add('hidden');
                document.getElementById('tabTaf')?.classList.add('hidden');
                document.getElementById('tabDashboard')?.classList.remove('hidden');
                document.getElementById('tabWeather')?.classList.remove('hidden');
                document.getElementById('tab-metar')?.classList.remove('active');
                const weatherEl = document.getElementById('tab-weather');
                if (weatherEl) {
                    weatherEl.classList.remove('hidden');
                    weatherEl.classList.add('active');
                }
            }, { once: true });
        }
    } catch(e) {}
})();
