import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, MapPin, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getOrderById } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { formatPrice } from '../utils/formatPrice';

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrderById(id);
        if (!isMounted) return;

        if (!data.order || data.order.paymentStatus !== 'PAID') {
          // If not paid, redirect to cart with notice
          navigate('/cart', { replace: true });
          return;
        }

        setOrder(data.order);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching order for success screen:', err);
        setError(err.message || 'Unable to load order details');
        // If foreign or invalid order, navigate back
        navigate('/cart', { replace: true });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) {
      fetchOrder();
    }

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  // GSAP Checkmark Drawing Animation
  useGSAP(
    () => {
      if (!order) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        tl.to('.check-circle', {
          strokeDashoffset: 0,
          duration: 0.55,
        })
          .to(
            '.check-tick',
            {
              strokeDashoffset: 0,
              duration: 0.35,
            },
            '-=0.15'
          )
          .fromTo(
            '.check-wrapper',
            { scale: 0.85 },
            { scale: 1, duration: 0.4, ease: 'back.out(2)' },
            '-=0.1'
          )
          .from(
            '.success-content-item',
            {
              opacity: 0,
              y: 16,
              duration: 0.45,
              stagger: 0.06,
              ease: 'power3.out',
            },
            '-=0.15'
          );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('.check-circle', { strokeDashoffset: 0 });
        gsap.set('.check-tick', { strokeDashoffset: 0 });
      });
    },
    { dependencies: [order], scope: containerRef }
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-xs text-muted">Confirming your order details…</p>
      </div>
    );
  }

  if (error || !order) {
    return null;
  }

  const shortId = order._id ? order._id.slice(-8).toUpperCase() : '';
  const dateFormatted = order.createdAt
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(order.createdAt))
    : '';

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Centered Glass Card */}
      <GlassCard variant="elevated" padding="lg" className="text-center space-y-6">
        {/* Animated Checkmark Canvas */}
        <div className="check-wrapper flex items-center justify-center pt-2">
          <div className="w-20 h-20 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success shadow-[0_0_40px_rgba(var(--success)/0.25)]">
            <svg
              className="w-14 h-14"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Outer stroke circle */}
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="check-circle"
                strokeDasharray="220"
                strokeDashoffset="220"
              />
              {/* Inner tick */}
              <path
                d="M26 40 L35 50 L54 30"
                stroke="currentColor"
                strokeWidth="4.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="check-tick"
                strokeDasharray="60"
                strokeDashoffset="60"
              />
            </svg>
          </div>
        </div>

        {/* Header Content */}
        <div className="success-content-item space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Payment Verified</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
            Order Placed Successfully
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Thank you for shopping with ShopKart. Your order has been placed and is being prepared.
          </p>
        </div>

        {/* Order Meta Bar */}
        <div className="success-content-item grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-glass/[0.04] border border-glass-border/[0.08] text-left text-xs">
          <div>
            <span className="text-muted text-[11px] block">Order ID</span>
            <span className="font-mono font-semibold text-primary">{shortId}</span>
          </div>
          <div>
            <span className="text-muted text-[11px] block">Date</span>
            <span className="text-primary truncate block">{dateFormatted}</span>
          </div>
          <div>
            <span className="text-muted text-[11px] block">Total Amount</span>
            <span className="font-semibold text-primary tabular-nums">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
          <div>
            <span className="text-muted text-[11px] block">Status</span>
            <span className="inline-flex px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-bold">
              {order.status}
            </span>
          </div>
        </div>

        {/* Snapshot Items List */}
        <div className="success-content-item text-left space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Items in this Order ({order.items?.length || 0})
          </h3>
          <div className="divide-y divide-glass-border/[0.06] rounded-2xl bg-glass/[0.02] border border-glass-border/[0.06] overflow-hidden">
            {order.items?.map((item, idx) => (
              <div
                key={item.product || idx}
                className="p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-glass/[0.06] border border-glass-border/[0.1] overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">📦</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-primary truncate max-w-[220px] sm:max-w-xs">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted">
                      Qty: <span className="tabular-nums font-semibold">{item.quantity}</span> ×{' '}
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-primary tabular-nums shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address Snapshot */}
        {order.shippingAddress && (
          <div className="success-content-item text-left p-4 rounded-2xl bg-glass/[0.03] border border-glass-border/[0.06] space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span>Delivery Address</span>
            </div>
            <p className="text-muted leading-relaxed">
              <strong className="text-primary">{order.shippingAddress.fullName}</strong> ({order.shippingAddress.phone})
              <br />
              {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
              {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="success-content-item pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <GlassButton
            as={Link}
            to="/orders"
            variant="primary"
            size="md"
            icon={<ShoppingBag className="w-4 h-4" />}
            className="w-full sm:w-auto px-7"
          >
            View My Orders
          </GlassButton>
          <GlassButton
            as={Link}
            to="/products"
            variant="glass"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto px-7"
          >
            Continue Shopping
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}
