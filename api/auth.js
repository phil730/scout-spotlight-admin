// api/auth.js - Simple API key auth for admin dashboard (previously api/admin/auth.js)
const adminAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const adminApiKey = process.env.ADMIN_API_KEY;
  
  if (!adminApiKey) {
    console.error('ADMIN_API_KEY not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  if (!apiKey || apiKey !== adminApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // API key is valid, proceed
  next();
};

module.exports = adminAuth;