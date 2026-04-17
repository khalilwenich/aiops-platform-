import { Hammer, FlaskConical, Package, ShieldAlert, HelpCircle } from 'lucide-react';
import { ERROR_TYPE_LABELS } from '../../styles/theme.js';
import clsx from 'clsx';

const ICON_MAP = {
  Hammer,
  FlaskConical,
  Package,
  ShieldAlert,
  HelpCircle,
};

export function RootCauseBadge({ errorType }) {
  const meta = ERROR_TYPE_LABELS[errorType] || ERROR_TYPE_LABELS.unknown;
  const Icon = ICON_MAP[meta.icon] || HelpCircle;

  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', meta.bg, meta.color)}>
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
}

export default RootCauseBadge;
