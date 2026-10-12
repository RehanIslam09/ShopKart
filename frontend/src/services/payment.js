/**
 * Razorpay Script Loader & Color Resolver Service
 * Caches the script loading promise to avoid duplicate downloads.
 * Dynamically resolves theme colors from CSS tokens at runtime.
 */

let razorpayScriptPromise = null;

export function loadRazorpayScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existingScript) {
        if (window.Razorpay) {
          resolve(true);
        } else {
          existingScript.addEventListener('load', () => resolve(true));
          existingScript.addEventListener('error', () => resolve(false));
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        razorpayScriptPromise = null; // Allow retry on failure
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

/**
 * Resolves the theme accent color token from CSS variables into a hex code.
 * Reads --accent ("99 102 241") or falls back gracefully.
 */
export function getAccentHex() {
  if (typeof window === 'undefined') return '#6366f1';
  try {
    const rawAccent = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent')
      .trim();

    if (rawAccent) {
      const parts = rawAccent.split(/\s+/).map((p) => parseInt(p, 10));
      if (parts.length >= 3 && !parts.slice(0, 3).some(isNaN)) {
        return (
          '#' +
          parts
            .slice(0, 3)
            .map((n) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0'))
            .join('')
        );
      }
    }
  } catch (err) {
    console.warn('Unable to resolve --accent token:', err);
  }
  return '#6366f1';
}
