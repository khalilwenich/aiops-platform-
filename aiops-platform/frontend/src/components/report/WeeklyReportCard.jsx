import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';

export function WeeklyReportCard({ report }) {
  if (!report) return null;
  const { summary } = report;

  const stats = [
    { icon: CheckCircle, label: 'Total Pipelines',    value: summary.totalPipelines,    color: 'text-slate-100',    bg: 'bg-slate-500/10' },
    { icon: AlertTriangle, label: 'Failed Pipelines', value: `${summary.failedCount} (${summary.failureRate}%)`, color: 'text-red-400', bg: 'bg-red-500/10' },
    { icon: Clock,        label: 'Avg MTTR',           value: `${summary.avgMTTR} min`,  color: 'text-amber-400',    bg: 'bg-amber-500/10' },
    { icon: Shield,       label: 'Critical CVEs',      value: summary.criticalVulns,     color: 'text-red-400',      bg: 'bg-red-500/10' },
    { icon: CheckCircle,  label: 'Resolved Incidents', value: summary.resolvedIncidents, color: 'text-emerald-400',  bg: 'bg-emerald-500/10' },
    { icon: TrendingUp,   label: 'Best Project',       value: report.mostStableProject?.projectName || '—', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map(({ icon: Icon, label, value, color, bg }) => (
        <div key={label} className="bg-[#111318] border border-[#1E2130] rounded-xl p-4 hover:border-[#2A2F45] transition-all flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-500 text-xs">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
