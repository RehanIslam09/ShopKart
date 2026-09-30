export default function SearchBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}) {
  const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Books'];

  return (
    <div className="w-full flex flex-col sm:flex-row gap-3 items-center justify-between p-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
      {/* Search Input */}
      <div className="relative w-full sm:flex-1">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search products by name (e.g. keyboard, headphones)..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:bg-white/[0.04] transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Category Dropdown */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-xs font-medium text-zinc-200 outline-none cursor-pointer focus:border-indigo-400"
        >
          <option value="All">All Categories</option>
          {categories.filter((c) => c !== 'All').map((cat) => (
            <option key={cat} value={cat} className="bg-zinc-900 text-white">
              {cat}
            </option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-xs font-medium text-zinc-200 outline-none cursor-pointer focus:border-indigo-400"
        >
          <option value="">Featured</option>
          <option value="price_asc" className="bg-zinc-900 text-white">
            Price: Low to High
          </option>
          <option value="price_desc" className="bg-zinc-900 text-white">
            Price: High to Low
          </option>
        </select>
      </div>
    </div>
  );
}
