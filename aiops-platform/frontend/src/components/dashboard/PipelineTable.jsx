import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { GitBranch, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { STATUS_COLORS } from '../../styles/theme.js';
import clsx from 'clsx';

function StatusDot({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.canceled;
  return (
    <div className="flex items-center gap-2">
      <span
        className={clsx(
          'w-2 h-2 rounded-full flex-shrink-0',
          colors.dot,
          status === 'running' && 'animate-pulse'
        )}
      />
      <span className={clsx('text-xs font-medium capitalize', colors.text)}>{status}</span>
    </div>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function PipelineTable({ pipelines = [], pagination, onPageChange, isLoading }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 skeleton rounded-lg" />
        ))}
      </div>
    );
  }

  if (pipelines.length === 0) {
    return <EmptyState icon={GitBranch} title="No pipelines found" description="Pipeline events will appear here once the webhook is configured" />;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Status', 'Pipeline', 'Project', 'Branch', 'Triggered By', 'Duration', 'Time', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs uppercase text-text-muted tracking-widest pb-3 pr-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pipelines.map(pipeline => (
              <tr
                key={pipeline._id || pipeline.pipelineId}
                className="border-b border-border/50 hover:bg-surface-2/50 transition-colors"
              >
                <td className="py-3 pr-4"><StatusDot status={pipeline.status} /></td>
                <td className="py-3 pr-4">
                  <span
                    className="font-mono text-xs text-indigo-400 cursor-pointer hover:text-indigo-300"
                    onClick={() => navigate(`/pipelines/${pipeline.pipelineId}`)}
                  >
                    #{pipeline.pipelineId}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-xs text-text-secondary">{pipeline.projectName || pipeline.projectId}</span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5 bg-surface-2 rounded px-2 py-1 w-fit">
                    <GitBranch className="w-3 h-3 text-text-muted" />
                    <span className="font-mono text-xs text-text-secondary max-w-[120px] truncate">{pipeline.ref || 'main'}</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-xs text-text-muted">{pipeline.triggeredBy || '—'}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-xs text-text-muted font-mono">{formatDuration(pipeline.duration)}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-xs text-text-muted">
                    {pipeline.createdAt ? formatDistanceToNow(new Date(pipeline.createdAt), { addSuffix: true }) : '—'}
                  </span>
                </td>
                <td className="py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={ArrowRight}
                    onClick={() => navigate(`/pipelines/${pipeline.pipelineId}`)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-xs text-text-muted">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronRight}
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PipelineTable;
