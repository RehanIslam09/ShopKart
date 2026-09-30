import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProductById } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProductById(id);
        if (isMounted) {
          setProduct(data.product);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Product not found.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (isAdding || !product || product.stock <= 0) return;
    try {
      setIsAdding(true);
      await addToCart(product._id);
      setAddedMessage(true);
      setTimeout(() => setAddedMessage(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-400">Loading product details...</p>
      </div>
    );
  }

  // 2. Error State / Not Found
  if (error || !product) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl space-y-3">
          <div className="text-3xl">📦</div>
          <h2 className="text-lg font-semibold text-white">Product Not Found</h2>
          <p className="text-xs text-zinc-400">
            {error || "The product you're looking for does not exist."}
          </p>
          <Link
            to="/products"
            className="inline-block px-4 py-2 rounded-xl bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-all"
          >
            ← Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  // 3. Product Details Display
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 text-left">
        <Link to="/products" className="hover:text-white transition-colors">
          Products
        </Link>
        <span>/</span>
        <span className="text-zinc-500">{product.category}</span>
        <span>/</span>
        <span className="text-zinc-200 truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Product Image */}
        <div className="md:col-span-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl overflow-hidden aspect-square flex items-center justify-center p-4">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>

        {/* Right: Product Info & Actions */}
        <div className="md:col-span-6 text-left space-y-6 p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-medium text-zinc-300">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              {product.name}
            </h1>
          </div>

          <div className="flex items-baseline gap-4 pb-4 border-b border-white/[0.06]">
            <span className="text-3xl font-bold text-white tracking-tight">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                isOutOfStock
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {isOutOfStock ? 'Currently Out of Stock' : `${product.stock} units available`}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Description
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Action Button: Add to Cart */}
          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-lg active:scale-[0.98] ${
                isOutOfStock
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-white/10'
              }`}
            >
              {isAdding ? 'Adding to Cart...' : isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>

            {addedMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center animate-fade-in">
                ✓ Added to cart!
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.06] text-xs text-zinc-500 flex items-center justify-between">
            <span>Product ID: {product._id}</span>
            <Link to="/products" className="text-indigo-400 hover:text-indigo-300">
              ← Return to all products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
