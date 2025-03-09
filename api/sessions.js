// api/sessions.js - Get all sessions for admin dashboard

const { getAllSessions } = require('../lib/session');
const adminAuth = require('./auth');

module.exports = async (req, res) => {
  // Check if request is authorized
  try {
    adminAuth(req, res, async () => {
      try {
        console.log('Fetching all sessions for admin dashboard');
        
        // Get query parameters for filtering
        const { workshopId } = req.query;
        
        // Build filter object
        const filter = {};
        if (workshopId) {
          filter.workshopId = workshopId;
        }
        
        // Get all sessions from database with optional filter
        const sessions = await getAllSessions(filter);
        
        // Return sessions
        return res.status(200).json({
          sessions,
          count: sessions.length
        });
      } catch (error) {
        console.error('Error fetching sessions:', error);
        return res.status(500).json({
          error: 'Failed to fetch sessions',
          details: error.message
        });
      }
    });
  } catch (error) {
    // Auth middleware will handle unauthorized responses
    console.error('Authentication error:', error);
  }
};