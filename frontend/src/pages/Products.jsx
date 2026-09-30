import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../services/api';
import GlassButton from '../components/ui/GlassButton';

/**
 * Product Catalog Page ("/products")
 * Displays dynamic product inventory with live search, category filtering,
 * and price sorting backed by MongoDB. Supports URL query params (q, category, sort).
 */
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';
  const sort = searchParams.get('sort') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setSearch = (newSearch) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSearch) next.set('q', newSearch);
      else next.delete('q');
      return next;
    });
  };

  const setCategory = (newCat) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newCat && newCat !== 'All') next.set('category', newCat);
      else next.delete('category');
      return next;
    });
  };

  const setSort = (newSort) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSort) next.set('sort', newSort);
      else next.delete('sort');
      return next;
    });
  };

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
    setSearchParams({});
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-glass/[0.05] border border-glass-border/[0.08] text-[11px] text-muted mb-2">
            <span>ShopKart Catalog</span>
            <span>•</span>
            <span className="text-primary font-medium">Hardware & Tools</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            Explore Curated Gear
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time querying directly backed by MongoDB and Express REST APIs
          </p>
        </div>

        {!loading && !error && (
          <span className="text-xs text-muted">
            Showing <strong className="text-primary">{products.length}</strong> items
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
              className="rounded-3xl bg-glass/[0.02] border border-glass-border/[0.06] p-4 space-y-4 animate-pulse"
            >
              <div className="w-full aspect-square rounded-2xl bg-glass/[0.05]" />
              <div className="space-y-2">
                <div className="h-4 bg-glass/[0.08] rounded-md w-3/4" />
                <div className="h-3 bg-glass/[0.04] rounded-md w-full" />
                <div className="h-3 bg-glass/[0.04] rounded-md w-2/3" />
              </div>
              <div className="h-8 bg-glass/[0.06] rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* 2. ERROR STATE */}
      {!loading && error && (
        <div className="p-8 rounded-3xl bg-danger/10 border border-danger/20 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-danger/20 flex items-center justify-center text-danger">
            ⚠️
          </div>
          <h3 className="text-sm font-medium text-danger">
            Failed to load products
          </h3>
          <p className="text-xs text-danger/80 max-w-md mx-auto">
            {error}
          </p>
          <GlassButton
            variant="glass"
            size="sm"
            onClick={() => setCategory('All')}
          >
            Retry Request
          </GlassButton>
        </div>
      )}

      {/* 3. EMPTY STATE */}
      {!loading && !error && products.length === 0 && (
        <div className="p-12 rounded-3xl bg-glass/[0.02] border border-glass-border/[0.06] text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-glass/[0.05] border border-glass-border/[0.08] flex items-center justify-center text-xl text-muted">
            🔍
          </div>
          <h3 className="text-base font-medium text-primary">
            No products found
          </h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            We couldn&apos;t find any products matching &quot;{search}&quot; in {category}. Try adjusting your keywords or category.
          </p>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={clearFilters}
          >
            Clear Filters
          </GlassButton>
        </div>
      )}

      {/* 4. DYNAMIC PRODUCTS GRID */}
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
