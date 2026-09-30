import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartQuantity as apiUpdateCartQuantity,
  removeFromCart as apiRemoveFromCart,
} from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's cart on initialization
  const refreshCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCart();
      setCartItems(data.cart || []);
    } catch (err) {
      if (err.status !== 401) {
        setError(err.message || 'Unable to load cart');
      }
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  // Add product to cart (or increment quantity)
  const addToCart = async (productId) => {
    try {
      setError(null);
      const data = await apiAddToCart(productId);
      setCartItems(data.cart || []);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Failed to add product to cart';
      setError(msg);
      throw err;
    }
  };

  // Update item quantity with stock validation
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      setError(null);
      const data = await apiUpdateCartQuantity(productId, newQuantity);
      setCartItems(data.cart || []);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
      throw err;
    }
  };

  // Remove item entirely from cart
  const removeFromCart = async (productId) => {
    try {
      setError(null);
      const data = await apiRemoveFromCart(productId);
      setCartItems(data.cart || []);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to remove product');
      throw err;
    }
  };

  // Section 15: Derived Values (Never stored in MongoDB)
  // 1. Total units (e.g. Keyboard x 2 + Mouse x 1 = 3)
  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cartItems]);

  // 2. Subtotal = Σ(product.price * quantity)
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * (item.quantity || 0);
    }, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    loading,
    error,
    totalItems,
    subtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
