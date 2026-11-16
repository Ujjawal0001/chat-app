import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className,
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-gray-300"
        >
          {label}
        </label>
      )}

      <div className="relative rounded-xl">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-light">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'w-full rounded-xl border bg-white/70 dark:bg-space-surfaceDark text-ink dark:text-white px-3.5 py-2.5 text-sm transition-all duration-150 placeholder:text-ink-light/60 focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent',
            Icon && 'pl-10',
            error
              ? 'border-coral-400 focus:ring-coral-400 text-coral-600'
              : 'border-space-borderLight dark:border-space-borderDark hover:border-lavender-300',
            className
          )}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-coral-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink-light">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
