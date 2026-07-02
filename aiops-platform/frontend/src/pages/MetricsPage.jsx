import { useQuery } from '@tanstack/react-query';
import { BarChart2, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts';
import { pipelinesApi } from '../api/pipelines.api.js';
import { Spinner } from '../components/ui/Spinner.jsx';
import { Card } from '../components/ui/Card.jsx';

function KPICard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-600/10 text-indigo-400',
    emerald: 'bg-emerald-600/10 text-emerald-400',
    red:     'bg-red-600/10 text-red-400',
    amber:   'bg-amber-600/10 text-amber-400',
  };
  return (
    <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-100">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

const CHART_STYLE = {
  contentStyle: { backgroundColor: '#1A1D26', border: '1px solid #2A2F45', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#F1F5F9' },
};

export function MetricsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['pipelines', 'metrics'],
    queryFn: pipelinesApi.getMetrics,
    staleTime: 60_000,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  const m = data || {};
  const overall = m.overall || {};
  const incidents = m.incidents || {};
  const byProject = (m.byProject || []).map(p => ({
    ...p,
    successRate: +p.successRate.toFixed(1),
  }));
  const trends = (m.trends || []).map(t => ({
    date: t._id?.slice(5),
    total: t.total,
    failed: t.failed,
    success: t.total - t.failed,
  }));
  const topErrors = (m.topErrors || []).filter(e => e._id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Métriques — 30 derniers jours</h1>
          <p className="text-slate-500 text-sm">MTTR, taux de succès et tendances des erreurs</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard icon={TrendingUp}    label="Taux de succès"         value={`${overall.successRate ?? 0}%`}  sub={`${overall.total ?? 0} builds`}            color="emerald" />
        <KPICard icon={XCircle}       label="Builds échoués"         value={overall.failed ?? 0}              sub="sur 30 jours"                               color="red" />
        <KPICard icon={Clock}         label="MTTR incidents"         value={`${incidents.avgMTTR ?? 0} min`}  sub="Temps moyen de résolution"                  color="amber" />
        <KPICard icon={CheckCircle}   label="Incidents résolus"      value={incidents.resolved ?? 0}          sub={`sur ${incidents.total ?? 0} total`}        color="indigo" />
      </div>

      {/* Trend chart */}
      {trends.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100">Builds par jour</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2130" />
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_STYLE} />
              <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={2} dot={false} name="Succès" />
              <Line type="monotone" dataKey="failed"  stroke="#EF4444" strokeWidth={2} dot={false} name="Échecs" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Success rate by project */}
        {byProject.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-100">Taux de succès par projet</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byProject} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                <YAxis dataKey="projectName" type="category" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                <Tooltip {...CHART_STYLE} formatter={(v) => [`${v}%`, 'Taux de succès']} />
                <Bar dataKey="successRate" radius={[0, 4, 4, 0]}>
                  {byProject.map((p, i) => (
                    <Cell key={i} fill={p.successRate >= 90 ? '#10B981' : p.successRate >= 70 ? '#F59E0B' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Top error types */}
        {topErrors.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-100">Types d'erreurs fréquents</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topErrors} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="_id" type="category" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                <Tooltip {...CHART_STYLE} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topErrors.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#EF4444' : i < 3 ? '#F59E0B' : '#6366F1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Project breakdown table */}
      {byProject.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-100 mb-4">Détail par projet</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2130]">
                {['Projet', 'Total builds', 'Échecs', 'Taux de succès'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byProject.map(p => (
                <tr key={p.projectId} className="border-b border-[#1E2130] last:border-0 hover:bg-[#1A1D26]/30 transition-colors">
                  <td className="px-4 py-3 text-slate-300 font-medium text-xs">{p.projectName || p.projectId}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{p.total}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={p.failed > 0 ? 'text-red-400 font-medium' : 'text-emerald-400'}>{p.failed}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`font-medium ${p.successRate >= 90 ? 'text-emerald-400' : p.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                      {p.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export default MetricsPage;
