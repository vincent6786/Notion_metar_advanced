export default function handler(req, res) {
  const BYPASS_KEY    = process.env.MAINTENANCE_BYPASS_KEY || 'admin';
  const BYPASS_COOKIE = 'efb_bypass';

  // Check for admin bypass cookie
  const cookies = req.headers.cookie || '';
  const hasBypass = cookies
    .split(';')
    .some(c => c.trim() === `${BYPASS_COOKIE}=${BYPASS_KEY}`);

  res.status(200).json({
    maintenance: process.env.MAINTENANCE_MODE === 'true' && !hasBypass
  });
}
export default function handler(req, res) {
  res.json({
    maintenance_raw: process.env.MAINTENANCE_MODE,
    maintenance_type: typeof process.env.MAINTENANCE_MODE
  });
}
