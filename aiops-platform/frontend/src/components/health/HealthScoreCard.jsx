import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function CircleProgress({ score, size = 120 }) {
  const radius = 46;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color  = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const grade  = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1E2130" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-slate-100">{score}</span>
        <span className="text-sm font-semibold" style={{ color }}>{grade}</span>
      </div>
    </div>
  );
}

export function HealthScoreCard({ project }) {
  const TrendIcon = project.trend === 'up' ? TrendingUp : project.trend === 'down' ? TrendingDown : Minus;
  const trendColor = project.trend === 'up' ? 'text-emerald-400' : project.trend === 'down' ? 'text-red-400' : 'text-slate-400';
  const trendSign  = project.trendValue > 0 ? '+' : '';

  return (
    <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-6 hover:border-[#2A2F45] transition-all duration-200">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-slate-100 font-semibold text-base">{project.projectName}</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Last computed {project.computedAt ? new Date(project.computedAt).toLocaleDateString('fr-TN') : '—'}
          </p>
        </div>
        <div className={`flex items-center gap-1 ${trendColor} text-sm font-medium`}>
          <TrendIcon className="w-4 h-4" />
          {trendSign}{project.trendValue} pts
        </div>
      </div>

      <div className="flex items-center justify-center mb-5">
        <CircleProgress score={project.score || 0} />
      </div>

      <div className="space-y-2.5">
        {project.breakdown && Object.entries(project.breakdown).map(([key, val]) => {
          const labels = {
            pipelineSuccessRate: '🔄 Pipeline Rate',
            codeCoverage:        '📋 Code Coverage',
            criticalVulns:       '🛡️ Vulnerabilities',
            codeSmells:          '🔍 Code Smells',
            avgMTTR:             '⏱️ Avg MTTR',
            lastFailureAge:      '📅 Last Failure',
          };
          const score  = val?.score ?? 0;
          const barColor = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">{labels[key] || key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{val?.value || '—'}</span>
                  <span className="text-xs text-slate-600">{Math.round(score * (val?.weight || 0) / 100)}/{val?.weight || 0}</span>
                </div>
              </div>
              <div className="h-1.5 bg-[#1A1D26] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.min(100, score)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-[#1E2130] flex items-center justify-between">
        <span className="text-slate-500 text-sm">Total Score</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-100 font-bold text-xl">{project.score}</span>
          <span className={`text-sm font-semibold px-2 py-0.5 rounded
            ${project.grade === 'A' ? 'bg-emerald-500/10 text-emerald-400' :
              project.grade === 'B' ? 'bg-blue-500/10 text-blue-400' :
              project.grade === 'C' ? 'bg-amber-500/10 text-amber-400' :
              'bg-red-500/10 text-red-400'}`}>
            {project.grade}
          </span>
        </div>
      </div>
    </div>
  );
}
