import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, RefreshCw, AlertCircle } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getMyOrders } from '../services/api';
import OrderCard from '../components/orders/OrderCard';
import GlassButton from '../components/ui/GlassButton';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const gridRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrders();
      const placedOrders = (data.orders || []).filter(
        (o) => o.status !== 'PENDING_PAYMENT'
      );
      setOrders(placedOrders);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyOrders();
        if (isMounted) {
          const placedOrders = (data.orders || []).filter(
            (o) => o.status !== 'PENDING_PAYMENT'
          );
          setOrders(placedOrders);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load orders');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP animation
  useGSAP(
    () => {
      if (loading || error || orders.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (headerRef.current) {
          gsap.from(headerRef.current.children, {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.07,
            ease: 'power3.out',
          });
        }

        if (gridRef.current) {
          gsap.from(gridRef.current.children, {
            y: 20,
            opacity: 0,
            duration: 0.55,
            stagger: 0.08,
            ease: 'power3.out',
            delay: 0.15,
          });
        }
      });
    },
    { dependencies: [loading, error, orders.length], scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Shared Page Header */}
      <div ref={headerRef} className="space-y-3 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Purchase History</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-primary">
          Orders.<span className="text-muted ml-3">Everything you've bought.</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Track packages, review item details, and view purchase receipts.
        </p>
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-glass/[0.04] border border-glass-border/[0.08] p-6 animate-pulse flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="h-4 bg-glass/[0.08] rounded-full w-1/3" />
                <div className="h-3 bg-glass/[0.06] rounded-full w-1/4" />
              </div>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-xl bg-glass/[0.08]" />
                <div className="w-10 h-10 rounded-xl bg-glass/[0.08]" />
              </div>
              <div className="h-8 bg-glass/[0.08] rounded-2xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error State with Retry Button */}
      {!loading && error && (
        <div className="w-full max-w-md mx-auto py-16 text-center space-y-4">
          <div className="p-8 rounded-3xl bg-danger/10 border border-danger/20 backdrop-blur-xl space-y-3">
            <AlertCircle className="w-10 h-10 text-danger mx-auto" />
            <h2 className="text-base font-semibold text-primary">Unable to load orders.</h2>
            <p className="text-xs text-danger/80">{error}</p>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={fetchOrders}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="mt-2"
            >
              Try Again
            </GlassButton>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div className="w-full max-w-md mx-auto py-16 text-center space-y-4">
          <div className="p-12 rounded-3xl bg-glass/[0.03] border border-glass-border/[0.08] backdrop-blur-xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-glass/[0.08] border border-glass-border/[0.12] flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-muted" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-primary">
                You have not placed any orders yet.
              </h2>
              <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
                When you make a purchase, your orders and tracking details will appear here.
              </p>
            </div>
            <div className="pt-2">
              <GlassButton
                as={Link}
                to="/products"
                variant="primary"
                size="md"
                className="px-6"
              >
                Start Shopping
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      {!loading && !error && orders.length > 0 && (
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
        >
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
