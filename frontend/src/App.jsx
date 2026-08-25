import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PhoneCall,
  Send,
  ShoppingBag,
  Database,
  ExternalLink,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Zap
} from 'lucide-react';

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('+15550199');
  const [productQuery, setProductQuery] = useState('Sony WH-1000XM5 Headphones');
  const [productDetails, setProductDetails] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [activeCallSid, setActiveCallSid] = useState('');
  const [activeTranscript, setActiveTranscript] = useState([]);
  const [simulatedUserInput, setSimulatedUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [callStatusMsg, setCallStatusMsg] = useState('');

  // Fetch initial call logs & default product details
  useEffect(() => {
    fetchLogs();
    searchProduct(productQuery);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/calls');
      if (res.data?.calls) {
        setCallLogs(res.data.calls);
      }
    } catch (e) {
      console.warn('Backend connection warning:', e.message);
    }
  };

  const searchProduct = async (query) => {
    try {
      const res = await axios.get(`/api/products/search?q=${encodeURIComponent(query)}`);
      if (res.data?.product) {
        setProductDetails(res.data.product);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerCall = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCallStatusMsg('Dispatching Twilio Voice Call...');
    try {
      const res = await axios.post('/api/calls/trigger', {
        phoneNumber,
        productQuery
      });
      if (res.data?.success) {
        setActiveCallSid(res.data.callSid);
        setCallStatusMsg(res.data.message);
        // Add initial greeting to simulator transcript
        setActiveTranscript([
          {
            role: 'assistant',
            content: `Hello! I am calling from E-Commerce Deals regarding the ${productQuery}. Are you interested in hearing a 1-minute quick special discount offer?`
          }
        ]);
        fetchLogs();
      }
    } catch (err) {
      setCallStatusMsg(`Call Dispatch Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSpeech = async (e) => {
    e.preventDefault();
    if (!simulatedUserInput.trim()) return;

    const userText = simulatedUserInput;
    setSimulatedUserInput('');
    
    // Append user input locally immediately
    const updatedHistory = [...activeTranscript, { role: 'user', content: userText }];
    setActiveTranscript(updatedHistory);
    setLoading(true);

    try {
      const res = await axios.post('/api/calls/simulate-speech', {
        callSid: activeCallSid || `CALL_BROWSER_${Date.now()}`,
        phoneNumber,
        userSpeech: userText,
        productQuery
      });

      if (res.data?.success) {
        if (!activeCallSid) setActiveCallSid(res.data.callSid);
        setActiveTranscript((prev) => [
          ...prev,
          { role: 'assistant', content: res.data.aiResponse }
        ]);

        if (res.data.whatsappSent) {
          setCallStatusMsg('🎉 Customer Interested! Instant WhatsApp Message Dispatched!');
        }
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AI Telephony Sales Agent
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                LangGraph + OpenAI
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive AI Voice Calls, Amazon/Flipkart Recommendations & Instant WhatsApp Follow-up
            </p>
          </div>
        </div>

        {/* Tech Stack Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> LangChain & LangGraph
          </span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> LangSmith Evals
          </span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-green-400" /> Twilio Voice & WhatsApp
          </span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" /> MongoDB
          </span>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl w-full mx-auto">
        
        {/* Left Column: Call Control & Product Search */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Dispatch Call Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-indigo-400" /> Dispatch Outbound Call
            </h2>

            <form onSubmit={handleTriggerCall} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Customer Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+15550199 or +91..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Target Product (Amazon / Flipkart)
                </label>
                <select
                  value={productQuery}
                  onChange={(e) => {
                    setProductQuery(e.target.value);
                    searchProduct(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Sony WH-1000XM5 Headphones">Sony WH-1000XM5 Headphones</option>
                  <option value="Apple iPhone 15 Pro">Apple iPhone 15 Pro</option>
                  <option value="Samsung Galaxy Watch 6">Samsung Galaxy Watch 6</option>
                  <option value="Dell XPS 13 Laptop">Dell XPS 13 Laptop</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
              >
                <PhoneCall className="w-4 h-4" />
                {loading ? 'Dispatching...' : 'Start AI Telephony Call'}
              </button>
            </form>

            {callStatusMsg && (
              <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-indigo-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{callStatusMsg}</span>
              </div>
            )}
          </div>

          {/* Product API Preview Card */}
          {productDetails && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" /> Active E-Commerce Offer
              </h2>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-sm">{productDetails.title}</h3>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    {productDetails.price}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{productDetails.specs}</p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Rating: {productDetails.rating}</span>
                  <a
                    href={productDetails.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    View on E-Commerce <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Middle Column: Interactive In-Browser Call Simulator */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" /> Live Interactive Speech Console
              </h2>
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                Call SID: {activeCallSid || 'Standby'}
              </span>
            </div>

            {/* Conversation Messages Container */}
            <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-y-auto min-h-[340px] max-h-[420px] space-y-3">
              {activeTranscript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
                  <PhoneCall className="w-10 h-10 stroke-1" />
                  <p className="text-sm">No active call in progress.</p>
                  <p className="text-xs text-slate-600">
                    Click "Start AI Telephony Call" or type simulated speech below to test.
                  </p>
                </div>
              ) : (
                activeTranscript.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role !== 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1 opacity-75">
                        {msg.role === 'user' ? 'Customer Speech' : 'AI Voice Agent (Twilio Polly)'}
                      </p>
                      <p>{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Input Form for Customer Speech Simulation */}
            <form onSubmit={handleSimulateSpeech} className="mt-4 flex gap-2">
              <input
                type="text"
                value={simulatedUserInput}
                onChange={(e) => setSimulatedUserInput(e.target.value)}
                placeholder="Simulate customer speech input (e.g. 'Yes, please send details to WhatsApp')..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 rounded-xl font-medium flex items-center gap-2 transition"
              >
                <Send className="w-4 h-4" /> Speak
              </button>
            </form>
          </div>

          {/* MongoDB Call Logs & LangSmith Traces Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" /> MongoDB Call Records & LangSmith Tracing
              </h2>
              <button
                onClick={fetchLogs}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                Refresh Records
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-medium border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Call SID</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">AI Lead Rating</th>
                    <th className="py-3 px-3">Interested?</th>
                    <th className="py-3 px-3">WhatsApp Sent</th>
                    <th className="py-3 px-3">LangSmith Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {callLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-slate-500">
                        No call logs in database yet.
                      </td>
                    </tr>
                  ) : (
                    callLogs.map((log) => (
                      <tr key={log.callSid} className="hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-mono text-slate-400">{log.callSid}</td>
                        <td className="py-3 px-3 font-medium text-white">{log.phoneNumber}</td>
                        <td className="py-3 px-3 text-slate-300">{log.initialProductQuery}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20" title={log.aiRatingFeedback || 'LLM Evaluated'}>
                            {log.aiRatingScore || 3} ★
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {log.isInterested ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Interested
                            </span>
                          ) : (
                            <span className="text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {log.whatsappSent ? (
                            <span className="inline-flex items-center gap-1 text-green-400 font-medium bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                              <MessageSquare className="w-3.5 h-3.5" /> Sent
                            </span>
                          ) : (
                            <span className="text-slate-500">Not Sent</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <a
                            href={log.langsmithTraceUrl || 'https://smith.langchain.com'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline inline-flex items-center gap-1"
                          >
                            Trace <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
