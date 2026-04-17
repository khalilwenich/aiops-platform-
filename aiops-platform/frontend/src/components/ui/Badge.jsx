import clsx from 'clsx';

const VARIANTS = {
  success: 'bg-green-950 text-green-400 border border-green-800',
  warning: 'bg-yellow-950 text-yellow-400 border border-yellow-800',
  danger: 'bg-red-950 text-red-400 border border-red-800',
  info: 'bg-indigo-950 text-indigo-400 border border-indigo-800',
  neutral: 'bg-slate-900 text-slate-400 border border-slate-700',
  purple: 'bg-purple-950 text-purple-400 border border-purple-800',
};

const DOT_VARIANTS = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-indigo-400',
  neutral: 'bg-slate-500',
  purple: 'bg-purple-400',
};

const SIZES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function Badge({ variant = 'neutral', size = 'md', children, showDot = true, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium uppercase tracking-wide',
        VARIANTS[variant] || VARIANTS.neutral,
        SIZES[size] || SIZES.md,
        className
      )}
    >
      {showDot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', DOT_VARIANTS[variant] || DOT_VARIANTS.neutral)}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
