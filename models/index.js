// models/index.js
const mongoose = require('mongoose');

// Session Schema - Stores metadata about each conversation session
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  threadId: { type: String, required: true },
  assistantId: { type: String, required: true },
  innovationName: { type: String, required: true },
  workshopId: { type: String, default: null },
  completed: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now }
});

// Message Schema - Stores all messages in conversations
const messageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Assessment Schema - Stores completed assessments
const assessmentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  innovationName: { type: String, required: true },
  problemValue: { type: Number, min: 1, max: 5, required: true },
  solutionFit: { type: Number, min: 1, max: 5, required: true },
  valueForMoney: { type: Number, min: 1, max: 5, required: true },
  totalScore: { type: Number, required: true },
  recommendation: { type: String, required: true },
  completed: { type: Date, default: Date.now }
});

// Create models
const Session = mongoose.model('Session', sessionSchema);
const Message = mongoose.model('Message', messageSchema);
const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = {
  Session,
  Message,
  Assessment
};