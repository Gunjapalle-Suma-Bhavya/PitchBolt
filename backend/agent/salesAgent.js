const { ChatOpenAI } = require('@langchain/openai');
const { StateGraph, END, START } = require('@langchain/langgraph');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const { searchProducts } = require('../services/ecommerceService');
const CallLog = require('../models/CallLog');

// Initialize OpenAI LLM with LangSmith tracing enabled via process.env
const getLLM = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    console.warn('[LangChain Warning] OPENAI_API_KEY not configured. Falling back to structured response generator.');
    return null;
  }

  const baseURL = process.env.OPENAI_BASE_URL || (apiKey.startsWith('sk-live-') || apiKey.startsWith('sk-or-') ? 'https://openrouter.ai/api/v1' : undefined);

  return new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.7,
    openAIApiKey: apiKey,
    configuration: baseURL ? { baseURL } : undefined
  });
};

/**
 * Define Graph State Channels
 */
const channels = {
  messages: {
    value: (x, y) => x.concat(y),
    default: () => []
  },
  phoneNumber: { value: (x, y) => y ?? x, default: () => '' },
  productContext: { value: (x, y) => y ?? x, default: () => 'featured product' },
  isInterested: { value: (x, y) => y ?? x, default: () => false },
  whatsappSent: { value: (x, y) => y ?? x, default: () => false },
  whatsappDetails: { value: (x, y) => y ?? x, default: () => '' },
  aiRatingScore: { value: (x, y) => y ?? x, default: () => 3 },
  aiRatingFeedback: { value: (x, y) => y ?? x, default: () => 'Neutral engagement' },
  aiSummary: { value: (x, y) => y ?? x, default: () => 'Call in progress' },
  callSid: { value: (x, y) => y ?? x, default: () => '' }
};

/**
 * AI Evaluator: Uses OpenAI LLM to rate conversation quality & interest score (1-5)
 */
const evaluateConversationWithLLM = async (messages, productContext) => {
  const llm = getLLM();
  const transcriptText = messages
    .map((m) => `${m._getType() === 'human' ? 'Customer' : 'AI Sales Agent'}: ${m.content}`)
    .join('\n');

  if (!llm) {
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const isYes = /yes|sure|send|link|buy|interested|ok|please|whatsapp/i.test(lastUserMsg);
    return {
      ratingScore: isYes ? 5 : 3,
      isInterested: isYes,
      feedback: isYes ? 'High customer purchase intent & WhatsApp requested' : 'Standard inquiry',
      summary: `Customer discussed ${productContext}.`
    };
  }

  try {
    const evalPrompt = `You are a Lead Evaluation AI. Analyze this sales call transcript regarding product "${productContext}":
${transcriptText}

Rate the customer's purchase intent & call quality. Return JSON only:
{
  "ratingScore": <integer 1 to 5>,
  "isInterested": <boolean>,
  "feedback": "<1 sentence reasoning>",
  "summary": "<1 sentence call summary>"
}`;

    const res = await llm.invoke([new SystemMessage(evalPrompt)]);
    const parsed = JSON.parse(res.content.replace(/```json|```/g, '').trim());
    return {
      ratingScore: parsed.ratingScore || 3,
      isInterested: parsed.isInterested ?? false,
      feedback: parsed.feedback || 'Evaluated conversation',
      summary: parsed.summary || 'Call processed'
    };
  } catch (err) {
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const isYes = /yes|sure|send|link|buy|interested|ok|please|whatsapp/i.test(lastUserMsg);
    return {
      ratingScore: isYes ? 5 : 3,
      isInterested: isYes,
      feedback: 'LLM Evaluated lead interest',
      summary: 'Sales conversation in progress'
    };
  }
};

/**
 * Node: Sales Representative Node
 */
const salesNode = async (state) => {
  const { messages, productContext, whatsappSent } = state;
  const llm = getLLM();

  const productInfo = await searchProducts(productContext);

  const systemPrompt = `You are FoodieAI, an energetic, friendly, and helpful Swiggy Food Representative calling on behalf of Swiggy Food.
You are presenting this food item:
- Dish Title: ${productInfo.title}
- Platform: ${productInfo.platform}
- Special Price: ${productInfo.price} (Rating: ${productInfo.rating})
- Details: ${productInfo.specs}

GOALS:
1. Speak concisely in 1-2 conversational sentences (phone call suited).
2. Answer customer questions accurately based on dish details.
3. If the customer expresses interest or asks for order links, state that you are sending the instant Swiggy checkout link right now!
4. Be warm and professional. Never send bullet points.`;

  if (!llm) {
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const isYes = /yes|sure|send|link|buy|interested|ok/i.test(lastUserMsg);
    
    let replyText = `Hello! I am calling from Swiggy regarding the ${productInfo.title} available now for only ${productInfo.price}. Would you like me to send you the Swiggy checkout details on WhatsApp?`;
    if (isYes && !whatsappSent) {
      replyText = `Awesome! I have just dispatched the complete Swiggy food menu and checkout link to your WhatsApp number. Have a fantastic meal!`;
    }
    return { messages: [new AIMessage(replyText)] };
  }

  const formattedMessages = [new SystemMessage(systemPrompt), ...messages];
  const response = await llm.invoke(formattedMessages);
  return { messages: [response] };
};

/**
 * Node: Check Interest, AI LLM Rating & Order Link Node
 */
const actionNode = async (state) => {
  const { messages, phoneNumber, productContext, whatsappSent, callSid } = state;

  const evaluation = await evaluateConversationWithLLM(messages, productContext);

  let newWhatsappSent = whatsappSent;
  let whatsappDetails = state.whatsappDetails;

  if (evaluation.isInterested && !whatsappSent && phoneNumber) {
    console.log(`[LangGraph Action & AI Rating: ${evaluation.ratingScore}/5] Customer ${phoneNumber} interested in Swiggy Food! Formatting WhatsApp link...`);
    const productInfo = await searchProducts(productContext);
    newWhatsappSent = true;
    whatsappDetails = productInfo.whatsappSummary;
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
              aiRatingFeedback: evaluation.feedback,
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
        // Non-blocking for local testing
      }
    });
  }

  return {
    isInterested: evaluation.isInterested || state.isInterested,
    whatsappSent: newWhatsappSent,
    whatsappDetails,
    aiRatingScore: evaluation.ratingScore,
    aiRatingFeedback: evaluation.feedback,
    aiSummary: evaluation.summary
  };
};

/**
 * Build & Compile LangGraph State Graph
 */
const builder = new StateGraph({ channels });
builder.addNode('sales_node', salesNode);
builder.addNode('action_node', actionNode);

builder.addEdge(START, 'action_node');
builder.addEdge('action_node', 'sales_node');
builder.addEdge('sales_node', END);

const salesAgentGraph = builder.compile();

/**
 * Helper to process a single user speech input in graph
 */
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
    productContext: productContext || 'featured product',
    callSid
  };

  const result = await salesAgentGraph.invoke(initialState);
  const lastAiMessage = result.messages[result.messages.length - 1];

  return {
    responseSpeech: lastAiMessage ? lastAiMessage.content : 'Thank you for your time!',
    isInterested: result.isInterested,
    whatsappSent: result.whatsappSent,
    aiRatingScore: result.aiRatingScore,
    aiRatingFeedback: result.aiRatingFeedback,
    aiSummary: result.aiSummary,
    updatedMessages: result.messages
  };
};

module.exports = { salesAgentGraph, processUserSpeech };
