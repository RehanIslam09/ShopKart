const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const razorpay = require('../config/razorpay');
const { fallbackCarts, SAMPLE_PRODUCTS } = require('./cart.controller');

// In-memory fallback orders store for offline / restricted environments (e.g. hostel Wi-Fi)
const fallbackOrders = [];

/**
 * Normalizes and validates an Indian mobile number.
 * Accepts optional +91, 91, or leading 0, plus spaces or hyphens.
 * Must resolve to a 10-digit number starting with [6-9].
 */
const normalizeIndianPhone = (phoneStr) => {
  if (!phoneStr || typeof phoneStr !== 'string') return null;
  const clean = phoneStr.replace(/[\s\-]/g, '');
  let digits = clean;
  if (digits.startsWith('+91')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

/**
 * Task 4: Create ShopKart Pending Order and Razorpay Order
 * POST /orders/create-payment-order (and /api/orders/create-payment-order)
 * Protected
 */
const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress } = req.body;

    // 1. Validate shipping address fields
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
      });
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone must be a valid 10-digit Indian mobile number',
      });
    }

    if (!addressLine1 || !addressLine1.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Address line is required',
      });
    }

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: 'City is required',
      });
    }

    if (!state || !state.trim()) {
      return res.status(400).json({
        success: false,
        message: 'State is required',
      });
    }

    const trimmedPincode = pincode ? pincode.toString().trim() : '';
    if (!/^\d{6}$/.test(trimmedPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Pincode must contain 6 digits.',
      });
    }

    const cleanAddress = {
      fullName: fullName.trim(),
      phone: normalizedPhone,
      addressLine1: addressLine1.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: trimmedPincode,
    };

    // 2. Load and validate user's cart items
    let cartItems = [];
    if (mongoose.connection.readyState === 1) {
      const customer = await Customer.findById(userId).populate('cart.product');
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }
      cartItems = customer.cart || [];
    } else {
      const userKey = userId.toString();
      cartItems = fallbackCarts.get(userKey) || [];
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Please add items before checkout.',
      });
    }

    // 3. Verify latest product data, stock, and build snapshot items
    const snapshotItems = [];
    let totalPaise = 0;

    for (const item of cartItems) {
      const productId = item.product?._id ? item.product._id.toString() : item.product?.toString();
      const requestedQty = Number(item.quantity) || 1;

      let latestProduct = null;
      if (mongoose.connection.readyState === 1) {
        latestProduct = await Product.findById(productId);
      } else {
        latestProduct = SAMPLE_PRODUCTS[productId] || item.product;
      }

      if (!latestProduct) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product?.name || productId} is no longer available`,
        });
      }

      if (latestProduct.stock < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${latestProduct.name}.`,
        });
      }

      const itemPrice = latestProduct.price;
      const itemPaise = Math.round(itemPrice * 100) * requestedQty;
      totalPaise += itemPaise;

      snapshotItems.push({
        product: latestProduct._id,
        name: latestProduct.name,
        price: latestProduct.price,
        quantity: requestedQty,
        image: latestProduct.image || '',
      });
    }

    if (totalPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order total amount',
      });
    }

    const totalAmount = totalPaise / 100;

    // 4. Create pending ShopKart order
    let shopKartOrder = null;
    if (mongoose.connection.readyState === 1) {
      shopKartOrder = await Order.create({
        user: userId,
        items: snapshotItems,
        shippingAddress: cleanAddress,
        totalAmount,
        paymentStatus: 'PENDING',
        status: 'PENDING_PAYMENT',
      });
    } else {
      const newOrderId = new mongoose.Types.ObjectId().toString();
      shopKartOrder = {
        _id: newOrderId,
        user: userId.toString(),
        items: snapshotItems,
        shippingAddress: cleanAddress,
        totalAmount,
        paymentStatus: 'PENDING',
        status: 'PENDING_PAYMENT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        save: async function () {
          this.updatedAt = new Date().toISOString();
          return this;
        },
      };
      fallbackOrders.push(shopKartOrder);
    }

    // 5. Create Razorpay order in paise
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: totalPaise,
        currency: 'INR',
        receipt: shopKartOrder._id.toString(),
      });
    } catch (rzpError) {
      console.error('Razorpay order creation failed:', rzpError);
      // Clean up the pending ShopKart order if Razorpay fails
      if (mongoose.connection.readyState === 1) {
        await Order.findByIdAndDelete(shopKartOrder._id);
      } else {
        const idx = fallbackOrders.findIndex(
          (o) => o._id.toString() === shopKartOrder._id.toString()
        );
        if (idx !== -1) fallbackOrders.splice(idx, 1);
      }
      return res.status(502).json({
        success: false,
        message: 'Failed to initiate payment gateway. Please try again.',
      });
    }

    // 6. Save razorpayOrderId to the ShopKart order
    shopKartOrder.razorpayOrderId = razorpayOrder.id;
    await shopKartOrder.save();

    // 7. Return safe checkout details (Never return secret)
    return res.status(200).json({
      success: true,
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: totalPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating payment order',
      error: error.message,
    });
  }
};

/**
 * Task 5: Verify Payment Signature and Confirm Order
 * POST /orders/verify-payment (and /api/orders/verify-payment)
 * Protected
 */
const verifyPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Validate required body fields
    if (
      !shopKartOrderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          'shopKartOrderId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required',
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Find order and verify ownership
    let order = null;
    if (mongoose.connection.readyState === 1) {
      order = await Order.findOne({
        _id: shopKartOrderId,
        user: userId,
      });
    } else {
      order = fallbackOrders.find(
        (o) =>
          o._id.toString() === shopKartOrderId.toString() &&
          o.user.toString() === userId.toString()
      );
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Idempotency: if order is already PAID, return successfully without touching cart again
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        order,
      });
    }

    // Validate that the request razorpay_order_id matches the stored razorpayOrderId
    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay order ID mismatch',
      });
    }

    // Verify HMAC-SHA256 signature using stored razorpayOrderId and key secret
    const body = order.razorpayOrderId + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(razorpay_signature, 'utf-8');

    const isMatch =
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf);

    if (!isMatch) {
      order.paymentStatus = 'FAILED';
      await order.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Mark order as PAID and PLACED
    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Clear user's cart ONLY AFTER verified payment
    if (mongoose.connection.readyState === 1) {
      await Customer.findByIdAndUpdate(userId, { $set: { cart: [] } });
    } else {
      fallbackCarts.set(userId.toString(), []);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed',
      order,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error verifying payment',
      error: error.message,
    });
  }
};

/**
 * Task 7: Get All Orders for Authenticated User
 * GET /orders (and /api/orders)
 * Protected
 */
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    let orders = [];
    if (mongoose.connection.readyState === 1) {
      orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    } else {
      orders = fallbackOrders
        .filter((o) => o.user.toString() === userId.toString())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching orders',
      error: error.message,
    });
  }
};

/**
 * Task 8: Get Single Order by ID
 * GET /orders/:id (and /api/orders/:id)
 * Protected - Enforces ownership
 */
const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    let order = null;
    if (mongoose.connection.readyState === 1) {
      order = await Order.findOne({
        _id: id,
        user: userId,
      });
    } else {
      order = fallbackOrders.find(
        (o) =>
          o._id.toString() === id.toString() &&
          o.user.toString() === userId.toString()
      );
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching order',
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  fallbackOrders,
};
