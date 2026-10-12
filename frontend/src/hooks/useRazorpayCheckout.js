import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPaymentOrder, verifyPayment } from '../services/api';
import { loadRazorpayScript, getAccentHex } from '../services/payment';
import { useCart } from '../context/CartContext';

/**
 * Custom hook for Razorpay Standard Checkout in ShopKart.
 * Manages payment order creation, secure gateway modal, HMAC signature verification,
 * cart clearance on verified payment, and network-retry edge case.
 */
export function useRazorpayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cancelMessage, setCancelMessage] = useState('');
  const [stockError, setStockError] = useState(null);
  const [pendingVerification, setPendingVerification] = useState(null);
  const [isRetryingVerification, setIsRetryingVerification] = useState(false);

  const { clearCart, refreshCart } = useCart();
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  const handleVerificationSuccess = useCallback(
    async (order) => {
      // Clear global cart state immediately
      clearCart();
      try {
        await refreshCart();
      } catch {
        // Local state is already cleared
      }
      setPendingVerification(null);
      navigate(`/order-success/${order._id}`, { replace: true });
    },
    [clearCart, refreshCart, navigate]
  );

  const retryVerification = useCallback(async () => {
    if (!pendingVerification) return;
    try {
      setIsRetryingVerification(true);
      setErrorMessage('');
      const res = await verifyPayment(pendingVerification);
      if (res.success && res.order) {
        await handleVerificationSuccess(res.order);
      } else {
        throw new Error(res.message || 'Verification retry failed');
      }
    } catch (err) {
      setErrorMessage(
        err.message || 'Payment received, but confirmation failed. Please retry.'
      );
    } finally {
      setIsRetryingVerification(false);
    }
  }, [pendingVerification, handleVerificationSuccess]);

  const initiatePayment = useCallback(
    async ({ shippingAddress, customer }) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsProcessing(true);
      setProcessingMessage('Preparing secure payment…');
      setErrorMessage('');
      setCancelMessage('');
      setStockError(null);
      setPendingVerification(null);

      try {
        // 1. Create order on backend (send ONLY shippingAddress; totals ignored)
        const data = await createPaymentOrder(shippingAddress);

        // 2. Ensure Razorpay checkout script is loaded
        setProcessingMessage('Loading payment gateway…');
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          throw new Error(
            'Failed to load secure Razorpay gateway. Please check your internet connection.'
          );
        }

        // 3. Resolve runtime accent theme color from CSS variables
        const accentHex = getAccentHex();

        // 4. Instantiate Razorpay modal options
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'ShopKart',
          description: 'ShopKart Order Checkout',
          order_id: data.razorpayOrderId,
          prefill: {
            name: shippingAddress.fullName || customer?.fullName || '',
            contact: shippingAddress.phone || customer?.phone || '',
            email: customer?.email || '',
          },
          theme: {
            color: accentHex,
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              setProcessingMessage('');
              setCancelMessage('Payment cancelled. Your cart has been saved.');
              isSubmittingRef.current = false;
            },
          },
          handler: async function (response) {
            // CRITICAL: Never treat handler as proof of payment. Verify signature on server!
            setProcessingMessage("Payment received. Confirming order with server…");
            const verificationPayload = {
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            try {
              const verifyRes = await verifyPayment(verificationPayload);
              if (verifyRes.success && verifyRes.order) {
                await handleVerificationSuccess(verifyRes.order);
              } else {
                throw new Error(verifyRes.message || 'Payment signature verification failed');
              }
            } catch (verifyErr) {
              console.error('Payment verification failed:', verifyErr);
              // Edge case: payment succeeded on Razorpay but network verify failed
              setPendingVerification(verificationPayload);
              setErrorMessage(
                "Payment received. We're confirming your order. Please click 'Retry confirmation'."
              );
            } finally {
              setIsProcessing(false);
              setProcessingMessage('');
              isSubmittingRef.current = false;
            }
          },
        };

        const razorpayInstance = new window.Razorpay(options);

        razorpayInstance.on('payment.failed', function (failRes) {
          console.error('Razorpay payment failed:', failRes);
          setErrorMessage(
            'Payment failed. Your cart has not been cleared. Please try again.'
          );
          setIsProcessing(false);
          setProcessingMessage('');
          isSubmittingRef.current = false;
        });

        razorpayInstance.open();
      } catch (err) {
        console.error('Payment initiation error:', err);
        if (
          err.status === 400 &&
          (err.message?.toLowerCase().includes('stock') ||
            err.message?.toLowerCase().includes('cart') ||
            err.message?.toLowerCase().includes('product'))
        ) {
          setStockError(err.message);
        } else {
          setErrorMessage(
            err.message || 'Unable to prepare payment order. Please try again.'
          );
        }
        setIsProcessing(false);
        setProcessingMessage('');
        isSubmittingRef.current = false;
      }
    },
    [handleVerificationSuccess]
  );

  return {
    isProcessing,
    processingMessage,
    errorMessage,
    cancelMessage,
    stockError,
    pendingVerification,
    isRetryingVerification,
    retryVerification,
    initiatePayment,
    setErrorMessage,
    setCancelMessage,
    setStockError,
  };
}
