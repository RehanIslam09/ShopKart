import React from 'react';

/**
 * Reusable Glassmorphism Input Field Component
 * Minimal Apple-like input with frosted glass backdrop blur, subtle borders, and smooth focus states.
 *
 * @param {Object} props
 * @param {string} [props.label] - Field label
 * @param {string} [props.error] - Validation error message
 * @param {string} [props.helperText] - Supporting helper text
 * @param {React.ReactNode} [props.leftIcon] - Icon placed inside on the left
 * @param {React.ReactNode} [props.rightIcon] - Icon or button placed inside on the right
 * @param {string} [props.className] - Additional classes for wrapper
 * @param {string} [props.inputClassName] - Additional classes for input element
 */
export default function InputField({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  inputClassName = '',
  id,
  type = 'text',
  ...props
}) {
  const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 text-left ${className}`}>
      {label && (
        <label
          htmlFor={generatedId}
          className="text-xs font-medium tracking-wide text-zinc-400 select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-zinc-400">
            {leftIcon}
          </div>
        )}

        <input
          id={generatedId}
          type={type}
          aria-invalid={!!error}
          className={`w-full rounded-2xl bg-white/[0.04] border backdrop-blur-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-200 ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${
            error
              ? 'border-rose-500/60 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10'
              : 'border-white/[0.08] focus:border-indigo-400/70 focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/10'
          } ${inputClassName}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-zinc-400">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-400 flex items-center gap-1 mt-0.5">
          <span className="inline-block w-1 h-1 rounded-full bg-rose-400" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-zinc-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
