import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, ShoppingCart } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useCart } from '../context/CartContext';
import { useRazorpayCheckout } from '../hooks/useRazorpayCheckout';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import InputField from '../components/ui/InputField';
import { formatPrice } from '../utils/formatPrice';

export default function Checkout() {
  const { cartItems, loading: cartLoading, subtotal } = useCart();
  const outletContext = useOutletContext();
  const customer = outletContext?.customer;
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const formRef = useRef(null);
  const summaryRef = useRef(null);
  const headerRef = useRef(null);
  const stepBarRef = useRef(null);

  // Field refs for focusing on first invalid field
  const fullNameRef = useRef(null);
  const phoneRef = useRef(null);
  const addressLine1Ref = useRef(null);
  const cityRef = useRef(null);
  const stateRef = useRef(null);
  const pincodeRef = useRef(null);

  // Form State initialized with logged-in customer info if available
  const [formData, setFormData] = useState(() => ({
    fullName: customer?.fullName || '',
    phone: customer?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  }));

  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Razorpay payment integration hook
  const {
    isProcessing,
    processingMessage,
    errorMessage,
    cancelMessage,
    stockError,
    pendingVerification,
    isRetryingVerification,
    retryVerification,
    initiatePayment,
  } = useRazorpayCheckout();

  // Prefill name and phone if customer loaded asynchronously
  const hasPrefilledRef = useRef(false);
  useEffect(() => {
    if (customer && !hasPrefilledRef.current) {
      hasPrefilledRef.current = true;
      Promise.resolve().then(() => {
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || customer.fullName || '',
          phone: prev.phone || customer.phone || '',
        }));
      });
    }
  }, [customer]);

  // Empty cart guard: redirect to /cart only after cart finishes initial load
  useEffect(() => {
    if (!cartLoading && (!cartItems || cartItems.length === 0)) {
      navigate('/cart', { replace: true });
    }
  }, [cartLoading, cartItems, navigate]);

  // Validation function
  const validateField = (field, value) => {
    const val = (value || '').trim();
    switch (field) {
      case 'fullName':
        if (!val) return 'Full name is required.';
        if (val.length < 2) return 'Full name must be at least 2 characters.';
        return '';
      case 'phone': {
        if (!val) return 'Phone number is required.';
        const clean = val.replace(/[\s-]/g, '');
        let digits = clean;
        if (digits.startsWith('+91')) digits = digits.slice(3);
        else if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
        else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
        if (!/^[6-9]\d{9}$/.test(digits)) {
          return 'Please enter a valid 10-digit Indian mobile number.';
        }
        return '';
      }
      case 'addressLine1':
        if (!val) return 'Street address is required.';
        return '';
      case 'city':
        if (!val) return 'City is required.';
        return '';
      case 'state':
        if (!val) return 'State is required.';
        return '';
      case 'pincode':
        if (!val) return 'Pincode is required.';
        if (!/^\d{6}$/.test(val)) return 'Pincode must contain 6 digits.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(field, value);
      setFormErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setFormErrors((prev) => ({ ...prev, [field]: err }));
  };

  const validateAll = () => {
    const errors = {};
    const fields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
    fields.forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) errors[f] = err;
    });

    setFormErrors(errors);
    setTouched({
      fullName: true,
      phone: true,
      addressLine1: true,
      city: true,
      state: true,
      pincode: true,
    });

    if (Object.keys(errors).length > 0) {
      // Focus first invalid field
      const fieldRefs = {
        fullName: fullNameRef,
        phone: phoneRef,
        addressLine1: addressLine1Ref,
        city: cityRef,
        state: stateRef,
        pincode: pincodeRef,
      };
      for (const f of fields) {
        if (errors[f] && fieldRefs[f]?.current) {
          fieldRefs[f].current.focus();
          break;
        }
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    await initiatePayment({
      shippingAddress: {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      },
      customer,
    });
  };

  // GSAP Animations (restrained, useGSAP scoped, prefers-reduced-motion)
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Page header rise
        if (headerRef.current) {
          gsap.from(headerRef.current.children, {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.07,
            ease: 'power3.out',
          });
        }

        // Step indicator fill animation (0.4s)
        if (stepBarRef.current) {
          gsap.fromTo(
            stepBarRef.current,
            { scaleX: 0.33 },
            { scaleX: 0.66, duration: 0.4, ease: 'power2.out', transformOrigin: 'left' }
          );
        }

        // Form fields rise
        if (formRef.current) {
          gsap.from(formRef.current, {
            y: 20,
            opacity: 0,
            duration: 0.6,
            delay: 0.1,
            ease: 'power3.out',
          });
        }

        // Summary card slides in slightly after form
        if (summaryRef.current) {
          gsap.from(summaryRef.current, {
            y: 20,
            opacity: 0,
            duration: 0.6,
            delay: 0.2,
            ease: 'power3.out',
          });
        }
      });
    },
    { scope: containerRef }
  );

  if (cartLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-xs text-muted">Preparing your checkout…</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Shared Page Header */}
      <div ref={headerRef} className="space-y-3 text-left">
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-primary">
          Checkout.<span className="text-muted ml-3">Almost there.</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Review your items, provide shipping details, and complete your secure order.
        </p>
      </div>

      {/* Slim 3-step Indicator (Cart · Shipping · Payment) */}
      <div className="w-full max-w-xl mx-auto space-y-2 py-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted">
          <span className="text-primary font-semibold flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px]">
              ✓
            </span>
            <span>Cart</span>
          </span>
          <span className="text-primary font-semibold flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-accent text-bg flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Shipping</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-glass/[0.08] text-muted flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Payment</span>
          </span>
        </div>
        <div className="h-1 w-full bg-glass/[0.06] rounded-full overflow-hidden">
          <div ref={stepBarRef} className="h-full bg-accent w-full" />
        </div>
      </div>

      {/* Stock Error Notice */}
      {stockError && (
        <div
          role="alert"
          className="p-4 sm:p-5 rounded-2xl bg-danger/10 border border-danger/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3 text-danger text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{stockError}</span>
          </div>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-danger/20 hover:bg-danger/30 text-danger text-xs font-semibold transition-colors shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Back to Cart</span>
          </Link>
        </div>
      )}

      {/* Payment Error / Cancellation Notice */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 sm:p-5 rounded-2xl bg-danger/10 border border-danger/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3 text-danger text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {pendingVerification && (
            <GlassButton
              variant="primary"
              size="sm"
              isLoading={isRetryingVerification}
              onClick={retryVerification}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry confirmation
            </GlassButton>
          )}
        </div>
      )}

      {cancelMessage && !errorMessage && (
        <div className="p-3.5 rounded-2xl bg-glass/[0.04] border border-glass-border/[0.08] backdrop-blur-md text-xs text-muted text-left">
          {cancelMessage}
        </div>
      )}

      {/* Main 2-Column Desktop Grid / Stacked Mobile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Shipping Form (7 cols) */}
        <div ref={formRef} className="lg:col-span-7 order-2 lg:order-1">
          <GlassCard variant="default" padding="default" className="text-left space-y-6">
            <div className="border-b border-glass-border/[0.08] pb-4">
              <h2 className="text-lg font-semibold text-primary">Shipping Address</h2>
              <p className="text-xs text-muted mt-0.5">
                Where should we send your order?
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  id="fullName"
                  label="Full Name"
                  placeholder="e.g. Aarav Sharma"
                  autoComplete="name"
                  value={formData.fullName}
                  error={touched.fullName ? formErrors.fullName : ''}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  ref={fullNameRef}
                  disabled={isProcessing}
                />

                <InputField
                  id="phone"
                  label="Phone Number"
                  placeholder="e.g. 9876543210"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  error={touched.phone ? formErrors.phone : ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  ref={phoneRef}
                  disabled={isProcessing}
                />
              </div>

              <InputField
                id="addressLine1"
                label="Street Address"
                placeholder="e.g. Flat 402, Green Valley Apartments"
                autoComplete="street-address"
                value={formData.addressLine1}
                error={touched.addressLine1 ? formErrors.addressLine1 : ''}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                onBlur={() => handleBlur('addressLine1')}
                ref={addressLine1Ref}
                disabled={isProcessing}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField
                  id="city"
                  label="City"
                  placeholder="e.g. Bengaluru"
                  autoComplete="address-level2"
                  value={formData.city}
                  error={touched.city ? formErrors.city : ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  onBlur={() => handleBlur('city')}
                  ref={cityRef}
                  disabled={isProcessing}
                />

                <InputField
                  id="state"
                  label="State"
                  placeholder="e.g. Karnataka"
                  autoComplete="address-level1"
                  value={formData.state}
                  error={touched.state ? formErrors.state : ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                  onBlur={() => handleBlur('state')}
                  ref={stateRef}
                  disabled={isProcessing}
                />

                <InputField
                  id="pincode"
                  label="Pincode"
                  placeholder="e.g. 560001"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={formData.pincode}
                  error={touched.pincode ? formErrors.pincode : ''}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  onBlur={() => handleBlur('pincode')}
                  ref={pincodeRef}
                  disabled={isProcessing}
                />
              </div>

              {/* Desktop Submit Button (shown inside form on desktop) */}
              <div className="pt-4 hidden lg:block">
                <GlassButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full py-4 text-base tracking-wide font-semibold"
                  disabled={isProcessing}
                  isLoading={isProcessing}
                  aria-busy={isProcessing}
                >
                  {isProcessing
                    ? processingMessage || 'Preparing secure payment…'
                    : `Pay ${formatPrice(subtotal)}`}
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Right Column: Sticky Order Summary (5 cols) */}
        <div ref={summaryRef} className="lg:col-span-5 order-1 lg:order-2">
          <div className="lg:sticky lg:top-24 space-y-4">
            <GlassCard variant="default" padding="default" className="text-left space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-glass-border/[0.08]">
                <h2 className="text-base font-semibold text-primary">Order Summary</h2>
                <span className="text-xs text-muted">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
                </span>
              </div>

              {/* Cart Item Thumbnail List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cartItems.map((item, idx) => {
                  const prod = item.product || {};
                  const lineTotal = (prod.price || 0) * item.quantity;
                  return (
                    <div
                      key={prod._id || idx}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-glass/[0.06] border border-glass-border/[0.1] overflow-hidden shrink-0 flex items-center justify-center">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">📦</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-primary truncate max-w-[170px]">
                            {prod.name}
                          </p>
                          <p className="text-[11px] text-muted">
                            Qty: <span className="tabular-nums font-semibold">{item.quantity}</span>
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-primary tabular-nums shrink-0">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal & Free Shipping breakdown */}
              <div className="space-y-2 pt-3 border-t border-glass-border/[0.08] text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="font-medium text-primary tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Shipping</span>
                  <span className="text-success font-medium">FREE</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-glass-border/[0.08]">
                  <span className="font-semibold text-primary">Total</span>
                  <span className="text-xl font-bold text-primary tracking-tight tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>

              {/* Mobile Pay Button (inside summary card on mobile) */}
              <div className="pt-2 lg:hidden">
                <GlassButton
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full py-3.5 text-sm font-semibold"
                  disabled={isProcessing}
                  isLoading={isProcessing}
                  aria-busy={isProcessing}
                  onClick={handleSubmit}
                >
                  {isProcessing
                    ? processingMessage || 'Preparing secure payment…'
                    : `Pay ${formatPrice(subtotal)}`}
                </GlassButton>
              </div>

              {/* Razorpay Trust Badge */}
              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted select-none">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span>Secured by Razorpay · Test mode</span>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
