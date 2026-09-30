import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import { CartProvider } from './context/CartContext';
import { getMe, getWishlist } from './services/api';

export default function App() {
  const [customer, setCustomer] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Check initial authentication state and sync wishlist count
  useEffect(() => {
    getMe()
      .then((data) => {
        setCustomer(data);
        return getWishlist();
      })
      .then((wData) => {
        if (wData && wData.wishlist) {
          setWishlistCount(wData.wishlist.length);
        }
      })
      .catch(() => {
        setCustomer(null);
        setWishlistCount(0);
      });
  }, []);

  return (
    <CartProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col justify-between py-4">
          {/* Persistent Top Navigation Bar */}
          <Navbar
            customer={customer}
            setCustomer={setCustomer}
            wishlistCount={wishlistCount}
          />

          {/* Main Routed Content */}
          <main className="flex-1 w-full my-4">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login setCustomer={setCustomer} />} />
              <Route path="/home" element={<Home setCustomer={setCustomer} />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route
                path="/wishlist"
                element={<Wishlist onWishlistUpdate={setWishlistCount} />}
              />
              <Route path="/cart" element={<Cart />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>

          {/* Minimalist Apple-like Footer */}
          <footer className="w-full max-w-6xl mx-auto px-6 py-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-300">ShopKart</span>
              <span>•</span>
              <span>MERN Engineering Labs 01–05 Complete</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Auth (Lab 01)</span>
              <span>•</span>
              <span>Flow (Lab 02)</span>
              <span>•</span>
              <span>Catalog (Lab 03)</span>
              <span>•</span>
              <span>Wishlist (Lab 04)</span>
              <span>•</span>
              <span>Shopping Cart (Lab 05)</span>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}
