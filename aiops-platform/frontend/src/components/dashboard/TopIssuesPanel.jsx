import { Card } from '../ui/Card.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ERROR_TYPE_LABELS } from '../../styles/theme.js';
import { AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export function TopIssuesPanel({ issues = [] }) {
  const maxCount = Math.max(...issues.map(i => i.count), 1);

  return (
    <Card className="h-full">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Top Recurring Issues</h3>
      {issues.length === 0 ? (
        <EmptyState icon={AlertCircle} title="No issues yet" description="Recurring issues will appear here after analysis" />
      ) : (
        <div className="space-y-3">
          {issues.map((issue, idx) => {
            const meta = ERROR_TYPE_LABELS[issue.errorType] || ERROR_TYPE_LABELS.unknown;
            const pct = Math.round((issue.count / maxCount) * 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={clsx('text-xs font-medium', meta.color)}>{meta.label}</span>
                  <span className="text-xs text-text-muted">{issue.count}x</span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all duration-500', meta.color.replace('text-', 'bg-').replace('-400', '-500'))}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default TopIssuesPanel;
