const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  callSid: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  initialProductQuery: { type: String, default: 'General Inquiry' },
  status: { type: String, enum: ['initiated', 'in-progress', 'completed', 'failed'], default: 'initiated' },
  transcript: [
    {
      role: { type: String, enum: ['user', 'assistant', 'system'] },
      content: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  isInterested: { type: Boolean, default: false },
  whatsappSent: { type: Boolean, default: false },
  whatsappDetails: { type: String, default: '' },
  
  // AI Conversation Rating & Evaluation (Powered by OpenAI & LangSmith)
  aiRatingScore: { type: Number, default: 3, min: 1, max: 5 },
  aiRatingFeedback: { type: String, default: 'Neutral lead engagement' },
  aiSummary: { type: String, default: 'Call initiated' },

  langsmithTraceUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CallLog', callLogSchema);
