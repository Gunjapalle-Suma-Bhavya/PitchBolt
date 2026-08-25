const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { processUserSpeech } = require('../agent/salesAgent');
const CallLog = require('../models/CallLog');

/**
 * Handle Twilio Voice Webhook & Speech Recognition Gather Loop
 */
router.all('/voice/gather', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  const callSid = req.body.CallSid || req.query.CallSid || `CALL_${Date.now()}`;
  const phoneNumber = req.body.From || req.query.From || req.body.To || req.query.To || 'Customer';
  const userSpeech = req.body.SpeechResult || req.query.SpeechResult || '';
  const productContext = req.query.product || req.body.product || 'Sony Headphones';

  console.log(`[Twilio Webhook] Received call: ${callSid} | User said: "${userSpeech}"`);

  try {
    // Retrieve past conversation history for this callSid from MongoDB
    let callRecord = await CallLog.findOne({ callSid });
    const history = callRecord ? callRecord.transcript : [];

    // Initial greeting if user hasn't spoken yet
    if (!userSpeech && history.length === 0) {
      const initialGreeting = `Hello! I am calling from E-Commerce Deals regarding the ${productContext}. Are you interested in hearing a 1-minute quick special discount offer?`;
      
      // Save initial system message to call record
      await CallLog.findOneAndUpdate(
        { callSid },
        {
          $set: {
            phoneNumber,
            initialProductQuery: productContext,
            status: 'in-progress',
            transcript: [{ role: 'assistant', content: initialGreeting }]
          }
        },
        { upsert: true, new: true }
      ).catch(() => {});

      const gather = twiml.gather({
        input: ['speech'],
        speechTimeout: 'auto',
        timeout: 4,
        action: `/api/twilio/voice/gather?product=${encodeURIComponent(productContext)}`,
        method: 'POST'
      });
      gather.say({ voice: 'Polly.Joanna-Neural' }, initialGreeting);
      
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // Process speech input through LangGraph AI agent
    const agentResult = await processUserSpeech({
      callSid,
      phoneNumber,
      userSpeech,
      productContext,
      conversationHistory: history
    });

    // Check if conversation completed or customer said goodbye
    const isFinished = agentResult.whatsappSent || /bye|goodbye|thank you|no thanks/i.test(userSpeech);

    if (isFinished) {
      twiml.say({ voice: 'Polly.Joanna-Neural' }, agentResult.responseSpeech);
      twiml.say({ voice: 'Polly.Joanna-Neural' }, 'Have a wonderful day! Goodbye.');
      twiml.hangup();

      await CallLog.findOneAndUpdate({ callSid }, { status: 'completed' }).catch(() => {});
    } else {
      const gather = twiml.gather({
        input: ['speech'],
        speechTimeout: 'auto',
        timeout: 4,
        action: `/api/twilio/voice/gather?product=${encodeURIComponent(productContext)}`,
        method: 'POST'
      });
      gather.say({ voice: 'Polly.Joanna-Neural' }, agentResult.responseSpeech);
    }
  } catch (error) {
    console.error('[Twilio Webhook Error]', error);
    twiml.say({ voice: 'Polly.Joanna-Neural' }, 'Sorry, I am having trouble connecting right now. Let me message you the product details instead.');
    twiml.hangup();
  }

  res.type('text/xml');
  return res.send(twiml.toString());
});

module.exports = router;
