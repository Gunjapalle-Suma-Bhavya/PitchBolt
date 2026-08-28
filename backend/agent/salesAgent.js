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
  productContext: { value: (x, y) => y ?? x, default: () => 'Growth Pro E-Commerce Portal' },
  isInterested: { value: (x, y) => y ?? x, default: () => false },
  whatsappSent: { value: (x, y) => y ?? x, default: () => false },
  whatsappDetails: { value: (x, y) => y ?? x, default: () => '' },
  aiRatingScore: { value: (x, y) => y ?? x, default: () => 3 },
  aiRatingFeedback: { value: (x, y) => y ?? x, default: () => 'Engaged inquiry' },
  aiSummary: { value: (x, y) => y ?? x, default: () => 'Call in progress' },
  onCallAction: { value: (x, y) => y ?? x, default: () => 'Answering questions' },
  callSid: { value: (x, y) => y ?? x, default: () => '' }
};

/**
 * AI Evaluator: Evaluates Buyer Seriousness (1-5 ⭐) & On-Call Action Required
 */
const evaluateBuyerSeriousness = async (messages, productContext) => {
  const llm = getLLM();
  const transcriptText = messages
    .map((m) => `${m._getType() === 'human' ? 'Customer' : 'Alex (Sales Agent)'}: ${m.content}`)
    .join('\n');

  if (!llm) {
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const isSerious = /build|start|price|timeline|yes|sure|send|schedule|call|budget|pay|book|urgent/i.test(lastUserMsg);
    const score = isSerious ? 5 : 3;
    return {
      ratingScore: score,
      isInterested: isSerious,
      onCallAction: score >= 4 ? 'Scheduled Priority Strategy Consultation & Generated Scope' : 'Provided Service Information',
      feedback: isSerious ? 'Hot Lead: Immediate intent to build e-commerce store' : 'Warm Lead: Exploring website features',
      summary: `Customer discussed building an e-commerce website with requirement for ${productContext}.`
    };
  }

  try {
    const evalPrompt = `You are a Lead Qualification Specialist analyzing a call between a sales consultant and a client looking to build an E-Commerce website.
Transcript regarding "${productContext}":
${transcriptText}

Rate how serious a buyer the customer is (1 to 5 stars):
- 5: Hot Lead (ready to build, asking timeline/price/booking)
- 3-4: Warm Lead (interested in features/tech stack)
- 1-2: Cold Lead (casual window shopping)

Return JSON only:
{
  "ratingScore": <integer 1 to 5>,
  "isInterested": <boolean>,
  "onCallAction": "<1 sentence action taken on-call>",
  "feedback": "<1 sentence reasoning>",
  "summary": "<1 sentence summary of requirements discussed>"
}`;

    const res = await llm.invoke([new SystemMessage(evalPrompt)]);
    const parsed = JSON.parse(res.content.replace(/```json|```/g, '').trim());
    return {
      ratingScore: parsed.ratingScore || 3,
      isInterested: parsed.isInterested ?? false,
      onCallAction: parsed.onCallAction || 'Consulted client on-call',
      feedback: parsed.feedback || 'Evaluated buyer intent',
      summary: parsed.summary || 'E-Commerce website inquiry'
    };
  } catch (err) {
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const isSerious = /build|start|price|yes|sure|send|schedule|book/i.test(lastUserMsg);
    return {
      ratingScore: isSerious ? 5 : 3,
      isInterested: isSerious,
      onCallAction: isSerious ? 'Locked in Consultation & Project Proposal' : 'Consulted on Features',
      feedback: 'Evaluated buyer intent',
      summary: 'E-Commerce website build consultation'
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

  const systemPrompt = `You are Alex, an energetic, expert Senior E-Commerce Web Solutions Consultant at a top digital agency.
You are calling a potential client interested in building an E-Commerce website.
Selected Package Context:
- Package: ${packageInfo.title}
- Investment: ${packageInfo.price}
- Stack/Platform: ${packageInfo.platform}
- Included Features: ${packageInfo.specs}

GOALS:
1. Speak concisely in 1-2 natural, conversational sentences suitable for a phone call. Priority language is English (adapt gracefully if client speaks Hindi, Telugu, Spanish, etc.).
2. Pitch the web building service, highlight conversion features (UPI, mobile design, speed, SEO), and address client requirements.
3. Gauge how serious the buyer is by asking about target launch date or store products.
4. If client shows interest or asks to proceed, TAKE ACTION ON THE CALL by stating: "Awesome! I have locked in your priority consultation and I am sending our complete project proposal and portfolio link directly to your WhatsApp right now!"
5. Be professional, persuasive, and warm.`;

  if (!llm) {
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const isSerious = /yes|sure|send|build|price|start|ok|schedule|book/i.test(lastUserMsg);
    
    let replyText = `Hello! I am Alex from WebAgency calling regarding your inquiry for building an E-Commerce website. Our ${packageInfo.title} starts at ${packageInfo.price} with payment gateway, mobile design, and admin panel. When are you looking to launch your store?`;
    if (isSerious && !whatsappSent) {
      replyText = `Fantastic! I have reserved your priority consultation slot and dispatched the complete project proposal and design portfolio link directly to your WhatsApp. Talk soon!`;
    }
    return { messages: [new AIMessage(replyText)] };
  }

  const formattedMessages = [new SystemMessage(systemPrompt), ...messages];
  const response = await llm.invoke(formattedMessages);
  return { messages: [response] };
};

/**
 * Node: On-Call Action, Buyer Rating & WhatsApp Context Generator
 */
const actionNode = async (state) => {
  const { messages, phoneNumber, productContext, whatsappSent, callSid } = state;

  const evaluation = await evaluateBuyerSeriousness(messages, productContext);

  let newWhatsappSent = whatsappSent;
  let whatsappDetails = state.whatsappDetails;

  if (evaluation.isInterested && !whatsappSent && phoneNumber) {
    console.log(`[LangGraph Action & Seriousness Rating: ${evaluation.ratingScore}/5 ⭐] Serious buyer ${phoneNumber}! Taking on-call action & formatting WhatsApp context...`);
    const packageInfo = await searchProducts(productContext);
    newWhatsappSent = true;
    whatsappDetails = `📱 E-Commerce Website Call Summary:\n- Discussed: ${evaluation.summary}\n- Recommended Package: ${packageInfo.title} (${packageInfo.price})\n- Seriousness Rating: ${evaluation.ratingScore}/5 ⭐ (${evaluation.feedback})\n- Next Step: Priority Strategy Session Booked. View Proposal: https://webagency.example.com/proposal?client=${encodeURIComponent(phoneNumber)}`;
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
              aiRatingFeedback: `${evaluation.feedback} | On-Call Action: ${evaluation.onCallAction}`,
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
    onCallAction: evaluation.onCallAction,
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
    productContext: productContext || 'Growth Pro E-Commerce Portal',
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
    onCallAction: result.onCallAction,
    aiSummary: result.aiSummary,
    updatedMessages: result.messages
  };
};

module.exports = { salesAgentGraph, processUserSpeech };
