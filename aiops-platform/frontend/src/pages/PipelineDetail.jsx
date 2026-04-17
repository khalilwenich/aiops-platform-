import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronDown, ChevronRight, Bug, Wind, TestTube, GitCommit, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePipelineById, useRetriggerAnalysis } from '../hooks/usePipelines.js';
import { useAnalysisByPipeline } from '../hooks/useAnalysis.js';
import { AIInsightCard } from '../components/analysis/AIInsightCard.jsx';
import { FixSuggestionList } from '../components/analysis/FixSuggestionList.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { STATUS_COLORS } from '../styles/theme.js';
import clsx from 'clsx';

function JobAccordion({ job }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-2/80 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm font-medium text-text-primary">{job.jobName}</span>
          <span className="text-xs text-text-muted bg-surface px-2 py-0.5 rounded">{job.stage}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
      </button>
      {open && (
        <div className="p-4 bg-[#0D0F14] border-t border-border">
          <pre className="font-mono text-xs text-green-400 overflow-y-auto max-h-72 whitespace-pre-wrap break-words leading-relaxed">
            Job #{job.jobId} — {job.stage}
            {'\n'}No log data available in this view.
            {'\n'}Use the GitLab UI or API to view full logs.
          </pre>
        </div>
      )}
    </div>
  );
}

function SonarStrip({ measures }) {
  const items = [
    { label: 'Bugs', value: measures?.bugs ?? '—', icon: Bug, color: 'text-red-400' },
    { label: 'Code Smells', value: measures?.code_smells ?? '—', icon: Wind, color: 'text-yellow-400' },
    { label: 'Coverage', value: measures?.coverage !== undefined ? `${measures.coverage}%` : '—', icon: TestTube, color: 'text-green-400' },
    { label: 'Duplication', value: measures?.duplicated_lines_density !== undefined ? `${measures.duplicated_lines_density}%` : '—', icon: GitCommit, color: 'text-purple-400' },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="text-center py-4">
          <Icon className={clsx('w-5 h-5 mx-auto mb-2', color)} />
          <p className="text-xl font-bold text-text-primary">{value}</p>
          <p className="text-xs text-text-muted mt-1">{label}</p>
        </Card>
      ))}
    </div>
  );
}

export function PipelineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = usePipelineById(id);
  const { data: analysis, isLoading: analysisLoading } = useAnalysisByPipeline(id);
  const retrigger = useRetriggerAnalysis();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Pipeline not found</p>
        <Button variant="ghost" onClick={() => navigate('/pipelines')} className="mt-4">
          Back to Pipelines
        </Button>
      </div>
    );
  }

  const statusColors = STATUS_COLORS[data.status] || STATUS_COLORS.canceled;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-muted hover:text-text-secondary text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className={clsx('w-2.5 h-2.5 rounded-full', statusColors.dot)} />
            <h1 className="text-xl font-bold text-text-primary">
              Pipeline <span className="font-mono text-indigo-400">#{data.pipelineId}</span>
            </h1>
            <Badge variant={data.status === 'failed' ? 'danger' : data.status === 'success' ? 'success' : 'neutral'}>
              {data.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>{data.projectName || data.projectId}</span>
            <span>Branch: <span className="font-mono text-text-secondary">{data.ref}</span></span>
            <span>By: {data.triggeredBy}</span>
            {data.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          icon={RefreshCw}
          loading={retrigger.isPending}
          onClick={() => retrigger.mutate(id)}
        >
          Re-trigger Analysis
        </Button>
      </div>

      {/* Failed jobs */}
      {data.failedJobs?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
            Failed Jobs ({data.failedJobs.length})
          </h2>
          <div className="space-y-2">
            {data.failedJobs.map(job => (
              <JobAccordion key={job.jobId} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          AI Analysis
        </h2>
        <AIInsightCard analysis={analysis} isLoading={analysisLoading} />
        {analysis?.suggestedFixes?.length > 0 && (
          <div className="mt-4">
            <FixSuggestionList fixes={analysis.suggestedFixes} />
          </div>
        )}
      </div>

      {/* SonarQube strip */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Code Quality (SonarQube)
        </h2>
        <SonarStrip measures={{}} />
      </div>
    </div>
  );
}

export default PipelineDetail;
