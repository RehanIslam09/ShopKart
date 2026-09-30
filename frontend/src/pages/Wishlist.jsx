import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WishlistCard from '../components/WishlistCard';
import { getWishlist, removeFromWishlist } from '../services/api';

export default function Wishlist({ onWishlistUpdate }) {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWishlist();
      setWishlist(data.wishlist || []);
      if (onWishlistUpdate) onWishlistUpdate(data.count || (data.wishlist ? data.wishlist.length : 0));
    } catch (err) {
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setError("We couldn't load your wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getWishlist()
      .then((data) => {
        if (isMounted) {
          setWishlist(data.wishlist || []);
          if (onWishlistUpdate) onWishlistUpdate(data.count || (data.wishlist ? data.wishlist.length : 0));
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (err.status === 401) {
            navigate('/login');
            return;
          }
          setError("We couldn't load your wishlist.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, onWishlistUpdate]);

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      const updated = wishlist.filter((item) => item._id !== productId);
      setWishlist(updated);
      if (onWishlistUpdate) onWishlistUpdate(updated.length);
    } catch (err) {
      console.error('Failed to remove item from wishlist:', err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left border-b border-white/[0.06] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 mb-2">
            <span>Engineering Lab 04</span>
            <span>•</span>
            <span>Customer Wishlist</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-2">
            <span>My Wishlist</span>
            <span className="text-rose-400">♥</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Persisted in MongoDB with referenced Product population
          </p>
        </div>

        {!loading && !error && (
          <span className="text-xs text-zinc-400">
            <strong className="text-white">{wishlist.length}</strong> {wishlist.length === 1 ? 'product' : 'products'} saved
          </span>
        )}
      </div>

      {/* 1. LOADING STATE (Section 10) */}
      {loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 py-6">
            <div className="w-5 h-5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
            <span>Loading your wishlist...</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-3xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-4 animate-pulse"
              >
                <div className="w-full aspect-square rounded-2xl bg-white/[0.05]" />
                <div className="h-4 bg-white/[0.08] rounded-md w-3/4" />
                <div className="h-3 bg-white/[0.04] rounded-md w-full" />
                <div className="h-8 bg-white/[0.06] rounded-xl w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ERROR STATE (Section 11) */}
      {!loading && error && (
        <div className="p-12 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center text-xl text-rose-300">
            ⚠️
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-white">Something went wrong.</h3>
            <p className="text-xs text-rose-300/80">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadWishlist}
            className="px-5 py-2.5 rounded-2xl bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-all cursor-pointer shadow-md active:scale-95"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 3. EMPTY STATE (Section 9) */}
      {!loading && !error && wishlist.length === 0 && (
        <div className="p-16 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-3xl text-rose-400">
            ❤️
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-medium text-white">Your wishlist is empty</h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Save products you love and find them here later.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-all cursor-pointer shadow-md shadow-white/10 active:scale-95"
            >
              <span>Browse Products</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4. DYNAMIC WISHLIST GRID (Section 6) */}
      {!loading && !error && wishlist.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
