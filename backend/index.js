require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true, // Allow cookies to be sent across origins
  })
);
app.use(express.json());
app.use(cookieParser());

// Mount Routes
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'ShopKart Customer Auth API' });
});

// 404 Handler
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
