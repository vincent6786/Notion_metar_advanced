// Vercel Serverless Function to proxy AVWX requests securely
export default async function handler(req, res) {
    const { station, type } = req.query; // e.g., ?station=KJFK&type=metar

    // Your keys are now safe on the server
    const API_KEYS = [
        process.env.AVWX_KEY_1,
        process.env.AVWX_KEY_2,
        process.env.AVWX_KEY_3,
        process.env.AVWX_KEY_4
    ];

    if (!station) {
        return res.status(400).json({ error: 'Station is required' });
    }

    // Helper to fetch with key rotation
    async function fetchWithRotation(url) {
        for (let i = 0; i < API_KEYS.length; i++) {
            // Skip if key is missing in environment variables
            if (!API_KEYS[i]) continue; 

            try {
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${API_KEYS[i]}` }
                });
                
                if (response.ok) return await response.json();
                
                // If 429 (Too Many Requests) or 401 (Unauthorized), try next key
                if (response.status === 429 || response.status === 401) {
                    console.warn(`Key ${i} exhausted/failed. Switching...`);
                    continue;
                }
                
                // Other errors (404 etc) return immediately
                return await response.json();
            } catch (e) {
                console.error("Fetch error:", e);
            }
        }
        throw new Error("All API keys exhausted");
    }

    try {
        // We construct the AVWX URL here on the server
        let endpoint = '';
        if (type === 'station') endpoint = `https://avwx.rest/api/station/${station}`;
        else if (type === 'metar') endpoint = `https://avwx.rest/api/metar/${station}`;
        else if (type === 'taf') endpoint = `https://avwx.rest/api/taf/${station}`;
        else if (type === 'notam') endpoint = `https://avwx.rest/api/notam/${station}`;
        else if (type === 'near') endpoint = `https://avwx.rest/api/station/near/${station}`; // station here will be "lat,lon"
        else if (type === 'search') endpoint = `https://avwx.rest/api/search/station?text=${station}`;
        
        const data = await fetchWithRotation(endpoint);
        
        // Cache this response in the browser/CDN for 2 minutes to save quota
        res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch weather data' });
    }
}
