<div align="center">

# 🛍️ ShopKart — Client Frontend

**Modern, High-Performance E-Commerce Single Page Application (SPA)**

Built with **React 19**, **Vite 8**, **Tailwind CSS v4**, **GSAP Animations**, and **TanStack Query**.

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

</div>

---

## 📖 Overview

The **ShopKart Frontend** delivers a fluid, responsive, luxury shopping experience. It connects seamlessly to the ShopKart Express API, featuring HttpOnly session cookie authentication, real-time cart and wishlist synchronization, dynamic product discovery, and Razorpay payment checkout.

---

## ✨ Features

- ⚡ **Lightning Fast Experience**: Powered by Vite with Instant Hot Module Replacement (HMR).
- 🎨 **Tailwind CSS v4 Styling**: Clean typography, rich gradients, dark mode aesthetics, and micro-interactions.
- 🎬 **GSAP Animations**: Silky smooth transitions, hero entrance animations, and interactive hover effects.
- 🔐 **HttpOnly Cookie Authentication**: Native browser credential management with `credentials: 'include'` for complete security against XSS.
- ❤️ **Customer Wishlist**: Relational heart toggles with optimistic UI updates and instant badge counters.
- 🛒 **Dynamic Cart & Checkout**: Real-time quantity adjustments, subtotal calculation, free shipping milestones, and discount codes.
- 💳 **Razorpay Checkout Modal**: Direct client-side SDK integration for card, UPI, netbanking, and wallet test payments.
- 📱 **Mobile First & Fully Responsive**: Optimized layouts from mobile displays to ultra-wide desktop monitors.

---

## 📂 Project Structure

```text
frontend/
├── public/                 # Static assets & favicon
├── src/
│   ├── api/                # Customer authentication network clients
│   ├── assets/             # Images, SVGs, and brand graphics
│   ├── components/         # Modular, reusable UI components (Navbar, Footer, Modals, Cards)
│   ├── context/            # React Contexts (CartContext, WishlistContext)
│   ├── hooks/              # Custom React hooks
│   ├── layouts/            # AppLayout and shell components
│   ├── pages/              # Routed views:
│   │   ├── Home.jsx            # Hero carousel, featured categories, trending items
│   │   ├── Products.jsx        # Catalog with search, category & price filters
│   │   ├── ProductDetails.jsx  # Rich product view, stock info, ratings
│   │   ├── Wishlist.jsx        # Saved favorites with quick cart transfer
│   │   ├── Cart.jsx            # Item list, promo voucher, cost breakdown
│   │   ├── Checkout.jsx        # Shipping address & Razorpay launch
│   │   ├── Orders.jsx          # Order history listing
│   │   ├── OrderDetails.jsx    # Receipt, timeline & tracking status
│   │   ├── Login.jsx           # Customer sign-in
│   │   ├── Register.jsx        # New account registration
│   │   └── Lab1Auth.jsx        # Interactive auth inspection lab
│   ├── services/           # Centralized API service layer & Razorpay loader
│   ├── styles/             # Global style declarations
│   ├── App.jsx             # React Router configuration & provider wrappers
│   ├── index.css           # Tailwind CSS directives & global animations
│   └── main.jsx            # React root DOM mount
├── index.html              # HTML5 entry with Razorpay checkout script
├── package.json            # Scripts & frontend dependencies
├── vercel.json             # SPA deep-linking rewrite rules for Vercel
└── vite.config.js          # Vite configuration with /api reverse proxy
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
The application will launch at **`http://localhost:5173`**.

> **Note**: In development, `vite.config.js` automatically proxies all `/api` requests to `http://localhost:5000`, so no manual CORS proxy is required locally!

### 3. Production Build
```bash
npm run build
```
Creates an optimized production bundle in `dist/`.

---

## 🌐 Deployment

For complete end-to-end deployment instructions (Render, Railway, Vercel), refer to the root [Repository README](../README.md#-%EF%B8%8F-deployment-guide).
