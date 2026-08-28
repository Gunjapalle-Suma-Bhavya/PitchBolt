# 📖 Executive Architecture & Data Flow Guide
## AI Telephony Sales & Lead Qualification System

> **Repository**: [Gunjapalle-Suma-Bhavya/ai-voice-recommendation-system](https://github.com/Gunjapalle-Suma-Bhavya/ai-voice-recommendation-system)  
> **Author & Contributor**: Gunjapalle-Suma-Bhavya  
> **Target Application**: AI Voice Telephony Agent for E-Commerce Website Development Sales & Lead Rating

---

## 1. Executive Summary & Purpose

The **AI Telephony Sales System** is a full-stack platform that autonomously calls potential clients, sells E-Commerce website development packages, conducts a discovery questionnaire (budget, timeline, products, features), evaluates **buyer seriousness (1 to 5 Stars)**, takes **on-call action** (books strategy calls & callback times), and dispatches a **contextual WhatsApp summary**.

### 🌟 Core Capabilities:
1. **Outbound Dialing**: Dialing target phone numbers directly via Bolti's Cloud Telephony API.
2. **Multilingual Speech**: Speaking fluently in **English (priority)**, **Telugu**, or **Hindi** matching client speech.
3. **E-Commerce Web Sales Pitch**: Offering Starter (₹19,999), Growth Pro (₹49,999), and Enterprise (₹99,999) store packages.
4. **4-Point Discovery Questionnaire**: Gathering 1) Products to sell 2) Target launch timeline 3) Allocated budget 4) Key features (UPI, WhatsApp, CRM).
5. **Real-time Lead Classification**: Rating buyer intent (1-5 ⭐) as **Hot Lead**, **Warm Lead**, or **Cold Lead**.
6. **On-Call Action & Mid-Call WhatsApp**: Dispatching custom WhatsApp summaries mid-call upon detecting high intent ($\ge 4/5$).
7. **Named Callback Booking**: Extracting named callback dates/times (e.g. *"Tomorrow at 4 PM"*) and logging callback bookings.

---

## 2. Complete Directory Structure

```text
ai-voice-recommendation-system/
├── backend/
│   ├── .env                    # Secret keys (OpenAI, Bolti, MongoDB, LangSmith)
│   ├── server.js               # Express HTTP Web Server Entrypoint (Port 5000)
│   ├── package.json            # Node.js Backend Dependencies & Scripts
│   ├── agent/
│   │   └── salesAgent.js       # LangGraph State Graph, Alex Sales Persona, Buyer Rating Evaluator
│   ├── config/
│   │   └── db.js               # MongoDB Mongoose Atlas Database Connection
│   ├── models/
│   │   └── CallLog.js          # Mongoose Schema for Call Logs, Lead Scores, Transcripts & Callbacks
│   ├── routes/
│   │   └── apiRoutes.js        # Express REST API Endpoints (/calls/trigger, /calls/simulate-speech, etc.)
│   └── services/
│       ├── boltiService.js     # Bolti Cloud Telephony Outbound Call Dispatcher
│       └── ecommerceService.js # E-Commerce Web Development Service Catalog & Search Provider
├── frontend/
│   ├── package.json            # React Frontend Dependencies & Scripts
│   ├── vite.config.js          # Vite Build Engine & Proxy Configuration (Port 3000 -> 5000)
│   ├── tailwind.config.js      # Tailwind CSS Theme & Styling Rules
│   ├── postcss.config.js       # PostCSS CSS Processing Plugins
│   ├── index.html              # HTML DOM Entry Point
│   └── src/
│       ├── main.jsx            # React Mounting Root Entrypoint
│       ├── index.css           # Global Tailwind CSS Styles
│       └── App.jsx             # Minimalist Enterprise Dashboard UI
├── architecture_guide.md       # Complete End-to-End System Architecture & Data Flow Guide
└── README.md                   # Quickstart Guide & Project Sitemap
```

---

## 3. File Connections ("What Connects to What")

The table below details how files depend on and connect to each other across the stack:

```mermaid
graph TD
    User([User Browser / Client Phone]) -->|HTTP / Audio| ReactApp[frontend/src/App.jsx]
    ReactApp -->|Axios REST /api| ApiRoutes[backend/routes/apiRoutes.js]
    
    Server[backend/server.js] -->|Mounts /api| ApiRoutes
    Server -->|Initializes| DB[backend/config/db.js]
    DB -->|Connects| MongoDB[(MongoDB Atlas)]
    
    ApiRoutes -->|Triggers Outbound Call| BoltiService[backend/services/boltiService.js]
    ApiRoutes -->|Invokes State Graph| SalesAgent[backend/agent/salesAgent.js]
    ApiRoutes -->|Fetches Catalog| EcomService[backend/services/ecommerceService.js]
    
    SalesAgent -->|Reads Package Specs| EcomService
    SalesAgent -->|Saves Call Log & Ratings| CallLogModel[backend/models/CallLog.js]
    SalesAgent -->|LangChain Reasoning| OpenAI[OpenAI gpt-4o-mini API]
    SalesAgent -->|Traces Execution| LangSmith[LangSmith Telemetry API]
    
    BoltiService -->|HTTP POST /outbound-call| BoltiAPI[Bolti Cloud Telephony API]
    BoltiAPI -->|WebRTC / LiveKit Stream| BoltiSpeech[Deepgram Nova-3 STT & ElevenLabs TTS]
```

### Modular Linkage Breakdown:

| File Name | Imports / Connects To | Role & Responsibilities |
|---|---|---|
| [`server.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/server.js) | `dotenv`, `express`, `cors`, [`config/db.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/config/db.js), [`routes/apiRoutes.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/routes/apiRoutes.js) | Starts the Node.js Express server on port 5000, connects to MongoDB, and registers `/api` REST routes. |
| [`config/db.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/config/db.js) | `mongoose` | Establishes the database connection to MongoDB Atlas cluster. |
| [`models/CallLog.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/models/CallLog.js) | `mongoose` | Defines the database collection schema storing call SID, client number, transcript, buyer rating (1-5 ⭐), booked callback time, and WhatsApp text. |
| [`services/ecommerceService.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/services/ecommerceService.js) | None (Standalone Data Module) | Provides the E-Commerce Website Development Service Packages catalog (Starter, Growth Pro, Enterprise) and search lookup. |
| [`services/boltiService.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/services/boltiService.js) | `axios` | Sends POST requests to Bolti's REST API (`/workspaces/{id}/agents/{id}/outbound-call`) using account JWT authorization to trigger physical phone calls. |
| [`agent/salesAgent.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/agent/salesAgent.js) | `@langchain/openai`, `@langchain/langgraph`, [`services/ecommerceService.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/services/ecommerceService.js), [`models/CallLog.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/models/CallLog.js) | Core AI brain. Executes the 2-node LangGraph state graph (`action_node` $\rightarrow$ `sales_node`), evaluates buyer intent (1-5 ⭐), extracts named callback times, and generates WhatsApp summaries. |
| [`routes/apiRoutes.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/routes/apiRoutes.js) | `express`, [`services/boltiService.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/services/boltiService.js), [`services/ecommerceService.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/services/ecommerceService.js), [`agent/salesAgent.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/agent/salesAgent.js), [`models/CallLog.js`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/backend/models/CallLog.js) | Defines REST routes for frontend interaction: `/calls/trigger`, `/calls/simulate-speech`, `/calls`, `/products/search`. |
| [`frontend/src/App.jsx`](file:///C:/Users/Shanmukha%20Tharun/ai-voice-recommendation-system/frontend/src/App.jsx) | `react`, `axios`, `lucide-react` | Minimalist Enterprise Dashboard UI. Displays call trigger form, active package specifications, live voice console, lead ratings, booked callback alerts, and WhatsApp summary cards. |

---

## 4. Specific API Integrations & How They Work Together

```text
+-----------------------------------------------------------------------------------+
|                                   EXTERNAL APIs                                   |
|                                                                                   |
|  [Bolti AI Telephony API]        [OpenAI GPT-4o-mini]         [LangSmith Telemetry]|
|   - Outbound Call Dispatch        - Sales Speech Agent         - Trace Execution      |
|   - Deepgram STT / ElevenLabs TTS - Buyer Rating (1-5 Stars)   - Evals & Logs         |
|   - LiveKit WebRTC Audio Stream   - Callback Time Extractor                           |
+--------------------------+-------------------+-------------------------+----------+
                           |                   |                         |
                           v                   v                         v
+-----------------------------------------------------------------------------------+
|                                 BACKEND SERVICES                                  |
|                                                                                   |
|  [boltiService.js]        [salesAgent.js (LangGraph)]      [ecommerceService.js]  |
|  Dispatches calls via     2-Node State Graph:              Web Development        |
|  JWT Bearer auth          Action Node & Sales Node         Service Catalog        |
+--------------------------+-------------------+-------------------------+----------+
                           |                   |                         |
                           +-------------------+-------------------------+
                                               |
                                               v
+-----------------------------------------------------------------------------------+
|                                  DATABASE LAYER                                   |
|                                                                                   |
|  [MongoDB Atlas Database]                                                         |
|   - Stores Call SIDs, Phone Numbers, Transcripts, Lead Scores & Callback Times    |
+-----------------------------------------------------------------------------------+
```

### API Functionality Breakdown:

1. **Bolti Cloud Telephony API (`api.bolti.co.in`)**:
   - **Endpoint**: `POST https://api.bolti.co.in/workspaces/{workspace_id}/agents/{agent_id}/outbound-call`
   - **Authentication**: `Authorization: Bearer <bolti_ai_token>`
   - **Function**: Receives target `phone_number` (`to_number`), connects to LiveKit WebRTC audio pipeline, runs **Deepgram Nova-3** Speech-to-Text for incoming customer speech, and streams **ElevenLabs** neural voice synthesis back to the customer's phone handset.

2. **OpenAI API (`api.openai.com` / `openrouter.ai`)**:
   - **Model**: `gpt-4o-mini`
   - **Function**: Powers the LangGraph conversational agent and lead evaluator. Generates natural sales dialogue, assesses buyer seriousness (1-5 ⭐), extracts callback timestamps, and formats WhatsApp summaries.

3. **LangSmith Telemetry API (`api.smith.langchain.com`)**:
   - **Function**: Automatically captures full execution traces, latency, token costs, and prompt inputs/outputs for every sales consultation call.

4. **MongoDB Atlas API**:
   - **Connection**: `mongodb+srv://admin:...@cluster0...`
   - **Function**: Persists structured records for call history, lead qualification ratings, named callback timestamps, and WhatsApp summaries.

---

## 5. End-to-End Data Flow Walkthrough (For First-Time Reviewers)

Here is step-by-step what happens when a user operates the system:

```text
[User Clicks "Call Potential Client"]
             |
             v
1. React App sends POST /api/calls/trigger { phoneNumber: "+918688664337", productQuery: "Growth Pro" }
             |
             v
2. Express Route handler in apiRoutes.js receives payload and calls boltiService.makeBoltiCall()
             |
             v
3. boltiService formats number (+91...) and sends POST to Bolti API (/outbound-call) with Bearer token
             |
             v
4. Bolti AI Telephony dials customer's phone handset (+918688664337)
             |
             v
5. Deepgram STT captures customer's spoken reply ("I want to launch a clothing store next month, budget 50k")
             |
             v
6. User speech sent to processUserSpeech() in salesAgent.js -> Invokes LangGraph State Graph
             |
             +---> Step 6A [action_node]:
             |     - OpenAI evaluates transcript
             |     - Rates buyer intent: 5/5 Stars (Hot Lead)
             |     - Extracts callback date/time if named
             |     - Generates WhatsApp summary text
             |
             +---> Step 6B [sales_node]:
                   - Alex (Sales Agent) generates 1-2 sentence response matching client language (English/Telugu/Hindi)
                   - States: "Awesome! I have reserved your consultation slot and sent the proposal link to your WhatsApp."
             |
             v
7. Response speech converted to voice via ElevenLabs TTS and played on customer's phone handset
             |
             v
8. CallLog updated in MongoDB & React UI displays Lead Rating (5/5 ⭐ Hot Lead), Action Taken, & WhatsApp Context
```

---

## 6. Verification & Quick Test Commands

To verify the system end-to-end on your local environment:

```bash
# 1. Start Backend (Port 5000)
cd backend
npm start

# 2. Start Frontend (Port 3000)
cd frontend
npm run dev
```

Open **`http://localhost:3000`** in your browser to view the minimalist enterprise dashboard, test live calls, evaluate speech inputs, and inspect booked callback logs!
