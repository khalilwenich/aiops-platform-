import clsx from 'clsx';
import { Spinner } from './Spinner.jsx';

const VARIANTS = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm hover:shadow-glow-sm border border-indigo-500/30',
  ghost: 'bg-transparent hover:bg-surface-2 text-text-secondary hover:text-text-primary border border-border-2',
  danger: 'bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-red-300 border border-red-800',
  success: 'bg-green-900/50 hover:bg-green-900 text-green-400 hover:text-green-300 border border-green-800',
};

const SIZES = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  children,
  className,
  onClick,
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 btn-ripple',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className
      )}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : Icon ? (
        <Icon className={clsx(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      ) : null}
      {children}
    </button>
  );
}

export default Button;
