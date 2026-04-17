import { Brain, File, GitCommit } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { RootCauseBadge } from './RootCauseBadge.jsx';
import { ConfidenceIndicator } from './ConfidenceIndicator.jsx';
import { SEVERITY_COLORS } from '../../styles/theme.js';
import { Spinner } from '../ui/Spinner.jsx';
import clsx from 'clsx';

function SkeletonInsight() {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="skeleton h-4 w-40" />
        </div>
        <div className="skeleton w-14 h-14 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </Card>
  );
}

export function AIInsightCard({ analysis, isLoading }) {
  if (isLoading) return <SkeletonInsight />;
  if (!analysis) return null;

  const riskColors = SEVERITY_COLORS[analysis.riskLevel] || SEVERITY_COLORS.medium;

  return (
    <Card className="relative overflow-hidden border-indigo-500/20">
      {/* Top glow effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-20 bg-indigo-500/5 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between mb-5 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center glow-sm">
            <Brain className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">AI Root Cause Analysis</h3>
            <div className="mt-1">
              <RootCauseBadge errorType={analysis.errorType} />
            </div>
          </div>
        </div>
        <ConfidenceIndicator confidence={analysis.confidence} />
      </div>

      {/* Risk level */}
      <div className={clsx('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4', riskColors.bg)}>
        <span className={clsx('text-xs font-bold uppercase tracking-wider', riskColors.text)}>
          {analysis.riskLevel} risk
        </span>
      </div>

      {/* Root cause */}
      <p className="text-sm font-medium text-text-primary mb-3">{analysis.rootCause}</p>

      {/* Summary */}
      {analysis.summary && (
        <blockquote className="text-sm text-text-secondary italic border-l-2 border-indigo-600 pl-4 mb-4">
          {analysis.summary}
        </blockquote>
      )}

      {/* Affected files */}
      {analysis.affectedFiles?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Affected Files</p>
          <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
            {analysis.affectedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-surface-2 rounded px-2.5 py-1 flex-shrink-0">
                <File className="w-3 h-3 text-text-muted" />
                <span className="font-mono text-xs text-text-secondary">{file}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related commit */}
      {analysis.relatedCommit && (
        <div className="flex items-center gap-2 mt-2">
          <GitCommit className="w-3.5 h-3.5 text-text-muted" />
          <span className="font-mono text-xs text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded">
            {analysis.relatedCommit.substring(0, 8)}
          </span>
          <span className="text-xs text-text-muted">likely related commit</span>
        </div>
      )}
    </Card>
  );
}

export default AIInsightCard;
