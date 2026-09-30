import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Check, Package } from 'lucide-react';
import { toggleWishlist } from '../../services/api';
import { useCart } from '../../context/CartContext';
import GlassButton from '../ui/GlassButton';

/**
 * Premium Apple-grade Glassmorphic ProductCard
 * 
 * Features:
 * - Fixed aspect-ratio image container with graceful glass gradient fallback
 * - Truncated 2-line title with guaranteed equal card heights
 * - Optimistic Wishlist toggle with instant heart pop & error rollback
 * - Optimistic Add-to-Cart with visual state feedback
 * - Strict accessibility (aria-label, focus rings, contrast)
 */
export default function ProductCard({
  product,
  isWishlisted: initialWishlisted = false,
  onWishlistChange,
  className = '',
}) {
  const [imgError, setImgError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [isAddingCart, setIsAddingCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const { addToCart, cartItems } = useCart();
  const cartItem = cartItems?.find(
    (item) => (item.product?._id || item.product) === product?._id
  );
  const isOutOfStock = (product?.stock ?? 1) <= 0;

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isTogglingWishlist || !product?._id) return;

    const previousState = isWishlisted;
    // Optimistic UI update
    setIsWishlisted(!previousState);
    setIsTogglingWishlist(true);

    try {
      const res = await toggleWishlist(product._id);
      const finalState = typeof res?.saved === 'boolean' ? res.saved : !previousState;
      setIsWishlisted(finalState);
      if (onWishlistChange) onWishlistChange(product._id, finalState);
    } catch (err) {
      // Rollback on network / auth error
      setIsWishlisted(previousState);
      console.error('Failed to toggle wishlist:', err);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingCart || isOutOfStock || !product?._id) return;

    try {
      setIsAddingCart(true);
      await addToCart(product._id);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAddingCart(false);
    }
  };

  return (
    <article
      data-product-card
      className={`group relative rounded-3xl bg-glass/[0.03] hover:bg-glass/[0.06] border border-glass-border/[0.08] hover:border-glass-border/[0.2] backdrop-blur-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-[0_16px_48px_0_rgba(0,0,0,0.5)] h-full text-left overflow-hidden ${className}`}
    >
      {/* Top Image Container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-glass/[0.02] border border-glass-border/[0.05] mb-4 select-none">
        {product?.image && !imgError ? (
          <img
            src={product.image}
            alt={product.name || 'Product item'}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-glass/[0.08] to-glass/[0.02] p-4 text-center">
            <Package className="w-10 h-10 text-muted/60 mb-2" />
            <span className="text-xs text-muted font-medium">
              {product?.category || 'Curated Product'}
            </span>
          </div>
        )}

        {/* Category Pill Tag */}
        {product?.category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-bg/80 backdrop-blur-md border border-glass-border/[0.1] text-[10px] font-medium tracking-wide text-secondary">
            {product.category}
          </span>
        )}

        {/* Wishlist Heart Button with aria-label & Pop Feedback */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={isTogglingWishlist}
          aria-label={
            isWishlisted
              ? `Remove ${product?.name || 'item'} from wishlist`
              : `Add ${product?.name || 'item'} to wishlist`
          }
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            isWishlisted
              ? 'bg-danger/20 border-danger/40 text-danger scale-105 shadow-danger/20'
              : 'bg-bg/70 border-glass-border/[0.12] text-muted hover:text-danger hover:border-danger/30 hover:scale-105'
          } active:scale-90`}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 ${
              isWishlisted ? 'fill-current scale-110' : ''
            }`}
          />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div>
          <Link
            to={`/products/${product?._id}`}
            className="block group/link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
          >
            <h3 className="text-sm sm:text-base font-medium text-primary group-hover/link:text-accent transition-colors line-clamp-2 min-h-[2.5rem] leading-snug">
              {product?.name || 'Unnamed Product'}
            </h3>
          </Link>

          {/* Pricing & Stock Status */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-glass-border/[0.06]">
            <span className="text-base sm:text-lg font-semibold text-primary tracking-tight">
              ₹{product?.price ? Number(product.price).toLocaleString('en-IN') : '0'}
            </span>

            <span
              className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                isOutOfStock
                  ? 'bg-danger/10 text-danger border-danger/20'
                  : product?.stock && product.stock <= 5
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'bg-success/10 text-success border-success/20'
              }`}
            >
              {isOutOfStock
                ? 'Out of Stock'
                : product?.stock && product.stock <= 5
                ? `Only ${product.stock} left`
                : 'In Stock'}
            </span>
          </div>
        </div>

        {/* Card Actions: View & Add to Cart */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            to={`/products/${product?._id}`}
            aria-label={`View details of ${product?.name || 'product'}`}
            className="w-full inline-flex items-center justify-center py-2 px-3 rounded-full text-xs font-medium text-secondary hover:text-primary bg-glass/[0.04] hover:bg-glass/[0.1] border border-glass-border/[0.08] transition-all duration-200 text-center active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            View
          </Link>

          <GlassButton
            variant={justAdded ? 'primary' : 'glass'}
            size="sm"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            isLoading={isAddingCart}
            aria-label={
              isOutOfStock
                ? 'Product is out of stock'
                : `Add ${product?.name || 'item'} to cart`
            }
            icon={
              justAdded ? (
                <Check className="w-3.5 h-3.5 text-bg" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5" />
              )
            }
            className={`w-full text-xs font-medium active:scale-[0.97] transition-transform ${
              isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            {justAdded ? 'Added' : cartItem ? `In Cart (${cartItem.quantity})` : 'Add'}
          </GlassButton>
        </div>
      </div>
    </article>
  );
}
