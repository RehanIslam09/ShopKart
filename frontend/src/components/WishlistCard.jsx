import ProductCard from './shop/ProductCard';

/**
 * Legacy WishlistCard wrapper forwarding to Apple-grade ProductCard
 */
export default function WishlistCard({ product, onRemove }) {
  return <ProductCard product={product} variant="wishlist" onRemove={onRemove} />;
}
