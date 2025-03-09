// api/assessment.js - Get details for a specific assessment

const { Assessment } = require('../../models');
const { connectToDatabase } = require('../../lib/db');
const adminAuth = require('./auth');

module.exports = async (req, res) => {
  // Check if request is authorized
  try {
    adminAuth(req, res, async () => {
      try {
        // Get assessmentId from query parameters
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({ error: 'Assessment ID is required' });
        }
        
        console.log('Fetching assessment details for:', id);
        
        // Ensure database connection
        await connectToDatabase();
        
        // Get assessment details
        const assessment = await Assessment.findOne({ _id: id });
        
        if (!assessment) {
          return res.status(404).json({ error: 'Assessment not found' });
        }
        
        // Return assessment details
        return res.status(200).json({
          assessment
        });
      } catch (error) {
        console.error('Error fetching assessment details:', error);
        return res.status(500).json({
          error: 'Failed to fetch assessment details',
          details: error.message
        });
      }
    });
  } catch (error) {
    // Auth middleware will handle unauthorized responses
    console.error('Authentication error:', error);
  }
};