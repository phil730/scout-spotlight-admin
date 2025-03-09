// api/conversation.js - Get conversation for a specific session

const { getSessionMessages, getSession } = require('../../lib/session');
const adminAuth = require('./auth');

module.exports = async (req, res) => {
  // Check if request is authorized
  try {
    adminAuth(req, res, async () => {
      try {
        // Get sessionId from query parameters
        const { sessionId } = req.query;
        
        if (!sessionId) {
          return res.status(400).json({ error: 'Session ID is required' });
        }
        
        console.log('Fetching conversation for session:', sessionId);
        
        // Get session details first
        const session = await getSession(sessionId);
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }
        
        // Get all messages for the session
        const messages = await getSessionMessages(sessionId);
        
        // Return conversation data
        return res.status(200).json({
          session,
          messages,
          count: messages.length
        });
      } catch (error) {
        console.error('Error fetching conversation:', error);
        return res.status(500).json({
          error: 'Failed to fetch conversation',
          details: error.message
        });
      }
    });
  } catch (error) {
    // Auth middleware will handle unauthorized responses
    console.error('Authentication error:', error);
  }
};