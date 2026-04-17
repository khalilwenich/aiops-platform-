import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Brain, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRecentAnalyses, useRecurringIssues, useMarkResolved } from '../hooks/useAnalysis.js';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { AIInsightCard } from '../components/analysis/AIInsightCard.jsx';
import { FixSuggestionList } from '../components/analysis/FixSuggestionList.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { ERROR_TYPE_LABELS, SEVERITY_COLORS } from '../styles/theme.js';
import clsx from 'clsx';

function AnalysisRow({ analysis, onSelect, isSelected }) {
  const meta = ERROR_TYPE_LABELS[analysis.errorType] || ERROR_TYPE_LABELS.unknown;
  const riskColors = SEVERITY_COLORS[analysis.riskLevel] || SEVERITY_COLORS.medium;

  return (
    <div
      onClick={() => onSelect(analysis)}
      className={clsx(
        'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-150',
        isSelected
          ? 'border-indigo-500/50 bg-primary-glow'
          : 'border-border hover:border-border-2 hover:bg-surface-2/50'
      )}
    >
      {/* Error type icon */}
      <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', meta.bg)}>
        <span className={clsx('text-xs font-bold', meta.color)}>
          {meta.label.substring(0, 2).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-indigo-400">#{analysis.pipelineId}</span>
          <Badge variant={analysis.resolved ? 'success' : 'danger'} size="sm">
            {analysis.resolved ? 'Résolu' : 'Ouvert'}
          </Badge>
        </div>
        <p className="text-xs text-text-secondary truncate">{analysis.rootCause || 'Analyse en cours...'}</p>
      </div>

      {/* Risk + time */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={clsx('text-xs font-semibold capitalize', riskColors.text)}>
          {analysis.riskLevel}
        </span>
        <span className="text-xs text-text-muted">
          {analysis.createdAt
            ? formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })
            : '—'}
        </span>
      </div>
    </div>
  );
}

function StatsStrip({ analyses }) {
  const total = analyses.length;
  const open = analyses.filter(a => !a.resolved).length;
  const resolved = analyses.filter(a => a.resolved).length;
  const avgConfidence = total > 0
    ? Math.round(analyses.reduce((s, a) => s + (a.confidence || 0), 0) / total * 100)
    : 0;

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { icon: Brain, label: 'Total analyses', value: total, color: 'text-indigo-400', bg: 'bg-indigo-600/20' },
        { icon: AlertTriangle, label: 'Ouvertes', value: open, color: 'text-red-400', bg: 'bg-red-600/20' },
        { icon: CheckCircle, label: 'Résolues', value: resolved, color: 'text-green-400', bg: 'bg-green-600/20' },
        { icon: TrendingUp, label: 'Confiance moy.', value: `${avgConfidence}%`, color: 'text-yellow-400', bg: 'bg-yellow-600/20' },
      ].map(({ icon: Icon, label, value, color, bg }) => (
        <Card key={label} className="flex items-center gap-3 py-3">
          <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', bg)}>
            <Icon className={clsx('w-4 h-4', color)} />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AnalysisPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { on } = useWebSocket();
  const { data: analyses = [], isLoading } = useRecentAnalyses();
  const { data: recurring = [] } = useRecurringIssues();
  const markResolved = useMarkResolved();
  const [selected, setSelected] = useState(null);

  // Auto-select first analysis
  useEffect(() => {
    if (analyses.length > 0 && !selected) {
      setSelected(analyses[0]);
    }
  }, [analyses]);

  // Real-time update
  useEffect(() => {
    return on('analysis:complete', (data) => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      if (data?.analysis) setSelected(data.analysis);
    });
  }, [on, queryClient]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
          <Brain className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">AI Analysis</h1>
          <p className="text-xs text-text-muted">Analyses root cause par Groq — llama-3.3-70b-versatile</p>
        </div>
      </div>

      {/* Stats strip */}
      <StatsStrip analyses={analyses} />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : analyses.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="Aucune analyse disponible"
          description="Les analyses apparaîtront ici après le premier pipeline GitLab échoué."
          action={{ label: 'Voir les pipelines', onClick: () => navigate('/pipelines') }}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Left — analysis list */}
          <div className="xl:col-span-1 space-y-2">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Analyses récentes ({analyses.length})
            </h2>
            {analyses.map(a => (
              <AnalysisRow
                key={a._id}
                analysis={a}
                onSelect={setSelected}
                isSelected={selected?._id === a._id}
              />
            ))}
          </div>

          {/* Right — detail */}
          <div className="xl:col-span-2 space-y-4">
            {selected ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Détail — Pipeline #{selected.pipelineId}
                  </h2>
                  {!selected.resolved && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={CheckCircle}
                      loading={markResolved.isPending}
                      onClick={() =>
                        markResolved.mutate(selected._id, {
                          onSuccess: (updated) => setSelected(updated),
                        })
                      }
                    >
                      Marquer résolu
                    </Button>
                  )}
                </div>

                <AIInsightCard analysis={selected} />

                {selected.suggestedFixes?.length > 0 && (
                  <FixSuggestionList fixes={selected.suggestedFixes} />
                )}

                {/* Recurring issues sidebar */}
                {recurring.length > 0 && (
                  <Card>
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Issues récurrentes
                    </h3>
                    <div className="space-y-2">
                      {recurring.map((issue, i) => {
                        const meta = ERROR_TYPE_LABELS[issue.errorType] || ERROR_TYPE_LABELS.unknown;
                        return (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <span className={clsx('text-xs font-medium', meta.color)}>{meta.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 bg-surface-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${Math.min(100, issue.count * 20)}%` }}
                                />
                              </div>
                              <span className="text-xs text-text-muted w-6 text-right">{issue.count}x</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <EmptyState icon={Brain} title="Sélectionner une analyse" description="Clique sur une analyse à gauche pour voir les détails" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalysisPage;
