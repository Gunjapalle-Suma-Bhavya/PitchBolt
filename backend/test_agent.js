require('dotenv').config();
const { processUserSpeech } = require('./agent/salesAgent');

async function runLocalAgentTest() {
  console.log('--- Starting LangGraph Telephony Sales Agent Test ---');
  
  const callSid = `TEST_CALL_${Date.now()}`;
  const phoneNumber = '+15550199';
  const productContext = 'Sony WH-1000XM5 Headphones';

  // Step 1: Simulated Initial Customer Speech
  console.log('\n[Step 1] Customer asks about headphones...');
  const step1 = await processUserSpeech({
    callSid,
    phoneNumber,
    userSpeech: 'Tell me about the price and noise cancellation of these headphones.',
    productContext
  });
  console.log('🤖 AI Response:', step1.responseSpeech);
  console.log('📊 Interested:', step1.isInterested, '| WhatsApp Sent:', step1.whatsappSent);

  // Step 2: Customer expresses interest & asks for WhatsApp link
  console.log('\n[Step 2] Customer expresses interest...');
  const step2 = await processUserSpeech({
    callSid,
    phoneNumber,
    userSpeech: 'That sounds amazing! Yes, please send me the link on WhatsApp.',
    productContext,
    conversationHistory: [
      { role: 'user', content: 'Tell me about the price and noise cancellation of these headphones.' },
      { role: 'assistant', content: step1.responseSpeech }
    ]
  });
  console.log('🤖 AI Response:', step2.responseSpeech);
  console.log('📊 Interested:', step2.isInterested, '| WhatsApp Sent:', step2.whatsappSent);

  console.log('\n--- LangGraph Telephony Sales Agent Test Completed Successfully ---');
  process.exit(0);
}

runLocalAgentTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
