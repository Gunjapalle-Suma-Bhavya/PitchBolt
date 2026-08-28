import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PhoneCall,
  Send,
  Globe,
  Database,
  ExternalLink,
  Bot,
  User,
  AlertCircle,
  MessageSquare,
  Zap,
  Star,
  CheckCircle2,
  Briefcase
} from 'lucide-react';

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('+919121447422');
  const [productQuery, setProductQuery] = useState('Growth Pro E-Commerce Portal');
  const [productDetails, setProductDetails] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [activeCallSid, setActiveCallSid] = useState('');
  const [activeTranscript, setActiveTranscript] = useState([]);
  const [simulatedUserInput, setSimulatedUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [callStatusMsg, setCallStatusMsg] = useState('');
  const [latestSeriousnessScore, setLatestSeriousnessScore] = useState(null);
  const [onCallActionTaken, setOnCallActionTaken] = useState('');
  const [whatsappContext, setWhatsappContext] = useState('');

  useEffect(() => {
    fetchLogs();
    searchProduct(productQuery);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/calls');
      if (res.data?.calls) setCallLogs(res.data.calls);
    } catch (e) {
      console.warn('Backend warning:', e.message);
    }
  };

  const searchProduct = async (query) => {
    try {
      const res = await axios.get(`/api/products/search?q=${encodeURIComponent(query)}`);
      if (res.data?.product) setProductDetails(res.data.product);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerCall = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCallStatusMsg('📞 Initiating AI Sales Call for E-Commerce Website Development...');
    try {
      const res = await axios.post('/api/calls/trigger', {
        phoneNumber,
        productQuery
      });
      if (res.data?.success) {
        setActiveCallSid(res.data.callSid);
        setCallStatusMsg(`✅ AI Sales Consultant Calling ${phoneNumber}...`);
        setActiveTranscript([
          {
            role: 'assistant',
            content: `Hello! I am Alex from WebAgency calling regarding your inquiry for building an E-Commerce website. Our ${productQuery} package comes fully equipped with mobile design, payment gateways, and CRM integration. When are you looking to launch your online store?`
          }
        ]);
        fetchLogs();
      }
    } catch (err) {
      setCallStatusMsg(`❌ Call Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSpeech = async (e) => {
    e.preventDefault();
    if (!simulatedUserInput.trim()) return;

    const userText = simulatedUserInput;
    setSimulatedUserInput('');

    const updatedHistory = [...activeTranscript, { role: 'user', content: userText }];
    setActiveTranscript(updatedHistory);
    setLoading(true);

    try {
      const res = await axios.post('/api/calls/simulate-speech', {
        callSid: activeCallSid || `CALL_SIM_${Date.now()}`,
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

        if (res.data.aiRatingScore) setLatestSeriousnessScore(res.data.aiRatingScore);
        if (res.data.onCallAction) setOnCallActionTaken(res.data.onCallAction);
        if (res.data.whatsappDetails) setWhatsappContext(res.data.whatsappDetails);

        if (res.data.whatsappSent) {
          setCallStatusMsg('🎉 High-Intent Buyer Identified! On-Call Strategy Session Booked & WhatsApp Context Summary Sent!');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              WebAgency — AI E-Commerce Sales & Lead Qualification Agent
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                English Priority & Multilingual
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              AI Voice agent that calls potential clients, sells website building services, rates buyer seriousness (1-5 ⭐), takes on-call action & sends WhatsApp context summaries!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> LangGraph & OpenAI
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-indigo-400" /> Bolti AI Voice API
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Context
          </span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl w-full mx-auto">
        
        {/* Left Column: Call Launcher & Web Development Package Selector */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" /> Step 1: Call Potential Client
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                AI Sales Consultant
              </span>
            </div>

            <form onSubmit={handleTriggerCall} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Client Mobile Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+919121447422"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports 10-digit Indian numbers (e.g. 9121447422 or 9392223188)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select E-Commerce Website Package Offer
                </label>
                <select
                  value={productQuery}
                  onChange={(e) => {
                    setProductQuery(e.target.value);
                    searchProduct(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Starter E-Commerce Store">🚀 Starter E-Commerce Store (₹19,999 / $249)</option>
                  <option value="Growth Pro E-Commerce Portal">⚡ Growth Pro E-Commerce Portal (₹49,999 / $599)</option>
                  <option value="Enterprise Custom Store & Apps">👑 Enterprise Custom Store & Apps (₹99,999 / $1,199)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition transform active:scale-95"
              >
                <PhoneCall className="w-5 h-5" />
                {loading ? 'Calling Client...' : '📞 Call Potential Client & Sell Service'}
              </button>
            </form>

            {callStatusMsg && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{callStatusMsg}</span>
              </div>
            )}
          </div>

          {/* Active Web Package Card */}
          {productDetails && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" /> Active E-Commerce Service Scope
              </h2>
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-sm">{productDetails.title}</h3>
                  <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                    {productDetails.price}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{productDetails.specs}</p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-900">
                  <span>Stack: {productDetails.platform}</span>
                  <span className="text-indigo-400 font-semibold">Priority: English</span>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Context Summary Card (If Dispatched) */}
          {whatsappContext && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-5 shadow-xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Dispatched WhatsApp Context Summary
              </h3>
              <p className="text-xs text-emerald-200 leading-relaxed font-mono whitespace-pre-wrap bg-slate-950 p-3 rounded-2xl border border-emerald-500/20">
                {whatsappContext}
              </p>
            </div>
          )}
        </section>

        {/* Right Column: Live AI Console, Seriousness Meter & Action Logs */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Live Interactive Speech Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">AI Voice Sales Console</h2>
              </div>

              {/* Buyer Seriousness Badge */}
              {latestSeriousnessScore && (
                <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Buyer Seriousness: {latestSeriousnessScore}/5 ⭐</span>
                  <span className="text-[10px] bg-amber-500/30 px-1.5 py-0.5 rounded uppercase">
                    {latestSeriousnessScore >= 4 ? 'Hot Lead' : 'Warm Lead'}
                  </span>
                </div>
              )}
            </div>

            {/* On-Call Action Taken Banner */}
            {onCallActionTaken && (
              <div className="mb-3 p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-semibold">On-Call Action Taken:</span> {onCallActionTaken}
              </div>
            )}

            {/* Conversation Transcript Area */}
            <div className="flex-1 bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-y-auto min-h-[300px] max-h-[380px] space-y-3">
              {activeTranscript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
                  <Globe className="w-10 h-10 stroke-1 opacity-50 text-indigo-400" />
                  <p className="text-sm font-medium">Ready for E-Commerce Website Sales Call.</p>
                  <p className="text-xs text-slate-600 text-center max-w-sm">
                    Click <b>"Call Potential Client & Sell Service"</b> to start the call, or test conversation inputs below!
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
                      <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                          : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-75">
                        {msg.role === 'user' ? 'Potential Client Speech' : 'Alex (Web Sales Agent)'}
                      </p>
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Interactive Browser Speech Form */}
            <form onSubmit={handleSimulateSpeech} className="mt-4 flex gap-2">
              <input
                type="text"
                value={simulatedUserInput}
                onChange={(e) => setSimulatedUserInput(e.target.value)}
                placeholder="Type client reply (e.g. 'I want to build a fashion website by next month, what is the price?')..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 rounded-2xl font-bold flex items-center gap-2 transition"
              >
                <Send className="w-4 h-4" /> Reply
              </button>
            </form>
          </div>

          {/* Call Logs & Buyer Qualification Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" /> Buyer Seriousness Ratings & On-Call Actions
              </h2>
              <button
                onClick={fetchLogs}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-1.5 rounded-xl border border-slate-700 transition"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Call SID</th>
                    <th className="py-3 px-3">Client Phone</th>
                    <th className="py-3 px-3">Package Inquiry</th>
                    <th className="py-3 px-3">Buyer Seriousness</th>
                    <th className="py-3 px-3">WhatsApp Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {callLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-500">
                        No sales call consultations logged yet.
                      </td>
                    </tr>
                  ) : (
                    callLogs.map((log) => (
                      <tr key={log.callSid} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-3 font-mono text-slate-400">{log.callSid}</td>
                        <td className="py-3 px-3 font-semibold text-white">{log.phoneNumber}</td>
                        <td className="py-3 px-3 text-slate-300">{log.initialProductQuery}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
                            {log.aiRatingScore || 5} ★
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {log.whatsappSent ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                              <MessageSquare className="w-3.5 h-3.5" /> Dispatched
                            </span>
                          ) : (
                            <span className="text-slate-500">Pending</span>
                          )}
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
