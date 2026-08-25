# 📞 AI Telephony Sales & Product Recommendation System

An AI-powered voice telephony sales platform built with **LangChain**, **LangGraph**, **LangSmith**, **OpenAI**, **Twilio Voice & WhatsApp**, **Amazon / Flipkart E-Commerce API**, **MongoDB**, and **React**.

---

## ✨ Key Features

- 🤖 **LangGraph Conversational Agent**: Multi-turn sales flow with dynamic intent detection and tool calling.
- ⭐️ **AI LLM Lead Evaluator**: OpenAI rates every call on a **1–5 Star Lead Score** with feedback reasoning.
- 📱 **Twilio Voice & Built-in STT/TTS**: Real-time speech recognition via `<Gather input="speech">` and Polly neural voice synthesis (`<Say voice="Polly">`).
- 💬 **Instant WhatsApp Buy Link Dispatch**: Automatically sends WhatsApp messages with product specs & discount links when a customer shows interest.
- 🛒 **E-Commerce API Integration**: Fetches real-time pricing and features from Amazon & Flipkart.
- 📊 **MongoDB Persistence**: Real-time logging of call SIDs, full transcripts, interest flags, and AI lead ratings.
- 🔍 **LangSmith Tracing**: Full execution traces and token evaluation links recorded for every call.
- 💻 **React Sales Dashboard & Simulator**: Web UI with live call dispatcher, interactive browser speech console, and call history table.

---

## 🚀 Quick Start

### 1. Environment Setup
Copy `backend/.env.example` to `backend/.env` and insert your credentials:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai_telephony_sales

# OpenAI Credentials
OPENAI_API_KEY=sk-...

# Twilio Credentials
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+14155238886

# LangSmith Tracing & Evals
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=ai-telephony-sales-agent

# Backend Public Domain (e.g. ngrok HTTPS URL)
PUBLIC_BACKEND_URL=http://localhost:5000
```

### 2. Run Backend
```bash
cd backend
npm start
```

### 3. Run Frontend
```bash
cd frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🧪 Local Test Runner
You can test the LangGraph state graph and AI lead evaluator locally without making phone calls:

```bash
cd backend
node test_agent.js
```

---

## 📄 Git Repository Setup
To push this project to GitHub / Git:

```bash
git init
git add .
git commit -m "Initial commit: AI Telephony Sales Agent with LangGraph, Twilio & React"
```
