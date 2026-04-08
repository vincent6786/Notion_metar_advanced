// Probes a URL to determine whether it can be embedded in an iframe.
// Checks X-Frame-Options and Content-Security-Policy: frame-ancestors headers.

function setCors(res) {
    const allowed = process.env.ALLOWED_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowed || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (allowed) res.setHeader('Vary', 'Origin');
}

// Reject private/loopback addresses to prevent SSRF
function isPrivateUrl(urlStr) {
    try {
        const { hostname } = new URL(urlStr);
        return /^(localhost$|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|0\.0\.0\.0$)/i
            .test(hostname);
    } catch (e) {
        return true;
    }
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url required' });

    let parsed;
    try {
        parsed = new URL(url);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.json({ embeddable: false, reason: 'Unsupported protocol' });
    }

    if (isPrivateUrl(url)) {
        return res.status(400).json({ error: 'Private URLs not allowed' });
    }

    try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EFB-FrameCheck/1.0)' },
            redirect: 'follow',
            signal: controller.signal,
        });
        clearTimeout(tid);

        const xfo = response.headers.get('X-Frame-Options');
        const csp = response.headers.get('Content-Security-Policy');

        // X-Frame-Options: DENY or SAMEORIGIN both block cross-origin embedding
        if (xfo) {
            const v = xfo.toUpperCase().trim();
            if (v === 'DENY' || v === 'SAMEORIGIN') {
                return res.json({ embeddable: false, reason: 'x-frame-options' });
            }
        }

        // CSP frame-ancestors 'none' or a list that excludes wildcards
        if (csp) {
            const match = csp.match(/frame-ancestors\s+([^;]+)/i);
            if (match) {
                const val = match[1].trim();
                if (val === "'none'" || (!val.includes('*') && !val.includes('http'))) {
                    return res.json({ embeddable: false, reason: 'csp-frame-ancestors' });
                }
            }
        }

        return res.json({ embeddable: true });

    } catch (e) {
        // Network error / timeout — optimistically allow; the iframe will show its own error
        return res.json({ embeddable: true });
    }
}
