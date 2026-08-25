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
 * Trigger an outbound call to a customer's phone number
 */
const makeOutboundCall = async (toPhoneNumber, initialProduct = '') => {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const publicBackendUrl = process.env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const webhookUrl = `${publicBackendUrl}/api/twilio/voice/gather?product=${encodeURIComponent(initialProduct)}`;

  if (!client) {
    console.log(`[Twilio Simulation] Outbound call requested to ${toPhoneNumber} with product "${initialProduct}"`);
    const mockCallSid = `CA_SIMULATED_${Date.now()}`;
    return { success: true, callSid: mockCallSid, simulated: true };
  }

  try {
    const call = await client.calls.create({
      url: webhookUrl,
      to: toPhoneNumber,
      from: fromNumber,
      method: 'POST'
    });
    console.log(`[Twilio Call Started] Call SID: ${call.sid} to ${toPhoneNumber}`);
    return { success: true, callSid: call.sid, simulated: false };
  } catch (error) {
    console.error(`[Twilio Call Error] ${error.message}`);
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

  let formattedTo = toPhoneNumber.trim();
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
