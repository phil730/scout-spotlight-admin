// api/stats.js - Get dashboard statistics

const { Session, Assessment } = require('../../models');
const { connectToDatabase } = require('../../lib/db');
const adminAuth = require('./auth');

module.exports = async (req, res) => {
  // Check if request is authorized
  try {
    adminAuth(req, res, async () => {
      try {
        console.log('Generating stats for admin dashboard');
        
        // Ensure database connection
        await connectToDatabase();
        
        // Get total number of sessions
        const totalSessions = await Session.countDocuments({});
        
        // Get total number of completed assessments
        const completedAssessments = await Assessment.countDocuments({});
        
        // Get average assessment score
        const aggregateResult = await Assessment.aggregate([
          {
            $group: {
              _id: null,
              averageScore: { $avg: '$totalScore' }
            }
          }
        ]);
        
        const averageScore = aggregateResult.length > 0 
          ? parseFloat(aggregateResult[0].averageScore.toFixed(1)) 
          : 0;
        
        // Get highest rated innovation
        const highestRated = await Assessment.findOne({})
          .sort({ totalScore: -1 })
          .limit(1);
        
        // Return statistics
        return res.status(200).json({
          stats: {
            totalSessions,
            completedAssessments,
            averageScore,
            highestRated: highestRated ? {
              innovationName: highestRated.innovationName,
              score: highestRated.totalScore
            } : null
          }
        });
      } catch (error) {
        console.error('Error generating stats:', error);
        return res.status(500).json({
          error: 'Failed to generate stats',
          details: error.message
        });
      }
    });
  } catch (error) {
    // Auth middleware will handle unauthorized responses
    console.error('Authentication error:', error);
  }
};