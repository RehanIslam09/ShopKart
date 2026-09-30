import React from 'react';

/**
 * Reusable Glassmorphism Button Component
 * Supports Apple-like tactile feedback, smooth micro-interactions, and loading states.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button label or elements
 * @param {'primary'|'secondary'|'danger'|'ghost'} [props.variant='secondary'] - Visual style
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Button size
 * @param {boolean} [props.isLoading=false] - Whether to show loading spinner
 * @param {React.ReactNode} [props.icon] - Optional icon element
 * @param {string} [props.className] - Additional classes
 * @param {boolean} [props.disabled=false] - Disabled state
 */
export default function GlassButton({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-2xl gap-2',
    lg: 'text-base px-6 py-3 rounded-2xl gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-white text-zinc-950 font-medium hover:bg-zinc-200 border border-transparent shadow-[0_4px_16px_rgba(255,255,255,0.2)]',
    secondary:
      'bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.12] backdrop-blur-md shadow-sm',
    danger:
      'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 backdrop-blur-md',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-zinc-300 hover:text-white border border-transparent',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
