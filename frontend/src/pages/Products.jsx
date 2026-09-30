import React, { useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../services/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');

  // Fetch products on query state changes
  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchProducts({
          search,
          category,
          sort,
        });

        if (isMounted) {
          setProducts(data.products || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Something went wrong while loading products.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    // Debounce search slightly to prevent excessive network requests
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [search, category, sort]);

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setSort('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-zinc-400 mb-2">
            <span>Engineering Lab 03</span>
            <span>•</span>
            <span className="text-zinc-200">Catalog & Discovery</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Explore Products
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time querying directly backed by MongoDB and Express REST APIs
          </p>
        </div>

        {!loading && !error && (
          <span className="text-xs text-zinc-400">
            Showing <strong className="text-white">{products.length}</strong> items
          </span>
        )}
      </div>

      {/* Search & Category Filter Controls */}
      <SearchBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
      />

      {/* 1. LOADING STATE */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="rounded-3xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-4 animate-pulse"
            >
              <div className="w-full aspect-square rounded-2xl bg-white/[0.05]" />
              <div className="space-y-2">
                <div className="h-4 bg-white/[0.08] rounded-md w-3/4" />
                <div className="h-3 bg-white/[0.04] rounded-md w-full" />
                <div className="h-3 bg-white/[0.04] rounded-md w-2/3" />
              </div>
              <div className="h-8 bg-white/[0.06] rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* 2. ERROR STATE */}
      {!loading && error && (
        <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300">
            ⚠️
          </div>
          <h3 className="text-sm font-medium text-rose-200">
            Failed to load products
          </h3>
          <p className="text-xs text-rose-300/80 max-w-md mx-auto">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setCategory('All')}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium border border-rose-500/30 transition-all cursor-pointer"
          >
            Retry Request
          </button>
        </div>
      )}

      {/* 3. EMPTY STATE */}
      {!loading && !error && products.length === 0 && (
        <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xl text-zinc-400">
            🔍
          </div>
          <h3 className="text-base font-medium text-white">
            No products found
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            We couldn't find any products matching "{search}" in {category}. Try adjusting your keywords or category.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-all cursor-pointer shadow-sm"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* 4. DYNAMIC PRODUCTS GRID (.map) */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
