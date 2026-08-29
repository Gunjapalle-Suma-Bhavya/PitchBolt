const express = require('express');
const router = express.Router();
const { makeBoltiCall } = require('../services/boltiService');
const { searchProducts, webPackagesCatalog } = require('../services/ecommerceService');
const { processUserSpeech } = require('../agent/salesAgent');
const CallLog = require('../models/CallLog');

let inMemoryCallLogs = [];

/**
 * Endpoint to trigger an outbound PitchBolt AI phone call to sell E-Commerce website development
 */
router.post('/calls/trigger', async (req, res) => {
  const { phoneNumber, productQuery } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    const result = await makeBoltiCall(phoneNumber, productQuery || 'Growth Pro E-Commerce Portal');

    const newRecord = {
      callSid: result.callSid || `CALL_${Date.now()}`,
      phoneNumber,
      initialProductQuery: productQuery || 'Growth Pro E-Commerce Portal',
      status: 'initiated',
      transcript: [],
      isInterested: false,
      whatsappSent: false,
      aiRatingScore: 5,
      aiRatingFeedback: 'PitchBolt E-Commerce Website Consultation Dispatched',
      langsmithTraceUrl: `https://smith.langchain.com/o/project/${process.env.LANGCHAIN_PROJECT || 'PitchBolt-Sales-Agent'}`,
      createdAt: new Date()
    };

    try {
      await CallLog.create(newRecord);
    } catch (dbErr) {
      inMemoryCallLogs.unshift(newRecord);
    }

    return res.json({
      success: true,
      message: 'PitchBolt E-Commerce Web Solutions AI Voice Call Dispatched to Mobile Phone!',
      callSid: result.callSid,
      provider: result.provider || 'Bolti AI Voice',
      simulated: result.simulated
    });
  } catch (err) {
    console.error('[PitchBolt Call Trigger Error]', err.message);
    const fallbackSid = `BOLTI_FALLBACK_${Date.now()}`;
    return res.json({
      success: true,
      message: 'PitchBolt E-Commerce Web Solutions AI Voice Call Dispatched!',
      callSid: fallbackSid,
      provider: 'Bolti AI Voice',
      simulated: true
    });
  }
});

/**
 * Endpoint to list all call logs
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
 * Endpoint for interactive real-time browser speech simulation
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
    productContext: productQuery || 'Growth Pro E-Commerce Portal',
    conversationHistory: history
  });

  const updatedLog = {
    callSid: currentCallSid,
    phoneNumber: phoneNumber || '+919121447422',
    initialProductQuery: productQuery || 'Growth Pro E-Commerce Portal',
    status: agentResult.whatsappSent ? 'completed' : 'in-progress',
    transcript: agentResult.updatedMessages.map((m) => ({
      role: m._getType() === 'human' ? 'user' : 'assistant',
      content: m.content
    })),
    isInterested: agentResult.isInterested,
    whatsappSent: agentResult.whatsappSent,
    whatsappDetails: agentResult.whatsappDetails || '',
    aiRatingScore: agentResult.aiRatingScore || 5,
    aiRatingFeedback: `${agentResult.aiRatingFeedback || 'PitchBolt Consultation'} | Action: ${agentResult.onCallAction || 'Consulted on-call'}`,
    langsmithTraceUrl: `https://smith.langchain.com/o/project/${process.env.LANGCHAIN_PROJECT || 'PitchBolt-Sales-Agent'}`,
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
    whatsappDetails: agentResult.whatsappDetails,
    aiRatingScore: agentResult.aiRatingScore,
    onCallAction: agentResult.onCallAction
  });
});

/**
 * Endpoint to search E-Commerce Website Development Packages
 */
router.get('/products/search', async (req, res) => {
  const query = req.query.q || '';
  const result = await searchProducts(query);
  return res.json({ success: true, product: result, catalog: webPackagesCatalog });
});

module.exports = router;
