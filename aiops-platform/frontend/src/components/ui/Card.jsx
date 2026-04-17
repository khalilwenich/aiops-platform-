import clsx from 'clsx';

export function Card({ children, className, hoverable = false, glow = false, padding = true }) {
  return (
    <div
      className={clsx(
        'bg-surface border border-border rounded-xl',
        padding && 'p-6',
        hoverable && 'card-hover cursor-pointer',
        glow && 'shadow-glow border-indigo-500/30',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Card;
