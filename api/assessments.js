// api/assessments.js - Get all completed assessments

const { Assessment } = require('../models');
const { connectToDatabase } = require('../lib/db');
const adminAuth = require('./auth');

module.exports = async (req, res) => {
  // Check if request is authorized
  try {
    adminAuth(req, res, async () => {
      try {
        console.log('Fetching all assessments for admin dashboard');
        
        // Ensure database connection
        await connectToDatabase();
        
        // Get all assessments
        const assessments = await Assessment.find({}).sort({ completed: -1 });
        
        // Return assessments
        return res.status(200).json({
          assessments,
          count: assessments.length
        });
      } catch (error) {
        console.error('Error fetching assessments:', error);
        return res.status(500).json({
          error: 'Failed to fetch assessments',
          details: error.message
        });
      }
    });
  } catch (error) {
    // Auth middleware will handle unauthorized responses
    console.error('Authentication error:', error);
  }
};