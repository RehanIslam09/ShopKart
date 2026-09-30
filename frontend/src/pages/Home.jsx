import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMe } from '../services/api';

export default function Home({ setCustomer: setGlobalCustomer }) {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        setLoading(true);
        // Call protected GET /customers/me endpoint with HttpOnly cookie
        const data = await getMe();
        if (isMounted) {
          setCustomer(data);
          if (setGlobalCustomer) setGlobalCustomer(data);
        }
      } catch (err) {
        // If not logged in or cookie expired, redirect to /login
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
  }, [navigate, setGlobalCustomer]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-400">Verifying session...</p>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-white/[0.02] border border-white/[0.08] backdrop-blur-2xl text-left space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Protected Route Authenticated
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Welcome back, {customer.fullName}!
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl">
          You are authenticated via a secure HttpOnly cookie. Your account session is verified directly with MongoDB.
        </p>

        <div className="pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-all shadow-md active:scale-95"
          >
            <span>Browse Product Catalog</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Customer Profile Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl space-y-1">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Customer Name
          </span>
          <span className="text-sm font-medium text-zinc-100 block">
            {customer.fullName}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl space-y-1">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Email Address
          </span>
          <span className="text-sm font-medium text-zinc-100 block truncate">
            {customer.email}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl space-y-1">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Phone Number
          </span>
          <span className="text-sm font-medium text-zinc-100 block">
            {customer.phone}
          </span>
        </div>
      </div>

      {/* Quick Discovery Teaser */}
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white">
            Engineering Lab 03: Product Catalog & Discovery
          </h3>
          <p className="text-xs text-zinc-400">
            Search, filter by category, sort by price, and explore product details with live backend queries.
          </p>
        </div>
        <Link
          to="/products"
          className="shrink-0 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium border border-white/[0.1] transition-all"
        >
          Explore Catalog
        </Link>
      </div>
    </div>
  );
}
