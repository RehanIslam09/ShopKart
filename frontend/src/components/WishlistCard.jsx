import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function WishlistCard({ product, onRemove }) {
  const [isRemoving, setIsRemoving] = useState(false);
  const isOutOfStock = product.stock <= 0;

  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      await onRemove(product._id);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="group rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.16] backdrop-blur-xl p-4 flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px] shadow-[0_8px_30px_rgb(0,0,0,0.2)] text-left">
      {/* Product Image */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.05] mb-4">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-zinc-950/70 backdrop-blur-md border border-white/[0.1] text-[10px] font-medium text-zinc-200">
          {product.category}
        </span>
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

        {/* Price and Stock Indicator */}
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

        {/* Action Buttons: View Details & Remove */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Link
            to={`/products/${product._id}`}
            className="py-2 rounded-xl bg-white/[0.08] hover:bg-white text-zinc-200 hover:text-zinc-950 border border-white/[0.1] hover:border-transparent text-xs font-medium text-center transition-all duration-200 block shadow-sm"
          >
            View Details
          </Link>

          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            className="py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-1"
          >
            <span>{isRemoving ? '⏳' : '♥'}</span>
            <span>{isRemoving ? 'Removing...' : 'Remove'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
