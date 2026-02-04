export default async function handler(req, res) {
    // This allows your HTTPS app to read the HTTP KMHR site securely
    const targetUrl = 'http://kmhr.awosnet.com/text.php'; 

    try {
        const response = await fetch(targetUrl);
        const html = await response.text();
        // Fix relative links so they don't break
        const modifiedHtml = html.replace('<head>', '<head><base href="http://kmhr.awosnet.com/">');
        
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(modifiedHtml);
    } catch (error) {
        return res.status(500).send('Error fetching remote AWOS');
    }
}
