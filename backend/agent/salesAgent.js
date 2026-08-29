const { ChatOpenAI } = require('@langchain/openai');
const { StateGraph, END, START } = require('@langchain/langgraph');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const { searchProducts } = require('../services/ecommerceService');
const CallLog = require('../models/CallLog');

// Initialize OpenAI LLM
const getLLM = () => {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey || apiKey.includes('your_') || apiKey.length < 20) {
    return null;
  }

  // Support OpenRouter keys starting with sk-or- or custom OPENAI_BASE_URL
  const baseURL = process.env.OPENAI_BASE_URL || (apiKey.startsWith('sk-or-') ? 'https://openrouter.ai/api/v1' : undefined);

  return new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.7,
    openAIApiKey: apiKey,
    maxRetries: 0,
    configuration: baseURL ? { baseURL } : undefined
  });
};

/**
 * Graph State Channels
 */
const channels = {
  messages: { value: (x, y) => x.concat(y), default: () => [] },
  phoneNumber: { value: (x, y) => y ?? x, default: () => '' },
  productContext: { value: (x, y) => y ?? x, default: () => 'Growth Pro E-Commerce Portal' },
  isInterested: { value: (x, y) => y ?? x, default: () => false },
  whatsappSent: { value: (x, y) => y ?? x, default: () => false },
  whatsappDetails: { value: (x, y) => y ?? x, default: () => '' },
  aiRatingScore: { value: (x, y) => y ?? x, default: () => 3 },
  aiRatingFeedback: { value: (x, y) => y ?? x, default: () => 'Engaged inquiry' },
  aiSummary: { value: (x, y) => y ?? x, default: () => 'Call in progress' },
  onCallAction: { value: (x, y) => y ?? x, default: () => 'Consulting client' },
  bookedCallbackTime: { value: (x, y) => y ?? x, default: () => '' },
  callSid: { value: (x, y) => y ?? x, default: () => '' }
};

/**
 * Extract Named Callback Time from Speech Input
 */
const extractCallbackTime = (text) => {
  const match = text.match(/(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s*(am|pm)|at\s*\d{1,2})/i);
  if (match) {
    return text.substring(match.index).trim();
  }
  return '';
};

/**
 * AI Evaluator: Evaluates Buyer Seriousness (1-5) & Extracts Callback
 */
const evaluateBuyerSeriousness = async (messages, productContext) => {
  const llm = getLLM();
  const transcriptText = messages
    .map((m) => `${m._getType() === 'human' ? 'Customer' : 'Alex'}: ${m.content}`)
    .join('\n');

  const lastUserMsg = messages[messages.length - 1]?.content || '';
  const detectedCallback = extractCallbackTime(lastUserMsg);

  if (!llm) {
    const isSerious = /build|start|price|timeline|yes|sure|send|schedule|call|budget|pay|book|urgent/i.test(lastUserMsg);
    const score = isSerious ? 5 : 3;
    return {
      ratingScore: score,
      isInterested: isSerious,
      onCallAction: detectedCallback ? `PitchBolt Callback Booked: ${detectedCallback}` : (score >= 4 ? 'Scheduled Strategy Session & Proposal' : 'Consulted on Features'),
      feedback: isSerious ? 'High Intent Lead' : 'Moderate Intent Lead',
      summary: `PitchBolt Inquiry for ${productContext}`,
      bookedCallbackTime: detectedCallback
    };
  }

  try {
    const evalPrompt = `Analyze sales call transcript for "${productContext}":
${transcriptText}

Rate buyer intent (1 to 5):
- 5: High Intent / Serious
- 3-4: Moderate Intent
- 1-2: Low Intent

JSON only:
{
  "ratingScore": <1-5>,
  "isInterested": <boolean>,
  "onCallAction": "<1 sentence action>",
  "feedback": "<1 sentence reasoning>",
  "summary": "<1 sentence summary>",
  "bookedCallbackTime": "<extracted callback date/time if named, else empty>"
}`;

    const res = await llm.invoke([new SystemMessage(evalPrompt)]);
    const parsed = JSON.parse(res.content.replace(/```json|```/g, '').trim());
    return {
      ratingScore: parsed.ratingScore || 3,
      isInterested: parsed.isInterested ?? false,
      onCallAction: detectedCallback ? `PitchBolt Callback Booked: ${detectedCallback}` : (parsed.onCallAction || 'Consulted client'),
      feedback: parsed.feedback || 'Evaluated intent',
      summary: parsed.summary || 'E-Commerce inquiry',
      bookedCallbackTime: detectedCallback || parsed.bookedCallbackTime || ''
    };
  } catch (err) {
    const isSerious = /build|start|price|yes|sure|send|schedule|book/i.test(lastUserMsg);
    return {
      ratingScore: isSerious ? 5 : 3,
      isInterested: isSerious,
      onCallAction: detectedCallback ? `PitchBolt Callback Booked: ${detectedCallback}` : 'Consulted on Features',
      feedback: 'Evaluated intent',
      summary: 'E-Commerce consultation',
      bookedCallbackTime: detectedCallback
    };
  }
};

/**
 * Node: Senior E-Commerce Web Solutions Consultant
 */
const salesNode = async (state) => {
  const { messages, productContext, whatsappSent } = state;
  const llm = getLLM();
  const packageInfo = await searchProducts(productContext);

  const systemPrompt = `You are Alex, a Senior E-Commerce Consultant at PitchBolt selling web development.
Context: ${packageInfo.title} (${packageInfo.price}). Features: ${packageInfo.specs}.

RULES:
1. Speak in 1-2 natural sentences suitable for a phone call. Adapt to English, Telugu, or Hindi matching the client.
2. Ask about 4 core items concisely: 1) Products to sell 2) Target launch timeline 3) Budget 4) Required features (UPI, WhatsApp, CRM).
3. If client names a callback time (e.g. "Call me tomorrow at 4 PM"), confirm: "Perfect! PitchBolt has booked your callback for [time] and sent your proposal to WhatsApp."
4. If client shows high intent, state: "PitchBolt has reserved your consultation slot and sent the project proposal to your WhatsApp."`;

  const lastUserMsg = messages[messages.length - 1]?.content || '';
  const isSerious = /yes|sure|send|build|price|start|ok|schedule|book/i.test(lastUserMsg);
  const callbackTime = extractCallbackTime(lastUserMsg);

  let fallbackReply = `Hello, I am Alex from PitchBolt calling regarding your E-Commerce website inquiry. Our ${packageInfo.title} is ${packageInfo.price}. What products are you planning to sell, and what is your target launch date?`;
  if (callbackTime) {
    fallbackReply = `Understood! PitchBolt has booked your callback for ${callbackTime} and dispatched the project proposal link to your WhatsApp. Talk soon!`;
  } else if (isSerious && !whatsappSent) {
    fallbackReply = `Excellent! PitchBolt has reserved your consultation slot and sent the complete proposal link to your WhatsApp.`;
  }

  if (!llm) {
    return { messages: [new AIMessage(fallbackReply)] };
  }

  try {
    const formattedMessages = [new SystemMessage(systemPrompt), ...messages];
    const response = await llm.invoke(formattedMessages);
    return { messages: [response] };
  } catch (err) {
    return { messages: [new AIMessage(fallbackReply)] };
  }
};

/**
 * Node: Action & WhatsApp Generator
 */
const actionNode = async (state) => {
  const { messages, phoneNumber, productContext, whatsappSent, callSid } = state;
  const evaluation = await evaluateBuyerSeriousness(messages, productContext);

  let newWhatsappSent = whatsappSent;
  let whatsappDetails = state.whatsappDetails;

  if ((evaluation.isInterested || evaluation.bookedCallbackTime) && !whatsappSent && phoneNumber) {
    const packageInfo = await searchProducts(productContext);
    newWhatsappSent = true;
    whatsappDetails = `PitchBolt Call Summary:\n- Requirements: ${evaluation.summary}\n- Recommended Package: ${packageInfo.title} (${packageInfo.price})\n- Lead Score: ${evaluation.ratingScore}/5 (${evaluation.feedback})\n- Callback Booked: ${evaluation.bookedCallbackTime || 'Confirmed'}\n- Proposal Link: https://pitchbolt.agency/proposal?client=${encodeURIComponent(phoneNumber)}`;
  }

  if (callSid) {
    Promise.resolve().then(async () => {
      try {
        await CallLog.findOneAndUpdate(
          { callSid },
          {
            $set: {
              isInterested: evaluation.isInterested || state.isInterested,
              whatsappSent: newWhatsappSent,
              whatsappDetails,
              aiRatingScore: evaluation.ratingScore,
              aiRatingFeedback: `${evaluation.feedback} | ${evaluation.onCallAction}`,
              aiSummary: evaluation.summary,
              transcript: messages.map((m) => ({
                role: m._getType() === 'human' ? 'user' : 'assistant',
                content: m.content
              }))
            }
          },
          { upsert: true, new: true, maxTimeMS: 2000 }
        );
      } catch (e) {
        // Silent catch
      }
    });
  }

  return {
    isInterested: evaluation.isInterested || state.isInterested,
    whatsappSent: newWhatsappSent,
    whatsappDetails,
    aiRatingScore: evaluation.ratingScore,
    aiRatingFeedback: evaluation.feedback,
    onCallAction: evaluation.onCallAction,
    bookedCallbackTime: evaluation.bookedCallbackTime,
    aiSummary: evaluation.summary
  };
};

const builder = new StateGraph({ channels });
builder.addNode('sales_node', salesNode);
builder.addNode('action_node', actionNode);

builder.addEdge(START, 'action_node');
builder.addEdge('action_node', 'sales_node');
builder.addEdge('sales_node', END);

const salesAgentGraph = builder.compile();

const processUserSpeech = async ({ callSid, phoneNumber, userSpeech, productContext, conversationHistory = [] }) => {
  const inputMessages = conversationHistory.map((item) =>
    item.role === 'user' ? new HumanMessage(item.content) : new AIMessage(item.content)
  );

  if (userSpeech) {
    inputMessages.push(new HumanMessage(userSpeech));
  }

  const initialState = {
    messages: inputMessages,
    phoneNumber,
    productContext: productContext || 'Growth Pro E-Commerce Portal',
    callSid
  };

  const result = await salesAgentGraph.invoke(initialState);
  const lastAiMessage = result.messages[result.messages.length - 1];

  return {
    responseSpeech: lastAiMessage ? lastAiMessage.content : 'Thank you for your time.',
    isInterested: result.isInterested,
    whatsappSent: result.whatsappSent,
    whatsappDetails: result.whatsappDetails,
    aiRatingScore: result.aiRatingScore,
    aiRatingFeedback: result.aiRatingFeedback,
    onCallAction: result.onCallAction,
    bookedCallbackTime: result.bookedCallbackTime,
    aiSummary: result.aiSummary,
    updatedMessages: result.messages
  };
};

module.exports = { salesAgentGraph, processUserSpeech };
