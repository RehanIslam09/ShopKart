import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { ShoppingBag, LogOut, Heart, ShoppingCart, User } from 'lucide-react';
import { logoutCustomer, getWishlist } from '../services/api';
import { useCart } from '../context/CartContext';
import GlassButton from '../components/ui/GlassButton';

/**
 * App Layout for Authenticated Pages (/home, /products, /wishlist, /cart)
 * Uses the same design tokens, glassmorphism, and minimal Apple aesthetic.
 */
export default function AppLayout() {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const customer = outletContext?.customer;
  const { totalItems } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    getWishlist()
      .then((data) => {
        if (data && data.wishlist) {
          setWishlistCount(data.wishlist.length);
        }
      })
      .catch(() => {
        setWishlistCount(0);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      navigate('/login');
    }
  };

  const navLinkStyle = ({ isActive }) =>
    `px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
      isActive
        ? 'bg-primary text-bg font-semibold shadow-sm'
        : 'text-muted hover:text-primary hover:bg-glass/[0.06]'
    }`;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bg text-primary">
      {/* App Top Glass Header Bar */}
      <header className="sticky top-4 z-50 px-4 sm:px-6 w-full max-w-6xl mx-auto transition-all duration-300">
        <nav className="flex items-center justify-between px-5 py-3 rounded-full bg-bg/80 backdrop-blur-2xl border border-glass-border/[0.1] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          {/* Brand Mark */}
          <Link
            to="/home"
            className="group flex items-center gap-2.5 text-primary hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-glass/[0.08] border border-glass-border/[0.14] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4 text-accent" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-primary">
              ShopKart
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 bg-glass/[0.03] p-1 rounded-full border border-glass-border/[0.06]">
            <NavLink to="/home" className={navLinkStyle}>
              Home
            </NavLink>
            <NavLink to="/products" className={navLinkStyle}>
              Products
            </NavLink>
            <NavLink to="/wishlist" className={navLinkStyle}>
              <Heart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-danger/20 text-danger border border-danger/30 text-[10px] font-semibold">
                  {wishlistCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/cart" className={navLinkStyle}>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-accent/25 text-accent border border-accent/40 text-[10px] font-semibold">
                  {totalItems}
                </span>
              )}
            </NavLink>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            {customer && (
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-medium text-primary leading-tight">
                  {customer.fullName}
                </span>
                <span className="text-[11px] text-muted leading-tight truncate max-w-[130px]">
                  {customer.email}
                </span>
              </div>
            )}

            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-xs font-semibold text-accent">
              {customer?.fullName ? customer.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>

            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs hover:text-danger hover:bg-danger/10"
              icon={<LogOut className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">Logout</span>
            </GlassButton>
          </div>
        </nav>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 w-full my-6">
        <Outlet context={{ customer, onWishlistUpdate: setWishlistCount }} />
      </main>

      {/* App Minimalist Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 border-t border-glass-border/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">ShopKart</span>
          <span>•</span>
          <span>Verified Secure Session</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <Link to="/" className="hover:text-primary transition-colors">
            Landing
          </Link>
          <span>•</span>
          <Link to="/products" className="hover:text-primary transition-colors">
            Catalog
          </Link>
          <span>•</span>
          <Link to="/wishlist" className="hover:text-primary transition-colors">
            Wishlist
          </Link>
          <span>•</span>
          <Link to="/cart" className="hover:text-primary transition-colors">
            Cart
          </Link>
        </div>
      </footer>
    </div>
  );
}
