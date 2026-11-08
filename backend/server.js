const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

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

// Database connection helper with state check for serverless environments
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[Database] Connected to MongoDB at ${MONGO_URI}`);
  } catch (err) {
    console.error('[Database Error] Failed to connect to MongoDB:', err.message);
    throw err;
  }
};

// Ensure database connection for incoming serverless requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// Routes
const productsRoute = require('./routes/products');
const posRoute = require('./routes/pos');
const reportsRoute = require('./routes/reports');
const accountsRoute = require('./routes/accounts');

app.use('/api/products', productsRoute);
app.use('/api/pos', posRoute);
app.use('/api/reports', reportsRoute);
app.use('/api/accounts', accountsRoute);

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Retail ERP Backend API is running',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    currency: 'PKR (Rs.)',
    service: 'Retail POS, Inventory Valuation & Accounting ERP',
  });
});

// Start server locally when executed directly
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[Server] Retail ERP Backend running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('[Database Error] Failed to start server:', err.message);
      process.exit(1);
    });
}

module.exports = app;
