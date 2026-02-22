export default function handler(req, res) {
  const BYPASS_KEY    = process.env.MAINTENANCE_BYPASS_KEY || 'admin';
  const BYPASS_COOKIE = 'efb_bypass';
  const ADMIN_CODE    = process.env.ADMIN_PASSCODE || 'admin';

  const cookies = req.headers.cookie || '';
  const hasBypass = cookies
    .split(';')
    .some(c => c.trim() === `${BYPASS_COOKIE}=${BYPASS_KEY}`);

  res.status(200).json({
    maintenance: process.env.MAINTENANCE_MODE === 'true' && !hasBypass,
    adminCode:   process.env.MAINTENANCE_MODE === 'true' ? ADMIN_CODE : null
  });
}
