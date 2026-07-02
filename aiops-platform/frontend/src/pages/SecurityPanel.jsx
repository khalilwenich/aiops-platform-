import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, AlertTriangle, AlertCircle, Info, Skull } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiClient } from '../api/client.js';
import { VulnerabilityTable } from '../components/security/VulnerabilityTable.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';

const SEVERITY_META = {
  CRITICAL: { icon: Skull, color: 'text-red-400', bg: 'bg-red-950', bar: '#DC2626' },
  HIGH: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-950', bar: '#EA580C' },
  MEDIUM: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-950', bar: '#CA8A04' },
  LOW: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-950', bar: '#2563EB' },
};

function SeverityStat({ severity, count }) {
  const meta = SEVERITY_META[severity] || SEVERITY_META.LOW;
  const Icon = meta.icon;
  return (
    <Card className={`flex items-center gap-4 ${meta.bg} border-0`}>
      <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center">
        <Icon className={`w-5 h-5 ${meta.color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{count}</p>
        <p className={`text-xs font-medium ${meta.color}`}>{severity}</p>
      </div>
    </Card>
  );
}

export function SecurityPanel() {
  const queryClient = useQueryClient();
  const { data: vulns = [], isLoading } = useQuery({
    queryKey: ['vulnerabilities'],
    queryFn: () => apiClient.get('/api/vulnerabilities'),
    staleTime: 60_000,
  });

  const vulnList = Array.isArray(vulns) ? vulns : (vulns?.vulnerabilities || []);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });

  const ignoreMutation = useMutation({
    mutationFn: (id) => apiClient.patch(`/api/vulnerabilities/${id}/ignore`),
    onSuccess: invalidate,
  });

  const acceptMutation = useMutation({
    mutationFn: ({ id, justification }) => apiClient.patch(`/api/vulnerabilities/${id}/accept`, { justification }),
    onSuccess: invalidate,
  });

  const reopenMutation = useMutation({
    mutationFn: (id) => apiClient.patch(`/api/vulnerabilities/${id}/reopen`),
    onSuccess: invalidate,
  });

  const counts = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].reduce((acc, sev) => {
    acc[sev] = vulnList.filter(v => v.severity?.toUpperCase() === sev).length;
    return acc;
  }, {});

  // Top affected packages for bar chart
  const pkgCounts = vulnList.reduce((acc, v) => {
    if (v.packageName) acc[v.packageName] = (acc[v.packageName] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(pkgCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Object.entries(counts).map(([sev, count]) => (
          <SeverityStat key={sev} severity={sev} count={count} />
        ))}
      </div>

      {/* Vulnerability table */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <Shield className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-text-primary">Vulnerabilities ({vulnList.length})</h2>
        </div>
        <VulnerabilityTable
          vulnerabilities={vulnList}
          onIgnore={(id) => ignoreMutation.mutate(id)}
          onAccept={(id, justification) => acceptMutation.mutate({ id, justification })}
          onReopen={(id) => reopenMutation.mutate(id)}
        />
      </Card>

      {/* Top affected packages */}
      {chartData.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-text-primary mb-4">Top Affected Packages</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A1D26', border: '1px solid #2A2F45', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#F1F5F9' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#DC2626' : i < 3 ? '#EA580C' : '#6366F1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

export default SecurityPanel;
