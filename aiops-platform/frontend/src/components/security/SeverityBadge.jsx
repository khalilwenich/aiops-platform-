import { Skull, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

const CONFIG = {
  CRITICAL: { icon: Skull, text: 'text-red-400', bg: 'bg-red-950', border: 'border-red-800' },
  HIGH: { icon: AlertTriangle, text: 'text-orange-400', bg: 'bg-orange-950', border: 'border-orange-800' },
  MEDIUM: { icon: AlertCircle, text: 'text-yellow-400', bg: 'bg-yellow-950', border: 'border-yellow-800' },
  LOW: { icon: Info, text: 'text-blue-400', bg: 'bg-blue-950', border: 'border-blue-800' },
  UNKNOWN: { icon: AlertCircle, text: 'text-slate-400', bg: 'bg-slate-900', border: 'border-slate-700' },
};

export function SeverityBadge({ severity }) {
  const cfg = CONFIG[severity?.toUpperCase()] || CONFIG.UNKNOWN;
  const Icon = cfg.icon;

  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border', cfg.text, cfg.bg, cfg.border)}>
      <Icon className="w-3 h-3" />
      {severity}
    </span>
  );
}

export default SeverityBadge;
