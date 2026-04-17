import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GitBranch, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard.jsx';
import { FailureTrendChart } from '../components/dashboard/FailureTrendChart.jsx';
import { PipelineTable } from '../components/dashboard/PipelineTable.jsx';
import { TopIssuesPanel } from '../components/dashboard/TopIssuesPanel.jsx';
import { AIInsightCard } from '../components/analysis/AIInsightCard.jsx';
import { Card } from '../components/ui/Card.jsx';
import { usePipelines, usePipelineStats } from '../hooks/usePipelines.js';
import { useRecentAnalyses, useRecurringIssues } from '../hooks/useAnalysis.js';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { useDispatch, useSelector } from 'react-redux';
import { setPage } from '../store/slices/pipelineSlice.js';

export function Dashboard() {
  const dispatch = useDispatch();
  const { currentPage } = useSelector(s => s.pipelines);
  const queryClient = useQueryClient();
  const { on } = useWebSocket();

  const { data: pipelinesData, isLoading: pipelinesLoading } = usePipelines({ page: currentPage, limit: 20 });
  const { data: stats } = usePipelineStats();
  const { data: analyses, isLoading: analysesLoading } = useRecentAnalyses();
  const { data: recurring } = useRecurringIssues();

  // Real-time update on analysis:complete
  useEffect(() => {
    const unsub = on('analysis:complete', () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    });
    return unsub;
  }, [on, queryClient]);

  const latestAnalysis = analyses?.[0] || null;
  const pipelines = pipelinesData?.pipelines || [];
  const pagination = pipelinesData?.pagination;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Pipelines"
          value={stats?.totalPipelines ?? '—'}
          icon={GitBranch}
          color="indigo"
          subtitle="All time"
        />
        <MetricCard
          title="Failure Rate"
          value={stats?.failureRate !== undefined ? `${stats.failureRate}%` : '—'}
          icon={AlertTriangle}
          color="red"
          subtitle="Overall"
        />
        <MetricCard
          title="Avg MTTR"
          value={stats?.avgMTTR !== undefined ? `${stats.avgMTTR}m` : '—'}
          icon={Clock}
          color="yellow"
          subtitle="Mean time to resolve"
        />
        <MetricCard
          title="Open Vulns"
          value="—"
          icon={ShieldAlert}
          color="green"
          subtitle="Active vulnerabilities"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <FailureTrendChart data={stats?.trendsLast7Days || []} />
        </div>
        <TopIssuesPanel issues={recurring || []} />
      </div>

      {/* Latest AI insight */}
      {(latestAnalysis || analysesLoading) && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
            Latest AI Insight
          </h2>
          <AIInsightCard analysis={latestAnalysis} isLoading={analysesLoading} />
        </div>
      )}

      {/* Pipeline table */}
      <Card padding={false}>
        <div className="p-6 pb-0 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Recent Pipelines</h2>
        </div>
        <div className="p-6">
          <PipelineTable
            pipelines={pipelines}
            pagination={pagination}
            onPageChange={(p) => dispatch(setPage(p))}
            isLoading={pipelinesLoading}
          />
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
