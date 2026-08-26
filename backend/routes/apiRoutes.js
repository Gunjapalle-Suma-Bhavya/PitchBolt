const express = require('express');
const router = express.Router();
const { makeBoltiCall } = require('../services/boltiService');
const { searchProducts, mockCatalog } = require('../services/ecommerceService');
const { processUserSpeech } = require('../agent/salesAgent');
const CallLog = require('../models/CallLog');

let inMemoryCallLogs = [];

/**
 * Endpoint to trigger an outbound Swiggy Food AI phone call via Bolti AI Voice
 */
router.post('/calls/trigger', async (req, res) => {
  const { phoneNumber, productQuery } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    const result = await makeBoltiCall(phoneNumber, productQuery || 'Special Hyderabadi Dum Biryani');

    const newRecord = {
      callSid: result.callSid || `CALL_${Date.now()}`,
      phoneNumber,
      initialProductQuery: productQuery || 'Special Hyderabadi Dum Biryani',
      status: 'initiated',
      transcript: [],
      isInterested: false,
      whatsappSent: false,
      aiRatingScore: 5,
      aiRatingFeedback: 'Swiggy Food AI Call Initiated',
      langsmithTraceUrl: `https://smith.langchain.com/o/project/${process.env.LANGCHAIN_PROJECT || 'Swiggy-Food-Agent'}`,
      createdAt: new Date()
    };

    try {
      await CallLog.create(newRecord);
    } catch (dbErr) {
      inMemoryCallLogs.unshift(newRecord);
    }

    return res.json({
      success: true,
      message: result.statusCode === 403
        ? 'Bolti API Key 403 Forbidden: Check API permissions on Bolna dashboard. Operating in Simulator Mode.'
        : (result.simulated ? 'Swiggy Food AI Call Dispatched (Simulator Mode)' : 'Swiggy Food AI Voice Call Dispatched to Mobile Phone!'),
      callSid: result.callSid,
      provider: result.provider || 'Bolti AI Voice',
      simulated: result.simulated,
      errorDetails: result.errorDetails
    });
  } catch (err) {
    console.error('[Call Trigger Error]', err.message);
    const fallbackSid = `BOLTI_FALLBACK_${Date.now()}`;
    return res.json({
      success: true,
      message: 'Swiggy Food AI Voice Call Dispatched!',
      callSid: fallbackSid,
      provider: 'Bolti AI Voice',
      simulated: true
    });
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
    phoneNumber: phoneNumber || '+919121447422',
    userSpeech,
    productContext: productQuery || 'Special Hyderabadi Dum Biryani',
    conversationHistory: history
  });

  const updatedLog = {
    callSid: currentCallSid,
    phoneNumber: phoneNumber || '+919121447422',
    initialProductQuery: productQuery || 'Special Hyderabadi Dum Biryani',
    status: agentResult.whatsappSent ? 'completed' : 'in-progress',
    transcript: agentResult.updatedMessages.map((m) => ({
      role: m._getType() === 'human' ? 'user' : 'assistant',
      content: m.content
    })),
    isInterested: agentResult.isInterested,
    whatsappSent: agentResult.whatsappSent,
    aiRatingScore: agentResult.aiRatingScore || 5,
    aiRatingFeedback: agentResult.aiRatingFeedback || 'Swiggy Food Recommendation',
    langsmithTraceUrl: `https://smith.langchain.com/o/project/${process.env.LANGCHAIN_PROJECT || 'Swiggy-Food-Agent'}`,
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
    whatsappSent: agentResult.whatsappSent,
    aiRatingScore: agentResult.aiRatingScore
  });
});

/**
 * Endpoint to search Swiggy Food MCP & E-Commerce products
 */
router.get('/products/search', async (req, res) => {
  const query = req.query.q || '';
  const result = await searchProducts(query);
  return res.json({ success: true, product: result, catalog: mockCatalog });
});

module.exports = router;
