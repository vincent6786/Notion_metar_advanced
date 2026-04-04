export default async function handler(req, res) {
    const { url } = req.query;

    const ALLOWED = [
        'https://s1-bos.liveatc.net/kmhr',
        'https://s1-fmt2.liveatc.net/kjfk_atis',
        'https://s1-bos.liveatc.net/kjfk_arinc'
    ];

    if (!url || !ALLOWED.some(a => url.startsWith(a))) {
        return res.status(403).json({ error: 'Stream not allowed' });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Icy-MetaData': '0'
            }
        });

        if (!response.ok) throw new Error(`Upstream: ${response.status}`);

        res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Transfer-Encoding', 'chunked');

        const reader = response.body.getReader();
        req.on('close', () => reader.cancel());

        while (true) {
            const { done, value } = await reader.read();
            if (done || res.destroyed) break;
            res.write(Buffer.from(value));
        }
        res.end();

    } catch(e) {
        return res.status(502).json({ error: 'Stream unavailable' });
    }
}
