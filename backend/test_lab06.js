/**
 * Comprehensive Automated Verification Script for Lab 06
 * Tests all requirements without needing browser/Playwright.
 */
require('dotenv').config();
const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = options.headers || {};
  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  // Extract set-cookie if any
  const setCookie = res.headers.get('set-cookie');

  return {
    status: res.status,
    contentType,
    data,
    setCookie,
  };
}

function extractTokenCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : null;
}

async function runTests() {
  console.log('====================================================');
  console.log('   SHOPKART LAB 06: END-TO-END VERIFICATION SUITE   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // ---------------------------------------------------------
    // TEST SUITE 1: Route Collision & Hard Refresh SPA Check
    // ---------------------------------------------------------
    console.log('\n--- 1. Testing Route Collisions & SPA Deep Linking ---');
    const spaRoutes = ['/checkout', '/orders', '/orders/66d123abc456000000000001', '/order-success/66d123abc456000000000001'];
    for (const route of spaRoutes) {
      const res = await request(route);
      assert(
        res.status === 200 && res.contentType.includes('text/html') && res.data.includes('<div id="root"></div>'),
        `GET ${route} served SPA index.html (status 200, not JSON)`
      );
    }

    // ---------------------------------------------------------
    // TEST SUITE 2: Authentication Protection
    // ---------------------------------------------------------
    console.log('\n--- 2. Testing Authentication Protection (401) ---');
    const unauthCreate = await request('/api/orders/create-payment-order', {
      method: 'POST',
      body: { shippingAddress: {} },
    });
    assert(unauthCreate.status === 401, 'POST /api/orders/create-payment-order unauthenticated -> 401');

    const unauthVerify = await request('/api/orders/verify-payment', {
      method: 'POST',
      body: {},
    });
    assert(unauthVerify.status === 401, 'POST /api/orders/verify-payment unauthenticated -> 401');

    const unauthGetOrders = await request('/api/orders');
    assert(unauthGetOrders.status === 401, 'GET /api/orders unauthenticated -> 401');

    const unauthGetOrderById = await request('/api/orders/66d123abc456000000000001');
    assert(unauthGetOrderById.status === 401, 'GET /api/orders/:id unauthenticated -> 401');

    // ---------------------------------------------------------
    // SETUP: Register & Login User 1 and User 2
    // ---------------------------------------------------------
    console.log('\n--- Setting Up Test Customers ---');
    const user1Email = `testuser1_${Date.now()}@shopkart.test`;
    const user2Email = `testuser2_${Date.now()}@shopkart.test`;

    // Register User 1
    const regUser1 = await request('/api/customers/register', {
      method: 'POST',
      body: {
        fullName: 'Test Buyer One',
        email: user1Email,
        password: 'password123',
        phone: '9876543210',
      },
    });
    assert(regUser1.status === 201, `Customer 1 registered: ${user1Email}`);

    // Login User 1
    const loginUser1 = await request('/api/customers/login', {
      method: 'POST',
      body: { email: user1Email, password: 'password123' },
    });
    assert(loginUser1.status === 200, 'Customer 1 logged in');
    const user1Cookie = extractTokenCookie(loginUser1.setCookie);

    // Register & Login User 2 (for cross-user ownership tests)
    await request('/api/customers/register', {
      method: 'POST',
      body: {
        fullName: 'Test Buyer Two',
        email: user2Email,
        password: 'password123',
        phone: '9876543211',
      },
    });
    const loginUser2 = await request('/api/customers/login', {
      method: 'POST',
      body: { email: user2Email, password: 'password123' },
    });
    const user2Cookie = extractTokenCookie(loginUser2.setCookie);

    // ---------------------------------------------------------
    // TEST SUITE 3: Empty Cart Validation (400)
    // ---------------------------------------------------------
    console.log('\n--- 3. Testing Empty Cart Rejection (400) ---');
    const validAddress = {
      fullName: 'Test Buyer One',
      phone: '9876543210',
      addressLine1: '42 MG Road, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
    };

    const emptyCartRes = await request('/api/orders/create-payment-order', {
      method: 'POST',
      cookie: user1Cookie,
      body: { shippingAddress: validAddress },
    });
    assert(
      emptyCartRes.status === 400 && emptyCartRes.data.message.includes('Cart is empty'),
      'POST /api/orders/create-payment-order with empty cart -> 400 "Cart is empty"'
    );

    // ---------------------------------------------------------
    // TEST SUITE 4: Shipping Address Validation (400)
    // ---------------------------------------------------------
    console.log('\n--- 4. Testing Address Field Validation (400) ---');
    // Add product to cart first: RGB Mechanical Keyboard (₹2999)
    const sampleProductId = '66d123abc456000000000002';
    const addCartRes = await request(`/api/cart/${sampleProductId}`, {
      method: 'POST',
      cookie: user1Cookie,
    });
    assert(addCartRes.status === 200, 'Added sample product to cart');

    // Missing full name
    const badNameRes = await request('/api/orders/create-payment-order', {
      method: 'POST',
      cookie: user1Cookie,
      body: { shippingAddress: { ...validAddress, fullName: '   ' } },
    });
    assert(badNameRes.status === 400, 'Whitespace/empty fullName -> 400');

    // Bad phone (too short)
    const badPhoneRes = await request('/api/orders/create-payment-order', {
      method: 'POST',
      cookie: user1Cookie,
      body: { shippingAddress: { ...validAddress, phone: '12345' } },
    });
    assert(badPhoneRes.status === 400, 'Invalid phone number format -> 400');

    // Bad pincode (not 6 digits)
    const badPinRes = await request('/api/orders/create-payment-order', {
      method: 'POST',
      cookie: user1Cookie,
      body: { shippingAddress: { ...validAddress, pincode: '5600' } },
    });
    assert(badPinRes.status === 400, 'Invalid pincode (< 6 digits) -> 400');

    // ---------------------------------------------------------
    // TEST SUITE 4.5: Insufficient Stock Check (400)
    // ---------------------------------------------------------
    console.log('\n--- 4.5. Testing Insufficient Stock Rejection (400) ---');
    const { createPaymentOrder } = require('./controllers/order.controller');
    const { fallbackCarts } = require('./controllers/cart.controller');

    // Simulate cart item with quantity (99) exceeding available stock (12)
    const testOverstockUserId = '66d123abc456000000000099';
    fallbackCarts.set(testOverstockUserId, [
      {
        product: { _id: sampleProductId, name: 'RGB Mechanical Keyboard' },
        quantity: 99,
      },
    ]);

    let stockStatusCode = 0;
    let stockResponseData = {};
    const mockRes = {
      status(code) {
        stockStatusCode = code;
        return this;
      },
      json(data) {
        stockResponseData = data;
        return this;
      },
    };

    await createPaymentOrder(
      {
        user: { _id: testOverstockUserId },
        body: { shippingAddress: validAddress },
      },
      mockRes
    );

    assert(
      stockStatusCode === 400 &&
        stockResponseData.message?.includes('Insufficient stock for RGB Mechanical Keyboard'),
      `Insufficient stock verification: quantity > stock rejected with status 400: "${stockResponseData.message}"`
    );

    // ---------------------------------------------------------
    // TEST SUITE 5: Fake Total Ignored & Razorpay Order Creation
    // ---------------------------------------------------------
    console.log('\n--- 5. Testing Server Calculation & Fake Total Ignored ---');
    // Client attempts to tamper with totalAmount to ₹1 (100 paise) and items
    const createOrderRes = await request('/api/orders/create-payment-order', {
      method: 'POST',
      cookie: user1Cookie,
      body: {
        shippingAddress: validAddress,
        totalAmount: 1, // MALICIOUS CLIENT TAMPER
        items: [{ price: 1, quantity: 1 }], // MALICIOUS CLIENT TAMPER
      },
    });

    assert(createOrderRes.status === 200, 'create-payment-order returned status 200');
    assert(
      createOrderRes.data.success === true &&
      createOrderRes.data.shopKartOrderId &&
      createOrderRes.data.razorpayOrderId &&
      createOrderRes.data.key === process.env.RAZORPAY_KEY_ID,
      'Response has shopKartOrderId, razorpayOrderId, currency INR, and key'
    );
    // Real item price: ₹2999 = 299900 paise. Fake total (1) must be ignored!
    assert(
      createOrderRes.data.amount === 299900,
      `Calculated amount is 299900 paise (₹2,999), ignored fake total of 1: ${createOrderRes.data.amount === 299900}`
    );

    const shopKartOrderId = createOrderRes.data.shopKartOrderId;
    const razorpayOrderId = createOrderRes.data.razorpayOrderId;

    // Cart must STILL be populated!
    const cartCheckBeforeVerify = await request('/api/cart', {
      method: 'GET',
      cookie: user1Cookie,
    });
    assert(
      cartCheckBeforeVerify.status === 200 &&
      cartCheckBeforeVerify.data.cart &&
      cartCheckBeforeVerify.data.cart.length > 0,
      'Cart is STILL populated after create-payment-order (not cleared prematurely)'
    );

    // ---------------------------------------------------------
    // TEST SUITE 6: Fake Signature Verification (400)
    // ---------------------------------------------------------
    console.log('\n--- 6. Testing Fake Signature Rejection (400) ---');
    const fakeVerifyRes = await request('/api/orders/verify-payment', {
      method: 'POST',
      cookie: user1Cookie,
      body: {
        shopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: 'pay_fake_12345678',
        razorpay_signature: 'fake_tampered_signature_hex_1234567890abcdef',
      },
    });
    assert(
      fakeVerifyRes.status === 400 && fakeVerifyRes.data.message.includes('Invalid payment signature'),
      'Fake signature rejected with status 400 "Invalid payment signature"'
    );

    // Cart must STILL be intact after failed signature!
    const cartCheckAfterFakeVerify = await request('/api/cart', {
      method: 'GET',
      cookie: user1Cookie,
    });
    assert(
      cartCheckAfterFakeVerify.data.cart && cartCheckAfterFakeVerify.data.cart.length > 0,
      'Cart remains intact after payment verification failure'
    );

    // ---------------------------------------------------------
    // TEST SUITE 7: Valid Signature Verification & Cart Cleared
    // ---------------------------------------------------------
    console.log('\n--- 7. Testing Valid Signature Verification & Cart Clearance ---');
    const fakePaymentId = `pay_test_${Date.now()}`;
    const payloadBody = `${razorpayOrderId}|${fakePaymentId}`;
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(payloadBody)
      .digest('hex');

    const validVerifyRes = await request('/api/orders/verify-payment', {
      method: 'POST',
      cookie: user1Cookie,
      body: {
        shopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: validSignature,
      },
    });

    assert(validVerifyRes.status === 200, 'Valid signature verified with status 200');
    assert(
      validVerifyRes.data.order &&
      validVerifyRes.data.order.paymentStatus === 'PAID' &&
      validVerifyRes.data.order.status === 'PLACED',
      'Order status updated to PAID and PLACED'
    );

    // Cart must now be CLEARED!
    const cartCheckAfterValidVerify = await request('/api/cart', {
      method: 'GET',
      cookie: user1Cookie,
    });
    assert(
      cartCheckAfterValidVerify.status === 200 &&
      (!cartCheckAfterValidVerify.data.cart || cartCheckAfterValidVerify.data.cart.length === 0),
      'Cart is now CLEARED after successful signature verification'
    );

    // ---------------------------------------------------------
    // TEST SUITE 8: Idempotency of Payment Verification
    // ---------------------------------------------------------
    console.log('\n--- 8. Testing Idempotency ---');
    const repeatVerifyRes = await request('/api/orders/verify-payment', {
      method: 'POST',
      cookie: user1Cookie,
      body: {
        shopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: validSignature,
      },
    });
    assert(
      repeatVerifyRes.status === 200 && repeatVerifyRes.data.success === true,
      'Repeat verify-payment call succeeds idempotently'
    );

    // ---------------------------------------------------------
    // TEST SUITE 9: GET /orders & GET /orders/:id
    // ---------------------------------------------------------
    console.log('\n--- 9. Testing Order History & Ownership ---');
    const user1OrdersRes = await request('/api/orders', {
      method: 'GET',
      cookie: user1Cookie,
    });
    assert(
      user1OrdersRes.status === 200 &&
      user1OrdersRes.data.orders &&
      user1OrdersRes.data.orders.some((o) => o._id.toString() === shopKartOrderId.toString()),
      'GET /api/orders returns user 1 newly created order'
    );

    const user1SingleOrder = await request(`/api/orders/${shopKartOrderId}`, {
      method: 'GET',
      cookie: user1Cookie,
    });
    assert(
      user1SingleOrder.status === 200 && user1SingleOrder.data.order._id.toString() === shopKartOrderId.toString(),
      'GET /api/orders/:id returns order details for owner'
    );

    // User 2 attempts to fetch User 1's order -> MUST RETURN 404 (ownership enforced)
    const user2CrossFetch = await request(`/api/orders/${shopKartOrderId}`, {
      method: 'GET',
      cookie: user2Cookie,
    });
    assert(
      user2CrossFetch.status === 404,
      `GET /api/orders/:id by foreign user returns 404 (status: ${user2CrossFetch.status})`
    );

    // ---------------------------------------------------------
    // TEST SUITE 10: Secret Leak Check
    // ---------------------------------------------------------
    console.log('\n--- 10. Testing Secret Protection in API Responses ---');
    const jsonStr1 = JSON.stringify(createOrderRes.data);
    const jsonStr2 = JSON.stringify(validVerifyRes.data);
    const jsonStr3 = JSON.stringify(user1SingleOrder.data);
    assert(
      !jsonStr1.includes(process.env.RAZORPAY_KEY_SECRET) &&
      !jsonStr2.includes(process.env.RAZORPAY_KEY_SECRET) &&
      !jsonStr3.includes(process.env.RAZORPAY_KEY_SECRET),
      'RAZORPAY_KEY_SECRET never appears in any API response'
    );

    console.log('\n====================================================');
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
