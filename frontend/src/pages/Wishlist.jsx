import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowRight, AlertCircle } from 'lucide-react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/shop/ProductCard';
import GlassButton from '../components/ui/GlassButton';
import { fetchProducts } from '../services/api';

gsap.registerPlugin(Flip);

/**
 * Apple-Grade Dark Glassmorphic Wishlist Page
 * 
 * Features:
 * - Single source of truth via WishlistContext & CartContext
 * - Borderless product-first cards (variant="wishlist")
 * - Live polite counter: "n items saved"
 * - "Move all available to cart" CTA (in-stock only) with Undo toast
 * - Coordinated card exit animations & smooth reflow via GSAP Flip
 * - Artistic calm empty state with gentle floating glass heart orb
 * - "Start with these" curated recommendations when empty
 * - Accessible, responsive, respects prefers-reduced-motion
 */
export default function Wishlist({ onWishlistUpdate }) {
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const heartOrbRef = useRef(null);
  const hasAnimatedMount = useRef(false);

  const {
    items,
    count,
    loading,
    error,
    remove,
    restore,
    removeMany,
    restoreMany,
    refresh,
    showToast,
  } = useWishlist();

  const { addToCart, removeFromCart } = useCart();

  const [isMovingAll, setIsMovingAll] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  // Inform any legacy parent callbacks if provided
  useEffect(() => {
    if (onWishlistUpdate) {
      onWishlistUpdate(count);
    }
  }, [count, onWishlistUpdate]);

  // Load curated recommendations for empty state
  useEffect(() => {
    let isMounted = true;
    fetchProducts()
      .then((data) => {
        if (!isMounted) return;
        const prods = data.products || [];
        setSuggestedProducts(prods.slice(0, 4));
      })
      .catch((err) => {
        console.error('Failed to load wishlist recommendations:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const inStockItems = items.filter((item) => (item.stock ?? 0) > 0);
  const hasInStock = inStockItems.length > 0;

  // Staggered Mount Animation (Header + Cards fade & rise power3.out, stagger 0.07s)
  useGSAP(
    () => {
      if (loading || items.length === 0 || hasAnimatedMount.current) return;
      if (!containerRef.current) return;

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (headerRef.current) {
          tl.fromTo(
            headerRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.45 }
          );
        }

        const cards = containerRef.current.querySelectorAll('.wishlist-grid-item');
        if (cards.length > 0) {
          tl.fromTo(
            cards,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, clearProps: 'transform' },
            '-=0.25'
          );
        }

        hasAnimatedMount.current = true;
      });

      return () => mm.revert();
    },
    { dependencies: [loading, items.length > 0], scope: containerRef }
  );

  // Artistic Floating Animation for Empty State Glass Orb (6-8s sine.inOut)
  useGSAP(
    () => {
      if (!heartOrbRef.current) return;
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(heartOrbRef.current, {
          y: -10,
          duration: 3.5, // 7s full cycle
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      });

      return () => mm.revert();
    },
    { dependencies: [items.length === 0], scope: containerRef }
  );

  // Smooth Card Removal with GSAP Flip Reflow
  const handleCardRemove = useCallback(
    (product) => {
      if (!product?._id) return;
      const cardEl = containerRef.current?.querySelector(`[data-product-id="${product._id}"]`);

      const proceed = () => {
        let flipState = null;
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          try {
            flipState = Flip.getState('.wishlist-grid-item');
          } catch {
            // GSAP Flip fallback
          }
        }

        remove(product._id);

        if (flipState) {
          requestAnimationFrame(() => {
            try {
              Flip.from(flipState, {
                duration: 0.35,
                ease: 'power2.out',
                targets: '.wishlist-grid-item',
              });
            } catch {
              // Graceful fallback
            }
          });
        }
      };

      if (!cardEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        proceed();
        return;
      }

      gsap.to(cardEl, {
        scale: 0.96,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: proceed,
      });
    },
    [remove]
  );

  // Smooth Card Move-To-Cart with GSAP Flip Reflow
  const handleCardMoveToCart = useCallback(
    async (product) => {
      if (!product?._id) return;
      const cardEl = containerRef.current?.querySelector(`[data-product-id="${product._id}"]`);

      const proceed = async () => {
        let flipState = null;
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          try {
            flipState = Flip.getState('.wishlist-grid-item');
          } catch {
            // GSAP Flip fallback
          }
        }

        try {
          await addToCart(product._id);
          await remove(product._id, { showUndoToast: false });
          showToast(`Moved "${product.name}" to cart`, () => {
            restore(product);
            removeFromCart(product._id);
          });
        } catch (err) {
          console.error('Failed to move item to cart:', err);
        }

        if (flipState) {
          requestAnimationFrame(() => {
            try {
              Flip.from(flipState, {
                duration: 0.35,
                ease: 'power2.out',
                targets: '.wishlist-grid-item',
              });
            } catch {
              // Graceful fallback
            }
          });
        }
      };

      if (!cardEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        await proceed();
        return;
      }

      gsap.to(cardEl, {
        scale: 0.96,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: proceed,
      });
    },
    [addToCart, remove, restore, removeFromCart, showToast]
  );

  // Move All In-Stock Items to Cart
  const handleMoveAllToCart = async () => {
    if (isMovingAll || inStockItems.length === 0) return;

    try {
      setIsMovingAll(true);
      const itemsToMove = [...inStockItems];
      const idsToMove = itemsToMove.map((item) => item._id);

      // Add each in-stock item to cart
      for (const item of itemsToMove) {
        await addToCart(item._id);
      }

      // Optimistically remove moved items from wishlist
      await removeMany(idsToMove);

      const countMoved = itemsToMove.length;
      showToast(
        `Moved ${countMoved} ${countMoved === 1 ? 'item' : 'items'} to cart`,
        async () => {
          await restoreMany(itemsToMove);
          for (const item of itemsToMove) {
            await removeFromCart(item._id);
          }
        }
      );
    } catch (err) {
      console.error('Failed to move all items to cart:', err);
    } finally {
      setIsMovingAll(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-10"
    >
      {/* 1. APPLE-STYLE HEADER */}
      <header
        ref={headerRef}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-glass-border/[0.06]"
      >
        <div className="space-y-2 text-left">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-primary flex flex-wrap items-baseline gap-2">
            <span>Wishlist.</span>
            <span className="text-muted font-normal text-2xl sm:text-3xl md:text-5xl tracking-normal">
              Things you love.
            </span>
          </h1>
          {!loading && !error && (
            <p className="text-sm text-muted" aria-live="polite">
              <span className="text-primary font-medium">{count}</span>{' '}
              {count === 1 ? 'item saved' : 'items saved'}
            </p>
          )}
        </div>

        {/* Move All In-Stock Items to Cart CTA */}
        {!loading && !error && hasInStock && (
          <div className="flex-shrink-0">
            <GlassButton
              variant="secondary"
              size="md"
              isLoading={isMovingAll}
              onClick={handleMoveAllToCart}
              icon={<ShoppingCart className="w-4 h-4" />}
              aria-label="Move all available in-stock items to cart"
              className="rounded-full shadow-md text-xs font-semibold px-5 py-2.5"
            >
              Move all available to cart
            </GlassButton>
          </div>
        )}
      </header>

      {/* 2. LOADING STATE (Precise Aspect Ratio Matching Real Cards) */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-14">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="rounded-3xl p-3 sm:p-4 space-y-4 animate-pulse text-left">
              <div className="w-full aspect-[4/5] rounded-2xl sm:rounded-3xl bg-glass/[0.05]" />
              <div className="space-y-2 pt-2">
                <div className="h-2.5 bg-glass/[0.06] rounded w-1/4" />
                <div className="h-4 bg-glass/[0.08] rounded w-3/4" />
                <div className="h-4 bg-glass/[0.05] rounded w-1/2" />
                <div className="h-9 bg-glass/[0.06] rounded-full w-full mt-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. ERROR STATE */}
      {!loading && error && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-primary">Unable to load your wishlist</h2>
            <p className="text-xs text-muted leading-relaxed">
              {error || 'An unexpected network error occurred.'}
            </p>
          </div>
          <GlassButton variant="primary" size="md" onClick={refresh}>
            Try Again
          </GlassButton>
        </div>
      )}

      {/* 4. ARTISTIC CALM EMPTY STATE */}
      {!loading && !error && count === 0 && (
        <div className="py-14 sm:py-20 flex flex-col items-center justify-center text-center space-y-8 max-w-2xl mx-auto">
          {/* Glass Heart Orb with Soft Backlight and Idle Sine Float */}
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-6 rounded-full bg-rose-500/15 blur-2xl -z-10"
              aria-hidden="true"
            />
            <div
              ref={heartOrbRef}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-glass/[0.04] backdrop-blur-2xl border border-glass-border/[0.18] shadow-[0_20px_50px_rgba(244,63,94,0.12)] flex items-center justify-center select-none"
            >
              <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400 fill-rose-500/20 stroke-[1.5]" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-primary tracking-tight">
              Nothing saved yet
            </h2>
            <p className="text-sm text-muted max-w-sm mx-auto leading-relaxed">
              Tap the heart on anything you love and it will wait for you here.
            </p>
          </div>

          <div>
            <GlassButton
              as={Link}
              to="/products"
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              className="rounded-full shadow-lg px-7 py-3 text-sm font-semibold"
            >
              Explore products
            </GlassButton>
          </div>

          {/* Curated Recommendations: "Start with these" */}
          {suggestedProducts.length > 0 && (
            <div className="pt-16 border-t border-glass-border/[0.06] w-full text-left space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-semibold text-primary tracking-tight">
                  Start with these
                </h3>
                <p className="text-xs text-muted">
                  Trending highlights hand-picked for your collection
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {suggestedProducts.map((prod) => (
                  <ProductCard key={prod._id} product={prod} variant="catalog" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PRODUCT-FIRST WISHLIST GRID */}
      {!loading && !error && count > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-14">
          {items.map((product) => (
            <div
              key={product._id}
              data-product-id={product._id}
              className="wishlist-grid-item"
            >
              <ProductCard
                product={product}
                variant="wishlist"
                onRemove={handleCardRemove}
                onMoveToCart={handleCardMoveToCart}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
