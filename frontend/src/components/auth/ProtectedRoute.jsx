import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getMe } from '../../services/api';

/**
 * Protected Route Wrapper
 * On mount, queries GET /customers/me to verify server-side HttpOnly cookie session.
 * Displays a zero-flicker glass loader while pending, redirects unauthenticated sessions
 * to /login, and renders authenticated children / <Outlet /> with the verified customer profile.
 */
export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('pending'); // 'pending' | 'authenticated' | 'unauthenticated'
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getMe()
      .then((data) => {
        if (isMounted) {
          setCustomer(data);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (isMounted) {
          setCustomer(null);
          setStatus('unauthenticated');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-bg">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-glass-border/[0.15] border-t-accent animate-spin" />
          <div className="absolute w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
        <p className="text-xs text-muted tracking-wide font-medium">
          Verifying session...
        </p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet context={{ customer }} />;
}
