// lib/db.js - Database connection module
const mongoose = require('mongoose');

// Connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Track connection state
let isConnected = false;

// Connection options
const options = {
  useUnifiedTopology: true,
};

/**
 * Connect to MongoDB database
 */
async function connectToDatabase() {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    console.log('Connecting to MongoDB...');
    const db = await mongoose.connect(MONGODB_URI, options);
    
    isConnected = db.connections[0].readyState === 1; // 1 = connected
    console.log('MongoDB connected successfully');

    // Set up event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      isConnected = false;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

module.exports = {
  connectToDatabase,
  mongoose
};