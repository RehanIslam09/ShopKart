import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCustomer } from '../services/api';

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError(null);
  };

  const validateForm = () => {
    const { fullName, email, password, phone } = formData;
    if (!fullName.trim() || !email.trim() || !password || !phone.trim()) {
      return 'All fields are mandatory.';
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (password.length < 6) {
      return 'Password must contain at least 6 characters.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await registerCustomer(formData);
      // On success, redirect to login page
      navigate('/login', { state: { registeredEmail: formData.email } });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-12">
      <div className="rounded-3xl p-8 bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-left">
        {/* Header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-zinc-400">
            <span>ShopKart</span>
            <span>•</span>
            <span className="text-zinc-200">Lab 02</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Create an Account
          </h1>
          <p className="text-xs text-zinc-400">
            Join ShopKart to explore the product catalogue
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="john@gmail.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Password</label>
            <input
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 rounded-2xl bg-white text-zinc-950 font-medium text-sm hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98] shadow-md shadow-white/10"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-6 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
