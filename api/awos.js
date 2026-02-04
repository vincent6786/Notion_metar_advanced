// Secure proxy for HTTP content
export default async function handler(req, res) {
    const targetUrl = 'http://kmhr.awosnet.com/text.php'; // Targeting the text version directly

    try {
        const response = await fetch(targetUrl);
        const html = await response.text();

        // Add a base tag so relative links/images in the HTML still work
        const modifiedHtml = html.replace('<head>', '<head><base href="http://kmhr.awosnet.com/">');

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(modifiedHtml);
    } catch (error) {
        return res.status(500).send('Error fetching remote AWOS');
    }
}
