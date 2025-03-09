// lib/session.js - Admin version (read-only operations)
const { connectToDatabase } = require('./db');
const { Session, Message } = require('../models');

// Get session by ID
async function getSession(sessionId) {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    // Retrieve session from database
    const session = await Session.findOne({ sessionId });
    return session;
  } catch (error) {
    console.error('Error retrieving session:', error);
    throw error;
  }
}

// Get all messages for a session (for admin dashboard)
async function getSessionMessages(sessionId) {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    const messages = await Message.find({ sessionId }).sort({ timestamp: 1 });
    return messages;
  } catch (error) {
    console.error('Error retrieving session messages:', error);
    throw error;
  }
}

// Get all sessions (for admin dashboard)
async function getAllSessions(filter = {}) {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    const sessions = await Session.find(filter).sort({ created: -1 });
    return sessions;
  } catch (error) {
    console.error('Error retrieving all sessions:', error);
    throw error;
  }
}

module.exports = {
  getSession,
  getSessionMessages,
  getAllSessions
};