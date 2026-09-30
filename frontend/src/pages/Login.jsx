import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginCustomer, getMe } from '../services/api';

export default function Login({ setCustomer }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. Call login API (stores HttpOnly cookie automatically)
      await loginCustomer({ email, password });

      // 2. Fetch authenticated customer details
      try {
        const me = await getMe();
        if (setCustomer) setCustomer(me);
      } catch {
        // Fallback if /me takes a moment
      }

      // 3. Navigate to protected Home page
      navigate('/home');
    } catch {
      // Lab 01 & 02 constraint: Never reveal whether email or password was wrong
      setError('Invalid Credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-16">
      <div className="rounded-3xl p-8 bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-left">
        {/* Header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-zinc-400">
            <span>ShopKart</span>
            <span>•</span>
            <span className="text-zinc-200">Customer Login</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="text-xs text-zinc-400">
            Sign in to access your customer dashboard
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Email Address</label>
            <input
              type="email"
              placeholder="john@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 rounded-2xl bg-white text-zinc-950 font-medium text-sm hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98] shadow-md shadow-white/10"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-6 text-center text-xs text-zinc-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
