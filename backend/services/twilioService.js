const twilio = require('twilio');

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken || accountSid.includes('your_')) {
    console.warn('[Twilio Service Warning] Twilio credentials not configured in .env. Operating in dry-run simulation mode.');
    return null;
  }
  return twilio(accountSid, authToken);
};

/**
 * Helper to auto-format phone numbers (e.g. 9392223188 -> +919392223188)
 */
const formatPhoneNumber = (numStr) => {
  let clean = (numStr || '').trim().replace(/[\s-]/g, '');
  if (/^\d{10}$/.test(clean)) {
    return `+91${clean}`;
  }
  if (!clean.startsWith('+')) {
    return `+${clean}`;
  }
  return clean;
};

/**
 * Trigger an outbound call to a customer's phone number
 */
const makeOutboundCall = async (toPhoneNumber, initialProduct = '') => {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+17372212163';
  const publicBackendUrl = process.env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const formattedTo = formatPhoneNumber(toPhoneNumber);

  const webhookUrl = `${publicBackendUrl}/api/twilio/voice/gather?product=${encodeURIComponent(initialProduct)}`;

  if (!client) {
    console.log(`[Twilio Simulation] Outbound call requested to ${formattedTo} with product "${initialProduct}"`);
    const mockCallSid = `CA_SIMULATED_${Date.now()}`;
    return { success: true, callSid: mockCallSid, simulated: true };
  }

  try {
    // Simplified parameters for Twilio Trial & Paid Accounts
    const callParams = {
      url: webhookUrl,
      to: formattedTo,
      from: fromNumber
    };

    const call = await client.calls.create(callParams);
    console.log(`[Twilio Call Dispatched] Call SID: ${call.sid} to ${formattedTo}`);
    return { success: true, callSid: call.sid, simulated: false };
  } catch (error) {
    console.error(`[Twilio Call Error] ${error.message}`);
    if (error.message.includes('disallowed parameters') || error.message.includes('trial accounts')) {
      console.log(`[Twilio Notice] Twilio Trial Account restriction detected. Ensure ${formattedTo} is added to Verified Caller IDs in Twilio Console.`);
    }
    throw error;
  }
};

/**
 * Send an instant WhatsApp message with product details & buy link
 */
const sendWhatsAppMessage = async (toPhoneNumber, messageBody) => {
  const client = getTwilioClient();
  let fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';
  
  if (!fromWhatsApp.startsWith('whatsapp:')) {
    fromWhatsApp = `whatsapp:${fromWhatsApp}`;
  }

  let formattedTo = formatPhoneNumber(toPhoneNumber);
  if (!formattedTo.startsWith('whatsapp:')) {
    formattedTo = `whatsapp:${formattedTo}`;
  }

  if (!client) {
    console.log(`[Twilio WhatsApp Simulation] Message sent to ${formattedTo}: "${messageBody}"`);
    return { success: true, messageSid: `SM_SIMULATED_${Date.now()}`, simulated: true };
  }

  try {
    const message = await client.messages.create({
      from: fromWhatsApp,
      to: formattedTo,
      body: messageBody
    });
    console.log(`[Twilio WhatsApp Sent] SID: ${message.sid} to ${formattedTo}`);
    return { success: true, messageSid: message.sid, simulated: false };
  } catch (error) {
    console.error(`[Twilio WhatsApp Error] ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = { makeOutboundCall, sendWhatsAppMessage };
