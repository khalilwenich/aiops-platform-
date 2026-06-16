import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import { WeeklyReportCard } from '../components/report/WeeklyReportCard.jsx';
import { TeamMetrics } from '../components/report/TeamMetrics.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { reportApi } from '../api/report.api.js';

const TYPE_LABELS = {
  build_failure: 'Build Failures', test_failure: 'Test Failures',
  dependency_issue: 'Dependency Issues', configuration_error: 'Config Errors',
  security_vulnerability: 'Security Issues', unknown: 'Unknown',
};

const GRADE_COLORS = { A: 'text-emerald-400 bg-emerald-500/10', B: 'text-blue-400 bg-blue-500/10', C: 'text-amber-400 bg-amber-500/10', D: 'text-orange-400 bg-orange-500/10', F: 'text-red-400 bg-red-500/10' };

export default function WeeklyReport() {
  const [weekIdx, setWeekIdx] = useState(0);

  const { data: weeks = [] } = useQuery({
    queryKey: ['reports', 'weeks'],
    queryFn: () => reportApi.listAll(),
    staleTime: 60_000,
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['reports', weekIdx],
    queryFn: () => reportApi.getByWeek(weekIdx),
    staleTime: 30_000,
  });

  if (isLoading || !report) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Weekly Manager Report</h1>
            <p className="text-slate-400 text-sm mt-0.5">Capgemini Altran Telnet Corporation Tunisie</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-2 py-1.5">
            <button onClick={() => setWeekIdx(i => Math.min(weeks.length - 1, i + 1))}
              disabled={weekIdx >= weeks.length - 1}
              className="text-slate-400 hover:text-slate-200 disabled:opacity-30 p-1">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-300 text-sm px-2 min-w-40 text-center">{report.weekLabel}</span>
            <button onClick={() => setWeekIdx(i => Math.max(0, i - 1))}
              disabled={weekIdx === 0}
              className="text-slate-400 hover:text-slate-200 disabled:opacity-30 p-1">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center gap-2 border border-[#2A2F45] hover:border-[#3A3F55]
            text-slate-400 hover:text-slate-200 text-sm px-4 py-2 rounded-lg transition-all">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Executive summary */}
      <WeeklyReportCard report={report} />

      {/* Top issues */}
      <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-6 hover:border-[#2A2F45] transition-all">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">Top Recurring Issues This Week</h2>
        <p className="text-slate-500 text-sm mb-5">Most frequent pipeline failure causes</p>
        {report.topIssues.length === 0 ? (
          <p className="text-slate-500 text-sm">No pipeline failures recorded this week.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {report.topIssues.map((issue, i) => (
              <div key={i} className="bg-[#1A1D26] rounded-xl p-4 border border-[#2A2F45]">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-4xl font-bold ${i === 0 ? 'text-red-400' : i === 1 ? 'text-amber-400' : 'text-slate-500'}`}>
                    #{i + 1}
                  </span>
                  <span className="text-xs bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                    {TYPE_LABELS[issue.type] || issue.type}
                  </span>
                </div>
                <p className="text-slate-100 text-2xl font-bold">{issue.count}</p>
                <p className="text-slate-500 text-xs mt-0.5">occurrences</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project scores table */}
      <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-6 hover:border-[#2A2F45] transition-all">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">Project Health Overview</h2>
        <p className="text-slate-500 text-sm mb-5">Consolidated health metrics per project</p>
        {report.projectScores.length === 0 ? (
          <p className="text-slate-500 text-sm">No health scores computed yet. Visit the Health Score page to compute them.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2130]">
                {['Project', 'Score', 'Grade', 'Trend', 'Status'].map(h => (
                  <th key={h} className="text-left pb-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.projectScores.map(p => (
                <tr key={p.projectId} className="border-b border-[#1E2130] last:border-0">
                  <td className="py-3 text-slate-200 font-medium">{p.projectName}</td>
                  <td className="py-3">
                    <span className="text-slate-100 font-bold">{p.score}</span>
                    <span className="text-slate-500 text-xs">/100</span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${GRADE_COLORS[p.grade] || 'text-slate-400 bg-slate-500/10'}`}>
                      {p.grade}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-sm font-medium ${p.trendValue > 0 ? 'text-emerald-400' : p.trendValue < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {p.trendValue > 0 ? '↗' : p.trendValue < 0 ? '↘' : '→'} {p.trendValue > 0 ? '+' : ''}{p.trendValue} pts
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${p.score >= 75 ? 'bg-emerald-500/10 text-emerald-400' : p.score >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                      {p.score >= 75 ? 'Healthy' : p.score >= 50 ? 'Warning' : 'Critical'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Team metrics */}
      <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-6 hover:border-[#2A2F45] transition-all">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">Team Activity</h2>
        <p className="text-slate-500 text-sm mb-5">Developer impact and project stability</p>
        <TeamMetrics report={report} />
      </div>

      {/* Week tabs */}
      <div className="flex gap-2 flex-wrap">
        {weeks.map((w, i) => (
          <button key={w.weekOffset} onClick={() => setWeekIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
              ${weekIdx === i
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                : 'border-[#2A2F45] text-slate-500 hover:text-slate-300 hover:border-[#3A3F55]'}`}>
            {w.label}
          </button>
        ))}
      </div>
    </div>
  );
}
