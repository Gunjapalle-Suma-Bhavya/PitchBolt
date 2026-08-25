const express = require('express');
const router = express.Router();
const { makeOutboundCall, sendWhatsAppMessage } = require('../services/twilioService');
const { searchProducts, mockCatalog } = require('../services/ecommerceService');
const { processUserSpeech } = require('../agent/salesAgent');
const CallLog = require('../models/CallLog');

// In-memory fallback if MongoDB connection is offline
let inMemoryCallLogs = [];

/**
 * Endpoint to trigger an outbound AI phone call
 */
router.post('/calls/trigger', async (req, res) => {
  const { phoneNumber, productQuery } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    const result = await makeOutboundCall(phoneNumber, productQuery || 'Sony Headphones');

    const newRecord = {
      callSid: result.callSid,
      phoneNumber,
      initialProductQuery: productQuery || 'Sony Headphones',
      status: 'initiated',
      transcript: [],
      isInterested: false,
      whatsappSent: false,
      langsmithTraceUrl: `https://smith.langchain.com/o/project/${process.env.LANGCHAIN_PROJECT || 'ai-telephony-sales-agent'}`,
      createdAt: new Date()
    };

    try {
      await CallLog.create(newRecord);
    } catch (dbErr) {
      inMemoryCallLogs.unshift(newRecord);
    }

    return res.json({
      success: true,
      message: result.simulated ? 'Simulated Outbound Call Triggered!' : 'Twilio Outbound Call Dispatched!',
      callSid: result.callSid,
      simulated: result.simulated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Endpoint to list all call logs (from MongoDB or in-memory)
 */
router.get('/calls', async (req, res) => {
  try {
    let calls = await CallLog.find().sort({ createdAt: -1 }).limit(50);
    if (!calls || calls.length === 0) {
      calls = inMemoryCallLogs;
    }
    return res.json({ success: true, calls });
  } catch (err) {
    return res.json({ success: true, calls: inMemoryCallLogs });
  }
});

/**
 * Endpoint for interactive browser speech simulation
 */
router.post('/calls/simulate-speech', async (req, res) => {
  const { callSid, phoneNumber, userSpeech, productQuery } = req.body;
  const currentCallSid = callSid || `CALL_SIM_${Date.now()}`;

  let history = [];
  try {
    let callRecord = await CallLog.findOne({ callSid: currentCallSid });
    if (callRecord) history = callRecord.transcript || [];
  } catch (e) {
    const memMatch = inMemoryCallLogs.find((c) => c.callSid === currentCallSid);
    if (memMatch) history = memMatch.transcript || [];
  }

  const agentResult = await processUserSpeech({
    callSid: currentCallSid,
    phoneNumber: phoneNumber || '+15550199',
    userSpeech,
    productContext: productQuery || 'Sony Headphones',
    conversationHistory: history
  });

  // Update in-memory fallback
  const updatedLog = {
    callSid: currentCallSid,
    phoneNumber: phoneNumber || '+15550199',
    initialProductQuery: productQuery || 'Sony Headphones',
    status: agentResult.whatsappSent ? 'completed' : 'in-progress',
    transcript: agentResult.updatedMessages.map((m) => ({
      role: m._getType() === 'human' ? 'user' : 'assistant',
      content: m.content
    })),
    isInterested: agentResult.isInterested,
    whatsappSent: agentResult.whatsappSent,
    langsmithTraceUrl: `https://smith.langchain.com/o/project/${process.env.LANGCHAIN_PROJECT || 'ai-telephony-sales-agent'}`,
    createdAt: new Date()
  };

  const existingIdx = inMemoryCallLogs.findIndex((c) => c.callSid === currentCallSid);
  if (existingIdx >= 0) {
    inMemoryCallLogs[existingIdx] = updatedLog;
  } else {
    inMemoryCallLogs.unshift(updatedLog);
  }

  return res.json({
    success: true,
    callSid: currentCallSid,
    aiResponse: agentResult.responseSpeech,
    isInterested: agentResult.isInterested,
    whatsappSent: agentResult.whatsappSent
  });
});

/**
 * Endpoint to search Amazon/Flipkart products
 */
router.get('/products/search', async (req, res) => {
  const query = req.query.q || '';
  const result = await searchProducts(query);
  return res.json({ success: true, product: result, catalog: mockCatalog });
});

/**
 * Endpoint to test sending direct WhatsApp message
 */
router.post('/whatsapp/send', async (req, res) => {
  const { phoneNumber, message } = req.body;
  const result = await sendWhatsAppMessage(phoneNumber, message || 'Hello from AI Telephony Sales Agent!');
  return res.json(result);
});

module.exports = router;
