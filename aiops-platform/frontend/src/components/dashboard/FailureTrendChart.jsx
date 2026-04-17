import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card } from '../ui/Card.jsx';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-border-2 rounded-lg p-3 text-xs shadow-lg">
      <p className="text-text-muted mb-2">{label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-text-secondary capitalize">{entry.name}:</span>
          <span className="text-text-primary font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div className="flex items-center gap-4 justify-end text-xs mb-1">
    {payload?.map(entry => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: entry.color }} />
        <span className="text-text-muted capitalize">{entry.value}</span>
      </div>
    ))}
  </div>
);

export function FailureTrendChart({ data = [] }) {
  const formatted = data.map(d => ({
    ...d,
    date: d._id ? (() => { try { return format(parseISO(d._id), 'dd/MM'); } catch { return d._id; } })() : d.date,
  }));

  return (
    <Card className="h-full">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Pipeline Trend (7 days)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2130" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#475569', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#colorTotal)"
            name="total"
          />
          <Area
            type="monotone"
            dataKey="failed"
            stroke="#EF4444"
            strokeWidth={2}
            fill="url(#colorFailed)"
            name="failed"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default FailureTrendChart;
