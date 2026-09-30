import { useEffect, useState } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { ShieldCheck, ArrowRight, User, Mail, Phone, LayoutGrid } from 'lucide-react';
import { getMe } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

/**
 * Authenticated Customer Dashboard Page ("/home")
 * Restyled with design tokens to seamlessly integrate with the Apple-style aesthetic.
 */
export default function Home({ setCustomer: setGlobalCustomer }) {
  const navigate = useNavigate();
  const outletCtx = useOutletContext();

  const [fetchedCustomer, setFetchedCustomer] = useState(null);
  const [loading, setLoading] = useState(!outletCtx?.customer);

  const customer = outletCtx?.customer || fetchedCustomer;

  useEffect(() => {
    let isMounted = true;

    if (outletCtx?.customer) {
      return;
    }

    async function checkAuth() {
      try {
        setLoading(true);
        const data = await getMe();
        if (isMounted) {
          setFetchedCustomer(data);
          if (setGlobalCustomer) setGlobalCustomer(data);
        }
      } catch {
        if (isMounted) {
          if (setGlobalCustomer) setGlobalCustomer(null);
          navigate('/login');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, setGlobalCustomer, outletCtx?.customer]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-xs text-muted">Loading account details...</p>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <GlassCard variant="elevated" padding="lg" className="text-left space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Protected Route Authenticated</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
          Welcome back, {customer.fullName}!
        </h1>

        <p className="text-sm text-muted max-w-xl leading-relaxed">
          You are authenticated via a secure HttpOnly cookie session. Your account and
          cart synchronicity are directly verified with the database.
        </p>

        <div className="pt-2">
          <GlassButton
            as={Link}
            to="/products"
            variant="primary"
            size="md"
            icon={<ArrowRight className="w-4 h-4 ml-1" />}
          >
            Browse Product Catalog
          </GlassButton>
        </div>
      </GlassCard>

      {/* Customer Profile Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <GlassCard padding="sm" className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted text-xs mb-1">
            <User className="w-3.5 h-3.5 text-accent" />
            <span className="font-medium uppercase tracking-wider text-[10px]">Customer Name</span>
          </div>
          <div className="text-sm font-medium text-primary">
            {customer.fullName}
          </div>
        </GlassCard>

        <GlassCard padding="sm" className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted text-xs mb-1">
            <Mail className="w-3.5 h-3.5 text-accent" />
            <span className="font-medium uppercase tracking-wider text-[10px]">Email Address</span>
          </div>
          <div className="text-sm font-medium text-primary truncate">
            {customer.email}
          </div>
        </GlassCard>

        <GlassCard padding="sm" className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted text-xs mb-1">
            <Phone className="w-3.5 h-3.5 text-accent" />
            <span className="font-medium uppercase tracking-wider text-[10px]">Phone Number</span>
          </div>
          <div className="text-sm font-medium text-primary">
            {customer.phone}
          </div>
        </GlassCard>
      </div>

      {/* Catalog Teaser */}
      <GlassCard
        padding="md"
        className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-primary">
              Product Discovery & Catalog
            </h3>
          </div>
          <p className="text-xs text-muted max-w-lg">
            Search, filter by category, sort by price, add to wishlist, or manage your shopping cart in real time.
          </p>
        </div>

        <GlassButton
          as={Link}
          to="/products"
          variant="glass"
          size="sm"
          className="shrink-0"
        >
          Explore Catalog
        </GlassButton>
      </GlassCard>
    </div>
  );
}
