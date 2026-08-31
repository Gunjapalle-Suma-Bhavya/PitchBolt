import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Phone,
  Send,
  Globe,
  Database,
  Bot,
  User,
  AlertCircle,
  MessageSquare,
  Zap,
  CheckCircle,
  Briefcase,
  RefreshCw,
  Star
} from 'lucide-react';

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('+918688664337');
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
      console.warn('Backend log fetch notice:', e.message);
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

  const handleSelectCallLog = (log) => {
    setActiveCallSid(log.callSid);
    setPhoneNumber(log.phoneNumber || phoneNumber);
    if (log.initialProductQuery) {
      setProductQuery(log.initialProductQuery);
      searchProduct(log.initialProductQuery);
    }
    if (log.transcript && log.transcript.length > 0) {
      setActiveTranscript(log.transcript);
    } else {
      setActiveTranscript([]);
    }
    setLatestSeriousnessScore(log.aiRatingScore || null);
    setOnCallActionTaken(log.aiRatingFeedback || '');
    setWhatsappContext(log.whatsappDetails || '');
    setCallStatusMsg(`Loaded call record [${log.callSid}] into PitchBolt Sales Console.`);
  };

  const handleTriggerCall = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCallStatusMsg('Dispatching PitchBolt AI Sales Call for E-Commerce Website Development...');
    try {
      const res = await axios.post('/api/calls/trigger', {
        phoneNumber,
        productQuery
      });
      if (res.data?.success) {
        const callSid = res.data.callSid;
        setActiveCallSid(callSid);
        setCallStatusMsg(`PitchBolt Sales Agent calling ${phoneNumber}... Fetching initial AI speech...`);

        // Fetch dynamic initial opening speech from LLM
        try {
          const initRes = await axios.post('/api/calls/simulate-speech', {
            callSid,
            phoneNumber,
            userSpeech: '',
            productQuery
          });
          if (initRes.data?.aiResponse) {
            setActiveTranscript([
              { role: 'assistant', content: initRes.data.aiResponse }
            ]);
            if (initRes.data.aiRatingScore) setLatestSeriousnessScore(initRes.data.aiRatingScore);
            if (initRes.data.onCallAction) setOnCallActionTaken(initRes.data.onCallAction);
          }
        } catch (initErr) {
          setActiveTranscript([
            {
              role: 'assistant',
              content: `Hello, I am Alex from PitchBolt calling regarding your inquiry for ${productQuery}. When are you looking to launch your online store?`
            }
          ]);
        }
        fetchLogs();
      }
    } catch (err) {
      setCallStatusMsg(`Call Error: ${err.response?.data?.message || err.message}`);
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
          setCallStatusMsg('PitchBolt High-Intent Qualification Complete: On-call strategy session booked & WhatsApp context sent.');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* PitchBolt Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              PitchBolt — AI Telephony Sales & Lead Qualification
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                English Priority
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              PitchBolt: Fast-paced AI Voice Agent matching quick on-call action and dispatch engine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1.5 font-medium">
            <Zap className="w-3.5 h-3.5 text-indigo-400" /> PitchBolt Dispatch Engine
          </span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1.5 font-medium">
            <Phone className="w-3.5 h-3.5 text-indigo-400" /> Bolti Telephony
          </span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl w-full mx-auto">
        
        {/* Left Column: Call Launcher & Package Scope */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" /> Initiate PitchBolt Call
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Outbound
              </span>
            </div>

            <form onSubmit={handleTriggerCall} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Client Mobile Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+918688664337"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  E-Commerce Website Package
                </label>
                <select
                  value={productQuery}
                  onChange={(e) => {
                    setProductQuery(e.target.value);
                    searchProduct(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Starter E-Commerce Store">Starter E-Commerce Store (₹19,999 / $249)</option>
                  <option value="Growth Pro E-Commerce Portal">Growth Pro E-Commerce Portal (₹49,999 / $599)</option>
                  <option value="Enterprise Custom Store & Apps">Enterprise Custom Store & Apps (₹99,999 / $1,199)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-5 rounded-xl shadow border border-indigo-500/30 flex items-center justify-center gap-2 transition"
              >
                <Phone className="w-4 h-4" />
                {loading ? 'Processing...' : 'Call Potential Client'}
              </button>
            </form>

            {callStatusMsg && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{callStatusMsg}</span>
              </div>
            )}
          </div>

          {/* Active Package Specification Card */}
          {productDetails && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" /> Package Specifications
              </h2>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-white text-sm">{productDetails.title}</h3>
                  <span className="text-xs font-bold bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded border border-indigo-500/20">
                    {productDetails.price}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{productDetails.specs}</p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-900">
                  <span>Stack: {productDetails.platform}</span>
                  <span className="text-slate-400">PitchBolt Engine</span>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Context Summary Card */}
          {whatsappContext && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Dispatched WhatsApp Context
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                {whatsappContext}
              </p>
            </div>
          )}
        </section>

        {/* Right Column: Live AI Console & Rating Logs */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Live Voice Speech Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">PitchBolt AI Sales Console</h2>
              </div>

              {/* Lead Rating Badge */}
              {latestSeriousnessScore && (
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-md text-xs font-semibold text-slate-200">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Lead Rating: {latestSeriousnessScore}/5</span>
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-bold uppercase">
                    {latestSeriousnessScore >= 4 ? 'High Intent' : 'Moderate Intent'}
                  </span>
                </div>
              )}
            </div>

            {/* On-Call Action Banner */}
            {onCallActionTaken && (
              <div className="mb-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span><strong className="text-white">Action Taken:</strong> {onCallActionTaken}</span>
              </div>
            )}

            {/* Transcript Messages */}
            <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-y-auto min-h-[280px] max-h-[360px] space-y-3">
              {activeTranscript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
                  <Globe className="w-8 h-8 opacity-40 text-indigo-400" />
                  <p className="text-xs font-medium">No active call transcript.</p>
                  <p className="text-[11px] text-slate-600 text-center max-w-xs">
                    Click "Call Potential Client" or send a test speech input below.
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
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-70">
                        {msg.role === 'user' ? 'Client Response' : 'Alex (PitchBolt Agent)'}
                      </p>
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Speech Simulation Form */}
            <form onSubmit={handleSimulateSpeech} className="mt-4 flex gap-2">
              <input
                type="text"
                value={simulatedUserInput}
                onChange={(e) => setSimulatedUserInput(e.target.value)}
                placeholder="Type client speech input (e.g. 'I want to launch an online clothing store next month')..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" /> Reply
              </button>
            </form>
          </div>

          {/* Call Records & Buyer Qualification Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> PitchBolt Qualification & Call Log Records
              </h2>
              <button
                onClick={fetchLogs}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Call ID</th>
                    <th className="py-2.5 px-3">Client Number</th>
                    <th className="py-2.5 px-3">Package</th>
                    <th className="py-2.5 px-3">Lead Score</th>
                    <th className="py-2.5 px-3">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {callLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-5 text-center text-slate-500">
                        No PitchBolt sales call consultations logged yet.
                      </td>
                    </tr>
                  ) : (
                    callLogs.map((log) => {
                      const isSelected = activeCallSid === log.callSid;
                      return (
                        <tr
                          key={log.callSid}
                          onClick={() => handleSelectCallLog(log)}
                          title="Click to view full transcript & qualification details"
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-indigo-950/60 border-l-4 border-indigo-500 font-medium'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-400 flex items-center gap-1.5">
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse"></span>}
                            <span>{log.callSid}</span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">{log.phoneNumber}</td>
                          <td className="py-2.5 px-3 text-slate-300">{log.initialProductQuery}</td>
                          <td className="py-2.5 px-3 font-bold text-indigo-400">
                            {log.aiRatingScore || 5} / 5
                          </td>
                          <td className="py-2.5 px-3">
                            {log.whatsappSent ? (
                              <span className="text-emerald-400 font-medium">Dispatched</span>
                            ) : (
                              <span className="text-slate-500">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
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
