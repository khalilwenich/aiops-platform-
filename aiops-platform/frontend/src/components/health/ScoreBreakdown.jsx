export function ScoreBreakdown({ breakdown }) {
  const items = [
    { key: 'pipelineSuccessRate', label: 'Pipeline Success Rate', icon: '🔄' },
    { key: 'codeCoverage',        label: 'Code Coverage',         icon: '📋' },
    { key: 'criticalVulns',       label: 'Vulnerabilities',       icon: '🛡️' },
    { key: 'codeSmells',          label: 'Code Smells',           icon: '🔍' },
    { key: 'avgMTTR',             label: 'Avg MTTR',              icon: '⏱️' },
    { key: 'lastFailureAge',      label: 'Last Failure Age',      icon: '📅' },
  ];

  return (
    <div className="space-y-3">
      {items.map(({ key, label, icon }) => {
        const val = breakdown?.[key];
        const score = val?.score ?? 0;
        const barColor = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';

        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-base w-6">{icon}</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-500">{val?.value || 'N/A'}</span>
              </div>
              <div className="h-1.5 bg-[#1A1D26] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, score)}%` }} />
              </div>
            </div>
            <span className="text-xs text-slate-600 w-12 text-right">
              {Math.round(score * (val?.weight || 0) / 100)}/{val?.weight || 0}
            </span>
          </div>
        );
      })}
    </div>
  );
}
