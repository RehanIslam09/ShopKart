import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getOrderById } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { formatPrice } from '../utils/formatPrice';

const ORDER_STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const contentRef = useRef(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsNotFound(false);
      const data = await getOrderById(id);
      if (data.order) {
        setOrder(data.order);
      } else {
        setIsNotFound(true);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      if (err.status === 404) {
        setIsNotFound(true);
      } else {
        setError(err.message || 'Unable to fetch order');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      Promise.resolve().then(async () => {
        try {
          setLoading(true);
          setError(null);
          setIsNotFound(false);
          const data = await getOrderById(id);
          if (!isMounted) return;
          if (data.order) {
            setOrder(data.order);
          } else {
            setIsNotFound(true);
          }
        } catch (err) {
          if (!isMounted) return;
          if (err.status === 404) {
            setIsNotFound(true);
          } else {
            setError(err.message || 'Unable to fetch order');
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  // GSAP animation
  useGSAP(
    () => {
      if (!order) return;

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

        if (contentRef.current) {
          gsap.from(contentRef.current.children, {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power3.out',
            delay: 0.15,
          });
        }
      });
    },
    { dependencies: [order], scope: containerRef }
  );

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-8 w-40 bg-glass/[0.08] rounded-full animate-pulse" />
        <div className="h-40 rounded-3xl bg-glass/[0.04] border border-glass-border/[0.08] animate-pulse" />
        <div className="h-64 rounded-3xl bg-glass/[0.04] border border-glass-border/[0.08] animate-pulse" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="w-full max-w-md mx-auto py-20 text-center space-y-4">
        <div className="p-10 rounded-3xl bg-glass/[0.03] border border-glass-border/[0.08] backdrop-blur-xl space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-danger" />
          </div>
          <h2 className="text-xl font-semibold text-primary">Order Not Found</h2>
          <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
            The requested order does not exist or you do not have permission to view it.
          </p>
          <div className="pt-2">
            <GlassButton as={Link} to="/orders" variant="primary" size="md">
              Back to My Orders
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto py-20 text-center space-y-4">
        <div className="p-8 rounded-3xl bg-danger/10 border border-danger/20 backdrop-blur-xl space-y-3">
          <AlertCircle className="w-8 h-8 text-danger mx-auto" />
          <h2 className="text-base font-semibold text-primary">Unable to load order</h2>
          <p className="text-xs text-danger/80">{error}</p>
          <GlassButton variant="primary" size="sm" onClick={fetchOrder}>
            Retry
          </GlassButton>
        </div>
      </div>
    );
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

  const currentStepIdx = ORDER_STEPS.indexOf(order.status);
  const activeIdx = currentStepIdx === -1 ? 0 : currentStepIdx;
  const shortPaymentId = order.razorpayPaymentId
    ? order.razorpayPaymentId.slice(-8).toUpperCase()
    : 'N/A';

  return (
    <div ref={containerRef} className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Navigation & Header */}
      <div ref={headerRef} className="space-y-3 text-left">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-primary font-mono">
            Order #{shortId}
          </h1>
          <span className="text-xs text-muted">{dateFormatted}</span>
        </div>
      </div>

      <div ref={contentRef} className="space-y-6">
        {/* Status Stepper Card */}
        <GlassCard variant="default" padding="default" className="text-left space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Order Progress
          </h2>

          <div className="relative pt-2 pb-2">
            {/* Step Track */}
            <div className="grid grid-cols-4 gap-2 text-center relative z-10">
              {ORDER_STEPS.map((step, idx) => {
                const isPassed = idx <= activeIdx;
                const isCurrent = idx === activeIdx;

                return (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCurrent
                          ? 'bg-accent text-bg shadow-[0_0_20px_rgba(var(--accent)/0.5)] ring-4 ring-accent/20'
                          : isPassed
                          ? 'bg-success/20 text-success border border-success/30'
                          : 'bg-glass/[0.06] text-muted border border-glass-border/[0.08]'
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-semibold tracking-wide ${
                        isCurrent
                          ? 'text-accent'
                          : isPassed
                          ? 'text-primary'
                          : 'text-muted'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* 2-Column Grid: Items Snapshot vs. Order Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Purchased Items Snapshot (7 cols) */}
          <div className="lg:col-span-7">
            <GlassCard variant="default" padding="default" className="text-left space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted pb-2 border-b border-glass-border/[0.08]">
                Purchased Items ({order.items?.length || 0})
              </h2>

              <div className="divide-y divide-glass-border/[0.06]">
                {order.items?.map((item, idx) => (
                  <div
                    key={item.product || idx}
                    className="py-3.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-glass/[0.06] border border-glass-border/[0.1] overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">📦</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-primary truncate max-w-[200px] sm:max-w-xs text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          Price at purchase: {formatPrice(item.price)}
                        </p>
                        <p className="text-[11px] text-muted">
                          Qty: <span className="tabular-nums font-semibold">{item.quantity}</span>
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-primary tabular-nums shrink-0 text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="pt-4 border-t border-glass-border/[0.08] space-y-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className="text-success font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-base font-bold text-primary pt-2 border-t border-glass-border/[0.08]">
                  <span>Total Paid</span>
                  <span className="tabular-nums text-lg">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Shipping & Payment Details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Delivery Address */}
            <GlassCard variant="default" padding="default" className="text-left space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm pb-2 border-b border-glass-border/[0.08]">
                <MapPin className="w-4 h-4 text-accent" />
                <span>Delivery Address</span>
              </div>
              {order.shippingAddress ? (
                <div className="text-xs space-y-1 text-muted leading-relaxed">
                  <p className="font-semibold text-primary text-sm">
                    {order.shippingAddress.fullName}
                  </p>
                  <p>Phone: {order.shippingAddress.phone}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                    {order.shippingAddress.pincode}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted">No address snapshot available.</p>
              )}
            </GlassCard>

            {/* Payment Information */}
            <GlassCard variant="default" padding="default" className="text-left space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm pb-2 border-b border-glass-border/[0.08]">
                <CreditCard className="w-4 h-4 text-accent" />
                <span>Payment Details</span>
              </div>
              <div className="text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Payment Status</span>
                  <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-bold">
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Gateway</span>
                  <span className="text-primary font-medium">Razorpay (Test Mode)</span>
                </div>
                {order.razorpayPaymentId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Payment ID</span>
                    <span className="font-mono text-[11px] text-primary">
                      #{shortPaymentId}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-glass-border/[0.06]">
                  <span className="text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Placed At</span>
                  </span>
                  <span className="text-primary">{dateFormatted}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
