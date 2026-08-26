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
  Zap,
  Phone,
  Utensils
} from 'lucide-react';

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('+919121447422');
  const [productQuery, setProductQuery] = useState('Special Hyderabadi Dum Biryani');
  const [productDetails, setProductDetails] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [activeCallSid, setActiveCallSid] = useState('');
  const [activeTranscript, setActiveTranscript] = useState([]);
  const [simulatedUserInput, setSimulatedUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [callStatusMsg, setCallStatusMsg] = useState('');

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
    setCallStatusMsg('📞 Dispatching Swiggy Food AI Call via Bolti AI Voice...');
    try {
      const res = await axios.post('/api/calls/trigger', {
        phoneNumber,
        productQuery
      });
      if (res.data?.success) {
        setActiveCallSid(res.data.callSid);
        setCallStatusMsg(`✅ Swiggy Food AI Call Dispatched via ${res.data.provider || 'Bolti AI'} to ${phoneNumber}!`);
        setActiveTranscript([
          {
            role: 'assistant',
            content: `Hello! I am calling from Swiggy Food Delivery regarding the ${productQuery}. Are you interested in hearing a 1-minute quick special discount offer?`
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
        callSid: activeCallSid || `BOLTI_SIM_${Date.now()}`,
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
          setCallStatusMsg('🎉 Customer Interested! Instant Swiggy Food WhatsApp Link Dispatched!');
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
          <div className="p-3 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-600/30">
            <Utensils className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              FoodieAI — Swiggy Food Ordering Voice Agent
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                Bolti AI Voice + Swiggy MCP
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              AI Voice agent calling mobile phones for Swiggy Food recommendations & instant WhatsApp checkout links!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> LangGraph & OpenAI
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-orange-400" /> Bolti AI Voice Call
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Direct Link
          </span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl w-full mx-auto">
        
        {/* Left Column: Swiggy Food Call Dispatcher */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-400" /> Step 1: Order Swiggy Food
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
                Bolti Voice API
              </span>
            </div>

            <form onSubmit={handleTriggerCall} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Customer Mobile Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+919121447422"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-orange-500 transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports 10-digit Indian numbers (e.g. 9121447422 or 9392223188)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Swiggy Food Offer
                </label>
                <select
                  value={productQuery}
                  onChange={(e) => {
                    setProductQuery(e.target.value);
                    searchProduct(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                >
                  <option value="Special Hyderabadi Dum Biryani">🍗 Swiggy: Special Hyderabadi Dum Biryani (₹349)</option>
                  <option value="Paneer Butter Masala Combo">🍲 Swiggy: Paneer Butter Masala Combo + Naan (₹289)</option>
                  <option value="Gourmet Cheese Pepperoni Pizza">🍕 Swiggy: Gourmet Cheese Pepperoni Pizza (₹499)</option>
                  <option value="Crispy Chicken Burger Meal">🍔 Swiggy: Crispy Chicken Burger + Fries (₹249)</option>
                  <option value="Gulab Jamun & Ice Cream Dessert">🍨 Swiggy: Gulab Jamun & Ice Cream Dessert (₹149)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-orange-600/30 flex items-center justify-center gap-3 transition transform active:scale-95"
              >
                <Utensils className="w-5 h-5" />
                {loading ? 'Calling Mobile Phone via Bolti...' : '🍗 Call Mobile Phone & Order Food'}
              </button>
            </form>

            {callStatusMsg && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-orange-300 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{callStatusMsg}</span>
              </div>
            )}
          </div>

          {/* Swiggy Food MCP Preview Card */}
          {productDetails && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-400" /> Active Swiggy Dish Recommendation
              </h2>
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-sm">{productDetails.title}</h3>
                  <span className="text-xs font-bold bg-orange-500/20 text-orange-300 px-2.5 py-1 rounded-lg border border-orange-500/30">
                    {productDetails.price}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{productDetails.specs}</p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-900">
                  <span>Platform: {productDetails.platform} ({productDetails.rating})</span>
                  <a
                    href={productDetails.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Swiggy Menu <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Live Bolti AI Console & Food Order Logs */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Live Interactive Speech Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-orange-400" /> Bolti AI Real-time Speech Console
              </h2>
              <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 font-mono">
                Call ID: {activeCallSid || 'Standby'}
              </span>
            </div>

            {/* Conversation Transcript Area */}
            <div className="flex-1 bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-y-auto min-h-[300px] max-h-[380px] space-y-3">
              {activeTranscript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
                  <Utensils className="w-10 h-10 stroke-1 opacity-50 text-orange-400" />
                  <p className="text-sm font-medium">Ready to order Swiggy Food.</p>
                  <p className="text-xs text-slate-600 text-center max-w-sm">
                    Click <b>"Call Mobile Phone & Order Food"</b> to talk on your phone, or test conversation inputs below!
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
                      <div className="w-8 h-8 rounded-xl bg-orange-600/30 border border-orange-500/40 text-orange-300 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-orange-600 text-white rounded-tr-none shadow-md'
                          : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-75">
                        {msg.role === 'user' ? 'Customer Speech' : 'Swiggy FoodieAI (Bolti AI)'}
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

            {/* Browser Test Input Form */}
            <form onSubmit={handleSimulateSpeech} className="mt-4 flex gap-2">
              <input
                type="text"
                value={simulatedUserInput}
                onChange={(e) => setSimulatedUserInput(e.target.value)}
                placeholder="Type customer reply (e.g. 'Yes, please send Biryani offer to WhatsApp')..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-5 rounded-2xl font-bold flex items-center gap-2 transition"
              >
                <Send className="w-4 h-4" /> Test Reply
              </button>
            </form>
          </div>

          {/* Swiggy Food Call History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" /> Swiggy Food Orders & AI Lead Ratings
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
                    <th className="py-3 px-3">Call / Order ID</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Swiggy Item</th>
                    <th className="py-3 px-3">AI Rating</th>
                    <th className="py-3 px-3">WhatsApp Order Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {callLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-500">
                        No food orders recorded in database yet.
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
