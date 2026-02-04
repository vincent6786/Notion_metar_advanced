export default async function handler(req, res) {
    const { station, type } = req.query;

    const API_KEYS = [
        process.env.AVWX_KEY_1,
        process.env.AVWX_KEY_2,
        process.env.AVWX_KEY_3,
        process.env.AVWX_KEY_4
    ];

    if (!station) return res.status(400).json({ error: 'Station is required' });

    async function fetchWithRotation(url) {
        for (let i = 0; i < API_KEYS.length; i++) {
            if (!API_KEYS[i]) continue; 
            try {
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${API_KEYS[i]}` }
                });
                if (response.ok) return await response.json();
                if (response.status === 429 || response.status === 401) continue;
                return await response.json();
            } catch (e) { console.error(e); }
        }
        throw new Error("All API keys exhausted");
    }

    try {
        let endpoint = '';
        if (type === 'station') endpoint = `https://avwx.rest/api/station/${station}`;
        else if (type === 'metar') endpoint = `https://avwx.rest/api/metar/${station}`;
        else if (type === 'taf') endpoint = `https://avwx.rest/api/taf/${station}`;
        else if (type === 'notam') endpoint = `https://avwx.rest/api/notam/${station}`;
        else if (type === 'near') endpoint = `https://avwx.rest/api/station/near/${station}`;
        else if (type === 'search') endpoint = `https://avwx.rest/api/search/station?text=${station}`;
        
        const data = await fetchWithRotation(endpoint);
        res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch weather data' });
    }
}
