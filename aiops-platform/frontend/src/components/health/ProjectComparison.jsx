import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

const GRADE_COLORS = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
const LINE_COLORS  = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111318] border border-[#2A2F45] rounded-lg p-3 shadow-xl">
      <p className="text-slate-100 font-semibold text-sm">{payload[0]?.payload?.projectName}</p>
      <p className="text-indigo-400 text-sm">Score: {payload[0]?.value}</p>
    </div>
  );
}

export function ProjectComparison({ projects, history }) {
  const barData = projects.map(p => ({
    projectName: p.projectName,
    score:       p.score || 0,
    grade:       p.grade || 'F',
  }));

  return (
    <div className="space-y-6">
      <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-6 hover:border-[#2A2F45] transition-all">
        <h3 className="text-lg font-semibold text-slate-100 mb-1">Project Comparison</h3>
        <p className="text-slate-500 text-sm mb-5">Health scores across all monitored projects</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="projectName" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
            <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={GRADE_COLORS[entry.grade] || '#6366f1'} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {history && history.length > 0 && (
        <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-6 hover:border-[#2A2F45] transition-all">
          <h3 className="text-lg font-semibold text-slate-100 mb-1">8-Week Trend</h3>
          <p className="text-slate-500 text-sm mb-5">Score evolution over the last 8 weeks</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history} margin={{ left: 0, right: 20 }}>
              <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111318', border: '1px solid #2A2F45', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ paddingTop: 16 }} />
              {projects.map((p, i) => (
                <Line key={p.projectName} type="monotone" dataKey={p.projectName}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2}
                  dot={{ r: 3, fill: LINE_COLORS[i % LINE_COLORS.length] }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
