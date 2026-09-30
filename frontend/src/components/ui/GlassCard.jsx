import React from 'react';

/**
 * Reusable Glassmorphism Card Component
 * Follows Apple-like minimal aesthetics with translucent blur and subtle borders.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className] - Extra Tailwind classes
 * @param {boolean} [props.hoverable=false] - Whether to apply hover lift/glow
 * @param {'default'|'elevated'|'subtle'} [props.variant='default'] - Card depth variant
 */
export default function GlassCard({
  children,
  className = '',
  hoverable = false,
  variant = 'default',
  ...props
}) {
  const variantStyles = {
    default: 'bg-white/[0.04] border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]',
    elevated: 'bg-white/[0.07] border-white/[0.14] shadow-[0_16px_40px_0_rgba(0,0,0,0.35)]',
    subtle: 'bg-white/[0.02] border-white/[0.05] shadow-[0_4px_16px_0_rgba(0,0,0,0.15)]',
  };

  const hoverStyles = hoverable
    ? 'hover:bg-white/[0.07] hover:border-white/[0.16] hover:translate-y-[-2px] transition-all duration-300'
    : '';

  return (
    <div
      className={`rounded-3xl border backdrop-blur-2xl text-zinc-100 ${variantStyles[variant] || variantStyles.default} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
