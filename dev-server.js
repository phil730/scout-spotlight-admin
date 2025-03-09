// dev-server.js for admin project
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

// Import admin API handlers
const authHandler = require('./api/auth');
const statsHandler = require('./api/stats');
const sessionsHandler = require('./api/sessions');
const assessmentsHandler = require('./api/assessments');
const assessmentHandler = require('./api/assessment');
const conversationHandler = require('./api/conversation');

const app = express();
// Use a dynamic port that won't conflict with the main app
const PORT = process.env.PORT || process.env.DEV_PORT || 3001;

// Log with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [ADMIN] ${message}`);
}

// Error logging
function logError(message, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ADMIN] ERROR: ${message}`, error);
  if (error && error.stack) {
    console.error(`[${timestamp}] [ADMIN] STACK:`, error.stack);
  }
}

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Log all requests
app.use((req, res, next) => {
  log(`${req.method} ${req.path}`);
  next();
});

// Simplified authentication middleware for development
const devAuthMiddleware = (req, res, next) => {
  // For local development, you can skip auth or use a simple check
  const apiKey = req.headers['x-api-key'];
  const adminApiKey = process.env.ADMIN_API_KEY || 'dev-admin-key';
  
  if (!apiKey || apiKey !== adminApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Helper to wrap API handlers that expect auth middleware
const withAuth = (handler) => {
  return (req, res) => {
    // We're simulating the auth middleware calling the handler
    devAuthMiddleware(req, res, () => {
      handler(req, res);
    });
  };
};

// Admin API Routes
app.get('/api/stats', withAuth(statsHandler));
app.get('/api/sessions', withAuth(sessionsHandler));
app.get('/api/assessments', withAuth(assessmentsHandler));
app.get('/api/assessment', withAuth(assessmentHandler));
app.get('/api/conversation', withAuth(conversationHandler));

// Simple ping endpoint for testing
app.get('/api/ping', (req, res) => {
  log('Ping request received');
  res.status(200).json({ message: 'Pong! Admin server is up and running.' });
});

// Exit gracefully if port is in use
const server = app.listen(PORT, () => {
  log(`Admin server running at http://localhost:${PORT}/`);
  log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Show helpful messages
  log(`Make sure your .env file includes:`);
  log(`  - MONGODB_URI: ${process.env.MONGODB_URI ? 'Found ✓' : 'Missing ✗'}`);
  log(`  - ADMIN_API_KEY: ${process.env.ADMIN_API_KEY ? 'Found ✓' : 'Missing (using default dev key) ✗'}`);
  
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logError(`Port ${PORT} is already in use. Try setting a different port with:`, null);
    log('export PORT=3002 && node dev-server.js');
    process.exit(1);
  } else {
    logError('Error starting server:', err);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });
});