const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
} = require('../controllers/order.controller');

// All order routes are strictly protected behind customer auth middleware
router.use(protect);

// 1. Create Pending ShopKart order & Razorpay order
router.post('/create-payment-order', createPaymentOrder);

// 2. Verify payment signature & confirm order
router.post('/verify-payment', verifyPayment);

// 3. Get all orders for authenticated user
router.get('/', getMyOrders);

// 4. Get specific order by ID (with ownership check)
router.get('/:id', getOrderById);

module.exports = router;
