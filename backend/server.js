require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const apiRoutes = require('./routes/apiRoutes');

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

// Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Swiggy FoodieAI Voice Agent & Bolti AI Call Server',
    version: '2.0.0',
    documentation: {
      outboundCallEndpoint: 'POST /api/calls/trigger',
      callLogsEndpoint: 'GET /api/calls',
      productSearchEndpoint: 'GET /api/products/search'
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`[Swiggy FoodieAI Server] Listening on port ${PORT}`);
  console.log(`[API Base URL] http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
