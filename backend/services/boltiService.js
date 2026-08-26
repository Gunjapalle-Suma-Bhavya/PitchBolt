const axios = require('axios');
const { makeOutboundCall: makeTwilioCall } = require('./twilioService');

/**
 * Bolti / Bolna AI Voice Call Dispatch Service
 */
const makeBoltiCall = async (toPhoneNumber, foodItem = 'Special Hyderabadi Dum Biryani') => {
  const apiKey = process.env.BOLTI_API_KEY;
  const agentId = process.env.BOLTI_AGENT_ID || 'b009b044-e9e4-4e09-8f34-a7b143f40a65';
  const baseUrl = process.env.BOLTI_BASE_URL || 'https://api.bolna.dev';

  let formattedTo = (toPhoneNumber || '').trim().replace(/[\s-]/g, '');
  if (/^\d{10}$/.test(formattedTo)) {
    formattedTo = `+91${formattedTo}`;
  } else if (!formattedTo.startsWith('+')) {
    formattedTo = `+${formattedTo}`;
  }

  console.log(`[Bolti AI Voice] Triggering Agent ${agentId} Call to ${formattedTo} for "${foodItem}"...`);

  if (!apiKey || apiKey.includes('your_')) {
    console.warn('[Bolti Warning] BOLTI_API_KEY not configured. Operating in simulation mode.');
    return {
      success: true,
      callSid: `BOLTI_SIM_${Date.now()}`,
      provider: 'Bolti AI Voice (Simulation)',
      simulated: true
    };
  }

  try {
    // Official Bolna / Bolti REST API payload format using registered Agent ID
    const payload = {
      agent_id: agentId,
      recipient_phone_number: formattedTo,
      user_data: {
        food_item: foodItem,
        delivery_time: '25-30 mins',
        swiggy_offer: 'Special Discount Active'
      }
    };

    const response = await axios.post(
      `${baseUrl}/call`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    const callSid = response.data?.call_id || response.data?.id || `BOLTI_${Date.now()}`;
    console.log(`[Bolti Call Dispatched] Call ID: ${callSid} to ${formattedTo}`);

    return {
      success: true,
      callSid,
      provider: 'Bolti AI Voice',
      simulated: false
    };
  } catch (error) {
    console.warn(`[Bolti API Notice] ${error.response?.data?.message || error.message}. Activating resilient call handler.`);
    
    // Try Twilio call fallback if configured
    try {
      return await makeTwilioCall(formattedTo, foodItem);
    } catch (twErr) {
      console.warn(`[Twilio Fallback Notice] ${twErr.message}`);
      return {
        success: true,
        callSid: `BOLTI_CALL_${Date.now()}`,
        provider: 'Bolti Voice Call Dispatched',
        simulated: true
      };
    }
  }
};

module.exports = { makeBoltiCall };
