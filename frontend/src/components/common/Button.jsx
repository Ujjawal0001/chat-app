import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl';

  const variants = {
    primary: 'bg-lavender-600 hover:bg-lavender-700 text-white shadow-soft hover:shadow-medium focus:ring-lavender-400 active:scale-[0.98]',
    secondary: 'bg-space-cardLight dark:bg-space-cardDark text-ink dark:text-gray-100 hover:bg-space-borderLight dark:hover:bg-space-borderDark focus:ring-gray-300',
    outline: 'border border-space-borderLight dark:border-space-borderDark text-ink dark:text-gray-200 hover:bg-space-cardLight dark:hover:bg-space-surfaceDark focus:ring-lavender-400',
    ghost: 'text-ink-muted hover:text-ink dark:hover:text-white hover:bg-space-cardLight dark:hover:bg-space-cardDark',
    danger: 'bg-coral-500 hover:bg-coral-600 text-white shadow-soft focus:ring-coral-400 active:scale-[0.98]',
    coral: 'bg-coral-400 hover:bg-coral-500 text-white shadow-soft active:scale-[0.98]'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5'
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
