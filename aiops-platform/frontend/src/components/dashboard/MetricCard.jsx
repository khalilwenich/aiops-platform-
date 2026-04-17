import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../ui/Card.jsx';

const COLOR_MAP = {
  indigo: {
    iconBg: 'bg-indigo-600/20',
    iconText: 'text-indigo-400',
    accent: 'border-indigo-500/30',
  },
  red: {
    iconBg: 'bg-red-600/20',
    iconText: 'text-red-400',
    accent: 'border-red-500/30',
  },
  green: {
    iconBg: 'bg-green-600/20',
    iconText: 'text-green-400',
    accent: 'border-green-500/30',
  },
  yellow: {
    iconBg: 'bg-yellow-600/20',
    iconText: 'text-yellow-400',
    accent: 'border-yellow-500/30',
  },
};

export function MetricCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = 'indigo' }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.indigo;
  const trendPositive = trend >= 0;

  return (
    <Card hoverable className={clsx('relative overflow-hidden', colors.accent)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{title}</p>
        </div>
        {Icon && (
          <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colors.iconBg)}>
            <Icon className={clsx('w-4.5 h-4.5', colors.iconText)} size={18} />
          </div>
        )}
      </div>

      <div className="mb-3">
        <p className="text-3xl font-bold text-text-primary leading-none">{value}</p>
        {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trendPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-success" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-danger" />
          )}
          <span className={clsx('text-xs font-medium', trendPositive ? 'text-success' : 'text-danger')}>
            {Math.abs(trend)}%
          </span>
          {trendLabel && <span className="text-xs text-text-muted">{trendLabel}</span>}
        </div>
      )}

      {/* Accent bottom border */}
      <div className={clsx('absolute bottom-0 left-0 right-0 h-0.5', colors.iconBg)} />
    </Card>
  );
}

export default MetricCard;
