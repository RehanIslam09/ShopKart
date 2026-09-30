import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toggleWishlist } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductCard({
  product,
  isWishlisted: initialWishlisted = false,
  onWishlistChange,
}) {
  const isOutOfStock = product.stock <= 0;
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isSavingWishlist, setIsSavingWishlist] = useState(false);
  const [isAddingCart, setIsAddingCart] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const { addToCart, cartItems } = useCart();
  const cartItem = cartItems?.find((i) => (i.product?._id || i.product) === product._id);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSavingWishlist) return;

    try {
      setIsSavingWishlist(true);
      setFeedbackMsg(null);

      const res = await toggleWishlist(product._id);
      setIsWishlisted(res.saved);
      setFeedbackMsg(res.saved ? '♥ Saved to Wishlist' : '♡ Removed from Wishlist');
      if (onWishlistChange) onWishlistChange(product._id, res.saved);

      setTimeout(() => setFeedbackMsg(null), 2000);
    } catch (err) {
      if (err.status === 401) {
        setFeedbackMsg('Login to save items');
      } else {
        setFeedbackMsg('Unable to update wishlist');
      }
      setTimeout(() => setFeedbackMsg(null), 2500);
    } finally {
      setIsSavingWishlist(false);
    }
  };

  const handleAddToCartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingCart || isOutOfStock) return;

    try {
      setIsAddingCart(true);
      setFeedbackMsg(null);
      await addToCart(product._id);
      setFeedbackMsg('✓ Added to Cart!');
      setTimeout(() => setFeedbackMsg(null), 2000);
    } catch (err) {
      setFeedbackMsg(err.message || 'Failed to add to cart');
      setTimeout(() => setFeedbackMsg(null), 2500);
    } finally {
      setIsAddingCart(false);
    }
  };

  return (
    <div className="group rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.16] backdrop-blur-xl p-4 flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px] shadow-[0_8px_30px_rgb(0,0,0,0.2)] text-left relative">
      {/* Product Image & Top Overlays */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.05] mb-4">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Category Pill */}
        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-zinc-950/70 backdrop-blur-md border border-white/[0.1] text-[10px] font-medium text-zinc-200">
          {product.category}
        </span>

        {/* Wishlist Heart Action (Lab 04) */}
        <button
          type="button"
          onClick={handleWishlistClick}
          disabled={isSavingWishlist}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-sm backdrop-blur-md transition-all cursor-pointer shadow-md active:scale-90 ${
            isWishlisted
              ? 'bg-rose-500 text-white shadow-rose-500/30'
              : 'bg-zinc-950/70 text-zinc-300 hover:text-rose-400 hover:bg-zinc-900 border border-white/[0.1]'
          }`}
        >
          {isSavingWishlist ? '⏳' : isWishlisted ? '♥' : '♡'}
        </button>

        {/* Floating feedback message */}
        {feedbackMsg && (
          <div className="absolute bottom-2 inset-x-2 py-1 px-2 rounded-lg bg-zinc-950/90 border border-white/10 text-[10px] text-center font-medium text-zinc-200 backdrop-blur-md shadow-lg animate-fade-in">
            {feedbackMsg}
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-medium text-sm text-zinc-100 group-hover:text-white line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        {/* Pricing & Stock Indicator */}
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-base font-semibold text-white">
            ₹{product.price.toLocaleString('en-IN')}
          </span>

          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
              isOutOfStock
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : `${product.stock} units left`}
          </span>
        </div>

        {/* Action Row: View Details & Add to Cart (Task 7) */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Link
            to={`/products/${product._id}`}
            className="py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-medium text-center transition-all duration-200 block shadow-sm"
          >
            View Details
          </Link>

          <button
            type="button"
            onClick={handleAddToCartClick}
            disabled={isAddingCart || isOutOfStock}
            className={`py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98] ${
              isOutOfStock
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/[0.05]'
                : cartItem
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30'
                : 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-white/10'
            }`}
          >
            {isAddingCart ? (
              'Adding...'
            ) : cartItem ? (
              `In Cart (${cartItem.quantity})`
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
