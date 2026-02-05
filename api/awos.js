export default async function handler(req, res) {
    // 1. Fetch the raw "Text" page from KMHR
    const targetUrl = 'http://kmhr.awosnet.com/text.php'; 

    try {
        const response = await fetch(targetUrl);
        let html = await response.text();

        // 2. DEFINE THE COCKPIT STYLE
        // We inject this CSS directly into the page header
        const customStyle = `
            <style>
                /* Force Dark Mode & Apple Font */
                body {
                    background-color: #000000 !important;
                    color: #ffffff !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif !important;
                    margin: 0 !important;
                    padding: 20px !important;
                    -webkit-font-smoothing: antialiased;
                }

                /* Style the layout if it uses tables (likely) */
                table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin-bottom: 20px !important;
                }

                /* The Rows */
                tr {
                    border-bottom: 1px solid #333 !important;
                }
                tr:last-child {
                    border-bottom: none !important;
                }

                /* The Cells (Generic targeting) */
                td {
                    padding: 12px 0 !important;
                    vertical-align: middle !important;
                }

                /* LABEL Column (Assume 1st column) */
                td:first-child {
                    color: #8e8e93 !important; /* Sub-text gray */
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    width: 40% !important;
                }

                /* VALUE Column (Assume 2nd column) */
                td:last-child {
                    color: #ffffff !important;
                    font-size: 17px !important;
                    font-weight: 600 !important;
                    text-align: right !important;
                    font-variant-numeric: tabular-nums !important;
                }

                /* Special Highlighting */
                /* If the text contains "Knots", make it blue (Wind) */
                td:last-child:contains("Knots") { color: #0a84ff !important; }
                
                /* Remove any weird old-school formatting tags */
                font { color: inherit !important; face: inherit !important; }
                b, strong { font-weight: 700 !important; }
            </style>
        `;

        // 3. INJECT THE STYLE
        // We look for the <head> tag. If it exists, put style there.
        // If not (some old pages don't have it), we prepend to body or just string start.
        if (html.includes('<head>')) {
            html = html.replace('<head>', '<head>' + customStyle);
        } else {
            html = customStyle + html;
        }

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);

    } catch (error) {
        return res.status(500).send('Error fetching remote AWOS');
    }
}
