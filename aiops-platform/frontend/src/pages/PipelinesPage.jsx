import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GitBranch, Filter, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePipelines } from '../hooks/usePipelines.js';
import { PipelineTable } from '../components/dashboard/PipelineTable.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { setPage, setStatusFilter } from '../store/slices/pipelineSlice.js';
import clsx from 'clsx';

const STATUS_FILTERS = ['all', 'failed', 'success', 'running', 'canceled'];

export function PipelinesPage() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { currentPage, statusFilter } = useSelector(s => s.pipelines);
  const [projectSearch, setProjectSearch] = useState('');

  const params = {
    page: currentPage,
    limit: 25,
    ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
    ...(projectSearch && { projectId: projectSearch }),
  };

  const { data, isLoading, isFetching } = usePipelines(params);
  const pipelines = data?.pipelines || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Pipelines</h1>
            <p className="text-xs text-text-muted">
              {pagination?.total ?? 0} pipeline{pagination?.total !== 1 ? 's' : ''} au total
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={RefreshCw}
          loading={isFetching}
          onClick={() => queryClient.invalidateQueries({ queryKey: ['pipelines'] })}
        >
          Rafraîchir
        </Button>
      </div>

      {/* Filters */}
      <Card padding={false}>
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-border">
          <Filter className="w-4 h-4 text-text-muted flex-shrink-0" />

          {/* Status tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => { dispatch(setStatusFilter(s === 'all' ? null : s)); dispatch(setPage(1)); }}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors',
                  (s === 'all' ? !statusFilter : statusFilter === s)
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-surface-2 text-text-muted border border-border hover:border-border-2'
                )}
              >
                {s === 'all' ? 'Tous' : s}
              </button>
            ))}
          </div>

          {/* Project search */}
          <input
            type="text"
            placeholder="Filtrer par projet..."
            value={projectSearch}
            onChange={e => setProjectSearch(e.target.value)}
            className="ml-auto bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary placeholder-text-muted focus:outline-none focus:border-primary transition-colors w-48"
          />
        </div>

        <div className="p-5">
          <PipelineTable
            pipelines={pipelines}
            pagination={pagination}
            onPageChange={p => dispatch(setPage(p))}
            isLoading={isLoading}
          />
        </div>
      </Card>
    </div>
  );
}

export default PipelinesPage;
