# WebAgency — AI Telephony Sales & Lead Qualification System

A lightweight, minimalistic AI Voice Agent system built with **LangChain**, **LangGraph**, **OpenAI**, **Bolti AI Voice Engine**, **MongoDB**, and **React**.

---

## Key Features

- **LangGraph Conversational Agent**: Multi-turn sales flow supporting English (priority), Telugu, and Hindi speech.
- **E-Commerce Web Development Sales**: Pitches Starter (₹19,999), Growth Pro (₹49,999), and Enterprise (₹99,999) packages.
- **4-Point Discovery Questionnaire**: Asks about products to sell, target launch timeline, allocated budget, and required features.
- **Real-Time Lead Rating**: Evaluates buyer seriousness score (1 to 5 Stars) and categorizes leads as **Hot**, **Warm**, or **Cold**.
- **On-Call Action Engine**: Takes on-call action (locks in strategy session & proposal scope) when high intent is detected.
- **Named Callback Booking**: Extracts named callback times (e.g. *"Call me tomorrow at 4 PM"*) and books the callback session.
- **Contextual WhatsApp Summary**: Generates and dispatches WhatsApp summaries with exact requirements discussed and proposal link.
- **Minimalist React Dashboard**: Minimalist UI with live call dispatch, interactive speech console, and lead qualification table.

---

## Architecture Stack

- **Speech-to-Text (STT)**: Deepgram Nova-3 via Bolti
- **Text-to-Speech (TTS)**: ElevenLabs via Bolti
- **Voice Transport**: LiveKit WebRTC
- **AI Agent & Reasoning**: LangGraph & OpenAI (`gpt-4o-mini`)
- **Backend**: Node.js & Express (Port 5000)
- **Frontend**: React & Vite with Tailwind CSS (Port 3000)
- **Database**: MongoDB Atlas

---

## Quick Start

### 1. Environment Configuration
Create `backend/.env` with your API credentials:

```env
PORT=5000
MONGODB_URI=mongodb+srv://...

# OpenAI Credentials
OPENAI_API_KEY=sk-...

# Bolti AI Voice Credentials
BOLTI_API_KEY=eyJ...
BOLTI_WORKSPACE_ID=23172290-fab3-40f7-bd08-c49129bfa6a5
BOLTI_AGENT_ID=b009b044-e9e4-4e09-8f34-a7b143f40a65
BOLTI_BASE_URL=https://api.bolti.co.in
```

### 2. Start Backend
```bash
cd backend
npm start
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser.
