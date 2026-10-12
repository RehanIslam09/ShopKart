require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');

const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.RENDER_EXTERNAL_URL,
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((u) => u.trim()) : []),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, same-origin static requests)
      if (!origin) return callback(null, true);

      // Whitelisted origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Automatically allow any Render or Vercel preview/production domains
      if (origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // In non-production development environments, allow all origins
      if (process.env.NODE_ENV !== 'production') return callback(null, true);

      // Disallow without crashing server
      return callback(null, false);
    },
    credentials: true, // Allow cookies to be sent across origins
  })
);
app.use(express.json());
app.use(cookieParser());

// Mount Routes under /api namespace
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Compatibility aliases for POST order endpoints without /api prefix
app.post('/orders/create-payment-order', (req, res, next) => {
  req.url = '/create-payment-order';
  orderRoutes(req, res, next);
});
app.post('/orders/verify-payment', (req, res, next) => {
  req.url = '/verify-payment';
  orderRoutes(req, res, next);
});

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'ShopKart Customer Auth API' });
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'ShopKart Customer Auth API' });
});

// Production SPA Static Serving & Deep Links (Non-/api routes fallback to index.html)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
    next();
  });
}

// 404 Handler for unhandled routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Database Connection & Server Initialization
const startServer = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (mongoUri) {
    mongoose
      .connect(mongoUri, { dbName: 'shopkart' })
      .then(() => console.log(' Connected to MongoDB (database: shopkart)'))
      .catch((error) => {
        console.warn(' MongoDB connection pending or blocked (e.g. hostel Wi-Fi):', error.message);
      });
  } else {
    console.warn(' MONGO_URI is not defined in .env');
  }

  app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
  });
};

startServer();
