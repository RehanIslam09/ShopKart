# 🎓 ShopKart Engineering Labs — Complete TA Viva Preparation Guide
**Course:** MERN Stack Engineering Lab Series (Labs 01 – 05)  
**Project:** ShopKart Minimalist E-Commerce Platform

---

## Table of Contents
1. [Lab 01: Customer Authentication Service](#lab-01-customer-authentication-service)
2. [Lab 02: Login → Home Flow & Client Routing](#lab-02-login--home-flow--client-routing)
3. [Lab 03: Product Catalog & Discovery](#lab-03-product-catalog--discovery)
4. [Lab 04: Customer Wishlist & MongoDB Relationships](#lab-04-customer-wishlist--mongodb-relationships)
5. [Lab 05: Shopping Cart & State Management](#lab-05-shopping-cart--state-management)

---

## Lab 01: Customer Authentication Service

### Q1: Why do we use `bcrypt` instead of encrypting passwords?
* **Answer**: Encryption is a **two-way** process (reversible with a decryption key). If a malicious actor compromises the server or decryption key, every user password in the system is exposed.  
`bcrypt` is a **one-way salted hash function** with an adaptive work factor (salt rounds). It cannot be decrypted. When a user logs in, their plaintext candidate password is run through the same hashing algorithm and compared in constant time (`bcrypt.compare`). Salt protects against pre-computed rainbow table attacks, and the work factor makes brute-force attacks computationally prohibitive.

### Q2: What information is typically stored inside a JWT payload?
* **Answer**: Only non-sensitive identifying metadata and claims, such as:
  * Subject / Database ID: `{ id: customer._id }`
  * Issuance timestamp: `iat`
  * Expiration timestamp: `exp`
* **Crucial Rule**: Never store sensitive secrets like passwords, credit card numbers, or personally identifiable data (SSNs) in a JWT payload because the payload is simply Base64URL-encoded and can be read by anyone who intercepts it.

### Q3: Why is the `HttpOnly` flag important for cookies?
* **Answer**: The `httpOnly: true` flag instructs the browser that the cookie must **not** be accessible via client-side JavaScript (e.g. `document.cookie`). This provides critical defense-in-depth against **Cross-Site Scripting (XSS)** attacks. Even if an attacker injects a malicious script into your frontend, they cannot read or exfiltrate the session token.

### Q4: Why should passwords never be returned to the frontend (even as hashes)?
* **Answer**: Returning password hashes in API responses exposes them to network sniffing, browser caching, and client logs. Attackers can collect these hashes and run high-speed offline dictionary attacks (using tools like Hashcat or John the Ripper) at billions of attempts per second without ever triggering API rate limiters.

### Q5: What is the purpose of authentication middleware?
* **Answer**: It functions as an interceptor in the Express HTTP pipeline. Before any private controller runs, the middleware:
  1. Extracts the token from `req.cookies.token`
  2. Verifies the cryptographic signature and expiration with `jwt.verify()`
  3. Queries the database to confirm the user still exists
  4. Attaches the clean user object (stripped of password) to `req.user`
  If verification fails at any stage, it short-circuits the request with HTTP `401 Unauthorized`.

---

## Lab 02: Login → Home Flow & Client Routing

### Q1: Why do we use `withCredentials: true` (or `credentials: 'include'`)?
* **Answer**: By default, standard browser `fetch` and `XMLHttpRequest` do not include ambient credentials (cookies, HTTP basic auth) in cross-origin or proxied requests for security reasons. Setting `credentials: 'include'` explicitly instructs the browser engine to attach our HttpOnly session cookies to the request headers.

### Q2: Why can't JavaScript read an HttpOnly cookie?
* **Answer**: The browser's networking stack enforces the HttpOnly specification at the operating system/browser engine level. It will include the cookie in network HTTP headers (`Cookie: token=...`), but completely suppresses it from the Document Object Model (`document.cookie`), preventing script-based theft.

### Q3: Why is `/home` called a protected route?
* **Answer**: Because viewing the route requires authenticated identity. An unauthenticated user lacks the valid HttpOnly JWT cookie; therefore, requesting `/customers/me` returns HTTP `401 Unauthorized`, and the React frontend automatically redirects the user to `/login`.

### Q4: Why do we fetch `/customers/me` instead of storing the user manually in `localStorage`?
* **Answer**: `localStorage` is completely disconnected from the server. If a token expires, a session is revoked, or an account is deleted/modified in the database, `localStorage` remains stale and insecure. Verifying session via `GET /customers/me` ensures the server remains the single source of truth on every page refresh.

### Q5: What is the difference between authentication and authorization?
* **Answer**:
  * **Authentication (AuthN)**: Answering *"Who are you?"* (verifying identity via email, password, and issuing a session token).
  * **Authorization (AuthZ)**: Answering *"What permissions do you have?"* (verifying if that authenticated user is permitted to access a specific resource or role, such as Admin vs. Customer).

---

## Lab 03: Product Catalog & Discovery

### Q1: Why should product data come from MongoDB instead of being hardcoded in React?
* **Answer**: Hardcoding data requires rebuilding and redeploying the frontend bundle for every single price change, title tweak, or stock decrement. A database provides dynamic, persistent, real-time single-source-of-truth inventory that can be modified concurrently by multiple users and services.

### Q2: What is the difference between a URL parameter and a query parameter?
* **Answer**:
  * **URL Parameters (`/products/:id`)**: Form part of the resource path hierarchy to identify a single specific entity canonical address.
  * **Query Parameters (`/products?category=Electronics&search=phone`)**: Optional key-value pairs appended after the `?` used to filter, sort, search, or paginate a collection of resources without altering the route endpoint.

### Q3: When would you use `/products/:id` vs `/products?category=Electronics`?
* **Answer**: Use `/products/:id` when querying the canonical details of one specific product. Use query parameters (`?category=...`) when requesting a variable list or subset of products matching filter criteria.

### Q4: How does `.map()` help us render products dynamically?
* **Answer**: In React, `.map()` transforms an array of raw JavaScript objects (from our API JSON response) into an array of virtual DOM elements (`<ProductCard key={product._id} product={product} />`), allowing the user interface to automatically adjust to the exact number of records returned.

### Q5: Why do we need loading, error, and empty states in a frontend application?
* **Answer**: Asynchronous network operations have a lifecycle.
  * **Loading State**: Prevents layout shift and informs the user that data is actively being fetched.
  * **Error State**: Prevents blank white screens or silent failures by explaining what went wrong and offering a retry action.
  * **Empty State**: Differentiates between a failure and a valid 0-result search query, guiding the user back to the catalog.

### Q6: Why should search and filtering be handled by the backend instead of filtering in React?
* **Answer**: Client-side filtering requires downloading the entire database to the user's browser, which exhausts mobile bandwidth, wastes memory, and causes severe lag on large catalogs. MongoDB uses B-Tree indexes and optimized query engines to filter millions of documents server-side in milliseconds, sending only the requested subset over the wire.

---

## Lab 04: Customer Wishlist & MongoDB Relationships

### Q1: Why are we storing `ObjectId` references instead of duplicating Product objects?
* **Answer**: To maintain normalization and data integrity. If a product's price, stock, or image is updated in the catalog, an embedded/copied product document inside every user's wishlist would instantly become out-of-date. Storing only the `ObjectId` reference ensures that when populated, the customer always receives live, accurate product data.

### Q2: What does `ref: "Product"` do in a Mongoose schema?
* **Answer**: It tells Mongoose which collection/model to query when `.populate()` is called. Mongoose uses the stored `ObjectId` to query the `Product` collection and replace the ID with the matching document.

### Q3: What is the difference between embedding and referencing in MongoDB?
* **Answer**:
  * **Embedding (Denormalized)**: Stores child documents directly inside the parent document. Best for 1-to-few relationships where data belongs exclusively to the parent and does not change independently.
  * **Referencing (Normalized)**: Stores only the `ObjectId`. Best for shared entities (like Products) referenced across thousands of independent user documents.

### Q4: Why should we never accept `userId` from the frontend client in request bodies?
* **Answer**: To prevent **Broken Object Level Authorization (BOLA)** vulnerabilities. If the server accepted `userId` from the request body or path (`/wishlist/:userId`), any user could supply someone else's ID and read or modify their private wishlist. Extracting identity strictly from the verified JWT in the cookie guarantees the user can only access their own data.

### Q5: How are duplicate wishlist entries prevented, and what HTTP status is returned?
* **Answer**: Before adding, the server checks if the user's wishlist array already contains the product `ObjectId` (`customer.wishlist.some(id => id.toString() === productId)`). If it exists, the request is rejected with HTTP **`409 Conflict`**.

---

## Lab 05: Shopping Cart & State Management

### Q1: Why does cart state need to be shared globally?
* **Answer**: Cart information must be consumed and modified by multiple independent components located at different levels of the component hierarchy (e.g. the `Navbar` cart badge, `ProductCard` "Add to Cart" buttons, `ProductDetails` page, and the `Cart` checkout screen). Without global state (like React Context API), components would have to resort to painful "prop drilling" or out-of-sync local states.

### Q2: Why should the Navbar not independently fetch the cart?
* **Answer**: Independent fetching causes duplicate network requests, race conditions, and out-of-sync UI state. If the user clicks "Add to Cart" on a product page, an independent Navbar wouldn't know the cart changed until a full page reload. A shared Context provides a single source of truth where state mutations trigger synchronized re-renders across all consumers simultaneously.

### Q3: What is the difference between server state and UI/frontend state?
* **Answer**:
  * **Server State**: Data that lives remotely in the database (MongoDB) and must be fetched or mutated asynchronously via HTTP APIs.
  * **UI/Frontend State**: Local, transient browser state (such as dropdown toggles, modal open/closed states, or active tab selection) that does not need to persist on the server.

### Q4: What is derived state, and why should `subtotal` not be stored separately in MongoDB?
* **Answer**: **Derived state** is any value that can be computed synchronously on the fly from existing state values.  
`subtotal` is simply `Σ (item.product.price * item.quantity)`. Storing subtotal in the database is an anti-pattern because it creates redundant data that easily falls out of sync if prices change. Computing it dynamically guarantees 100% mathematical accuracy.

### Q5: Why does a shopping cart require quantity while a wishlist does not?
* **Answer**: A wishlist answers *"What do I want to save for later?"* (a binary boolean: saved or not saved). A cart answers *"What am I purchasing right now and how many units?"*, which directly affects inventory reservations, shipping, line totals, and order fulfillment.

### Q6: How do you prevent requested quantity from exceeding available stock?
* **Answer**: Both the backend and frontend enforce stock boundaries:
  * **Backend**: In `POST /cart/:productId` and `PATCH /cart/:productId`, the controller inspects `product.stock`. If `requestedQuantity > product.stock`, it immediately rejects the request with HTTP **`400 Bad Request`** (`"Requested quantity exceeds available stock"`).
  * **Frontend**: The `[+]` button is automatically disabled when `item.quantity >= item.product.stock`, providing immediate visual feedback.

### Q7: How does the Navbar cart count update without refreshing the page?
* **Answer**: The application is wrapped in `<CartProvider>`. When `addToCart`, `updateQuantity`, or `removeFromCart` resolves, the provider updates its internal `cartItems` state with the server's response. Because the Navbar consumes `useCart()`, React automatically detects the state update and re-renders only the changed badge without touching the rest of the page.
