// /api/stream.js  ← create this new file alongside your other api files

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
        res.status(502).json({ error: 'Stream unavailable' });
    }
}
// ```

// ---

// ## ⚠️ Vercel Warning First

// Before you get excited — Vercel Serverless Functions have a **10 second execution timeout** on the free/hobby plan, and **60 seconds on Pro**. Audio streams are continuous and never "finish", so **Vercel will kill the connection** after the timeout.

// This is a fundamental mismatch. Your options:

// | Platform | Streaming Support | Notes |
// |---|---|---|
// | Vercel | ❌ Poor | Timeout kills audio streams |
// | Railway | ✅ Good | Persistent connections, easy deploy |
// | Render | ✅ Good | Free tier available |
// | Fly.io | ✅ Good | Very flexible |
// | VPS (DigitalOcean etc.) | ✅ Best | Full control |

// If you want to keep everything on Vercel, the proxy approach won't reliably work — users will get choppy or cut-off audio. Worth knowing before investing time into it.

// ---

// ## Connection Limiting Discussion

// Since you want to keep it small and controlled, here's how the system would work conceptually:

// **The idea:** A `MAX_STREAM_CONNECTIONS` value stored in your database (you already have one for cloud backup). The proxy endpoint checks active connections before allowing a new one. An admin panel in Settings lets you change the limit with a password.

// **Architecture:**
// ```
// User opens audio
//     ↓
// /api/stream checks: current_connections < max_allowed?
//     ↓ YES                    ↓ NO
// Register connection      Return 429 "Stream full"
// Pipe audio               Frontend shows friendly message
// On disconnect → unregister
// ```

// **The admin control flow you described would work like this:**

// - In your Settings tab, below the existing API Usage Monitor section (since it already has the password pattern you built), add a "Stream Control" card
// - Admin enters password (same `ADMIN_PASSWORD` Vercel env variable you already use for API stats)
// - Shows current active connections + the limit slider/input
// - Save updates the value in your existing database

// **What needs storing:**
// - `max_stream_connections` — the limit (e.g. default 5)
// - Active connection count — this is trickier on serverless (see below)

// **The hard problem with Vercel specifically:**

// Serverless functions are stateless and can run on different instances simultaneously, so you can't track "how many connections are open right now" in memory. You'd need to store it in your database with a timestamp:
// ```
// When stream opens:  INSERT { id, started_at } into active_streams
// While streaming:    UPDATE { last_seen_at } every 30 seconds  
// When stream closes: DELETE the record
// On new connection:  COUNT records where last_seen_at < 90 seconds ago
