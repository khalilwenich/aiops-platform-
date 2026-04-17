export const SEVERITY_COLORS = {
  critical: {
    bg: 'bg-red-950',
    text: 'text-red-400',
    border: 'border-red-800',
    dot: 'bg-red-500',
  },
  high: {
    bg: 'bg-orange-950',
    text: 'text-orange-400',
    border: 'border-orange-800',
    dot: 'bg-orange-500',
  },
  medium: {
    bg: 'bg-yellow-950',
    text: 'text-yellow-400',
    border: 'border-yellow-800',
    dot: 'bg-yellow-500',
  },
  low: {
    bg: 'bg-blue-950',
    text: 'text-blue-400',
    border: 'border-blue-800',
    dot: 'bg-blue-400',
  },
};

export const ERROR_TYPE_LABELS = {
  build_failure: {
    label: 'Build Failure',
    icon: 'Hammer',
    color: 'text-orange-400',
    bg: 'bg-orange-950',
  },
  test_failure: {
    label: 'Test Failure',
    icon: 'FlaskConical',
    color: 'text-yellow-400',
    bg: 'bg-yellow-950',
  },
  dependency_issue: {
    label: 'Dependency Issue',
    icon: 'Package',
    color: 'text-purple-400',
    bg: 'bg-purple-950',
  },
  security_vulnerability: {
    label: 'Security Vulnerability',
    icon: 'ShieldAlert',
    color: 'text-red-400',
    bg: 'bg-red-950',
  },
  unknown: {
    label: 'Unknown',
    icon: 'HelpCircle',
    color: 'text-slate-400',
    bg: 'bg-slate-900',
  },
};

export const RISK_LEVEL_COLORS = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
};

export const STATUS_COLORS = {
  failed: { text: 'text-red-400', dot: 'bg-red-500', bg: 'bg-red-950' },
  success: { text: 'text-green-400', dot: 'bg-green-500', bg: 'bg-green-950' },
  running: { text: 'text-indigo-400', dot: 'bg-indigo-400', bg: 'bg-indigo-950' },
  canceled: { text: 'text-slate-400', dot: 'bg-slate-500', bg: 'bg-slate-900' },
};
