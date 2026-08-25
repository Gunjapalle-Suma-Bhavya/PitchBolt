require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const apiRoutes = require('./routes/apiRoutes');
const twilioWebhooks = require('./routes/twilioWebhooks');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

// Express Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register Routers
app.use('/api', apiRoutes);
app.use('/api/twilio', twilioWebhooks);

// Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'AI Telephony Sales & Product Recommendation Server',
    version: '1.0.0',
    documentation: {
      outboundCallEndpoint: 'POST /api/calls/trigger',
      callLogsEndpoint: 'GET /api/calls',
      twilioVoiceWebhook: 'POST /api/twilio/voice/gather',
      productSearchEndpoint: 'GET /api/products/search'
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`[AI Telephony Sales Server] Listening on port ${PORT}`);
  console.log(`[API Base URL] http://localhost:${PORT}`);
  console.log(`[Twilio Webhook] http://localhost:${PORT}/api/twilio/voice/gather`);
  console.log(`======================================================\n`);
});
