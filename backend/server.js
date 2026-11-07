const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retail_erp';

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const productsRoute = require('./routes/products');
const posRoute = require('./routes/pos');
const reportsRoute = require('./routes/reports');
const accountsRoute = require('./routes/accounts');

app.use('/api/products', productsRoute);
app.use('/api/pos', posRoute);
app.use('/api/reports', reportsRoute);
app.use('/api/accounts', accountsRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    currency: 'PKR (Rs.)',
    service: 'Retail POS, Inventory Valuation & Accounting ERP',
  });
});

// Database connection & Server Startup
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`[Database] Connected to MongoDB at ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`[Server] Retail ERP Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Database Error] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
