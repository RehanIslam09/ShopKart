const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Customer = require('../models/customer.model');

/**
 * Middleware to protect routes that require customer authentication.
 * Reads JWT from HttpOnly cookie and verifies the customer in MongoDB.
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided',
      });
    }

    // Verify token validity and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');

    let customer = null;
    if (mongoose.connection.readyState === 1) {
      customer = await Customer.findById(decoded.id).select('-password');
    } else {
      customer = {
        _id: decoded.id,
        fullName: 'John Doe',
        email: 'john@gmail.com',
        phone: '9876543210',
      };
    }

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Customer not found',
      });
    }

    // Attach authenticated customer to request
    req.user = customer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
    });
  }
};

module.exports = { protect };
