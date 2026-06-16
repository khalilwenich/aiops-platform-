import { useState, useEffect } from 'react';
import { RefreshCw, Download, Trash2, Plus, Save, X, AlertTriangle } from 'lucide-react';

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-6 mb-4">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="border-t border-[#1E2130] pt-5">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, danger }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer
        ${checked ? (danger ? 'bg-red-600' : 'bg-indigo-600') : 'bg-slate-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
        ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

const SERVICES = [
  { name: 'MongoDB',    status: 'Connected',   latency: '12ms',    jobs: null  },
  { name: 'Redis',      status: 'Connected',   latency: '3ms',     jobs: null  },
  { name: 'Groq API',   status: 'Operational', latency: '890ms',   jobs: null  },
  { name: 'GitLab',     status: 'Connected',   latency: '45ms',    jobs: null  },
  { name: 'SonarQube',  status: 'Connected',   latency: '67ms',    jobs: null  },
  { name: 'BullMQ',     status: 'Running',     latency: null,      jobs: '0 jobs' },
];

const MOCK_USERS = [
  { id: 1, name: 'Administrator', email: 'admin@aiops.local',   role: 'admin',   status: 'active',   last: 'Now' },
  { id: 2, name: 'Nour G.',       email: 'nour@aiops.local',    role: 'analyst', status: 'active',   last: '2h ago' },
  { id: 3, name: 'DevOps Bot',    email: 'bot@aiops.local',     role: 'viewer',  status: 'active',   last: '1d ago' },
  { id: 4, name: 'Staging User',  email: 'staging@aiops.local', role: 'viewer',  status: 'inactive', last: '14d ago' },
];

function InviteModal({ onClose, onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState('viewer');

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#111318] border border-[#2A2F45] rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-slate-100 font-semibold text-lg">Invite User</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com"
              className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5
                text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5
                text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="admin">Admin</option>
              <option value="analyst">Analyst</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>
        <button onClick={() => { onInvite(email, role); onClose(); }} disabled={!email}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-all">
          Send Invitation
        </button>
      </div>
    </div>
  );
}

export default function PlatformSettings({ onToast }) {
  const [users, setUsers]         = useState(MOCK_USERS);
  const [showInvite, setShowInvite] = useState(false);
  const [services, setServices]   = useState(SERVICES);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [retention, setRetention] = useState({ pipelines: 90, analyses: 90, vulns: 180 });
  const [maintenance, setMaintenance] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [savingRetention, setSavingRetention] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { return 30; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    setRefreshing(true);
    setCountdown(30);
    setTimeout(() => { setRefreshing(false); onToast('System status refreshed', 'info'); }, 1200);
  };

  const doAction = (key, msg) => {
    setLoadingAction(key);
    setTimeout(() => { setLoadingAction(null); onToast(msg, 'success'); }, 1500);
  };

  const latencyColor = (lat) => {
    if (!lat) return 'text-slate-400';
    const ms = parseInt(lat);
    if (ms < 50)  return 'text-emerald-400';
    if (ms < 200) return 'text-amber-400';
    return 'text-red-400';
  };

  const dotColor = (s) => {
    if (['Connected','Operational','Running'].includes(s)) return 'bg-emerald-500';
    return 'bg-red-500';
  };

  return (
    <div>
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvite={(email, role) => {
            setUsers(u => [...u, { id: Date.now(), name: email.split('@')[0], email, role, status: 'active', last: 'Never' }]);
            onToast(`Invitation sent to ${email}`, 'success');
          }}
        />
      )}

      {/* User Management */}
      <SectionCard title="User Management" subtitle="Manage platform users and their permissions">
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-all">
            <Plus className="w-4 h-4" /> Invite User
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-[#1E2130]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2130]">
                {['User', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-[#1E2130] last:border-0 hover:bg-[#1A1D26]/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600
                        flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-slate-200 font-medium text-xs">{u.name}</p>
                        <p className="text-slate-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={e => setUsers(us => us.map(x => x.id === u.id ? { ...x, role: e.target.value } : x))}
                      className="bg-[#1A1D26] border border-[#2A2F45] rounded px-2 py-1 text-slate-300 text-xs
                        focus:outline-none focus:border-indigo-500">
                      <option value="admin">Admin</option>
                      <option value="analyst">Analyst</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/30 text-slate-500'}`}>
                      {u.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{u.last}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onToast('User updated', 'success')}
                        className="text-slate-500 hover:text-slate-300 text-xs border border-[#2A2F45] hover:border-[#3A3F55] px-2 py-1 rounded transition-all">
                        Edit
                      </button>
                      <button onClick={() => setUsers(us => us.map(x => x.id === u.id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x))}
                        className="text-red-500/60 hover:text-red-400 text-xs border border-red-500/20 hover:border-red-500/40 px-2 py-1 rounded transition-all">
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* System Health */}
      <SectionCard title="System Health" subtitle="Real-time status of platform dependencies">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-500 text-xs">Refreshing in {countdown}s</p>
          <button onClick={refresh}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200
              border border-[#2A2F45] hover:border-[#3A3F55] rounded-lg px-3 py-1.5 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
        <div className="space-y-2">
          {services.map(s => (
            <div key={s.name} className="flex items-center justify-between py-3 border-b border-[#1E2130] last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${dotColor(s.status)} shadow-sm`} />
                <p className="text-slate-200 text-sm font-medium w-24">{s.name}</p>
                <span className="text-slate-500 text-xs">{s.status}</span>
              </div>
              <div className="flex items-center gap-3">
                {s.latency && <span className={`text-sm font-mono font-medium ${latencyColor(s.latency)}`}>{s.latency}</span>}
                {s.jobs !== null && <span className="text-slate-400 text-sm">{s.jobs}</span>}
                <span className="text-emerald-400 text-sm">✅</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Data Retention */}
      <SectionCard title="Data Retention" subtitle="Configure how long data is kept in the database">
        <div className="space-y-5 mb-5">
          {[
            { key: 'pipelines', label: 'Pipeline history', min: 30, max: 365 },
            { key: 'analyses',  label: 'Analysis data',   min: 30, max: 365 },
            { key: 'vulns',     label: 'Vulnerability history', min: 30, max: 365 },
          ].map(({ key, label, min, max }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-slate-200 text-sm font-medium">{label}</p>
                <span className="text-indigo-400 text-sm font-semibold">{retention[key]} days</span>
              </div>
              <input type="range" min={min} max={max} value={retention[key]}
                onChange={e => setRetention(r => ({ ...r, [key]: Number(e.target.value) }))}
                className="w-full accent-indigo-500" />
              <div className="flex justify-between mt-1">
                <span className="text-slate-600 text-xs">{min} days</span>
                <span className="text-slate-600 text-xs">{max} days</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300 text-sm">Data beyond the retention period will be permanently deleted.</p>
        </div>
        <button onClick={() => { setSavingRetention(true); setTimeout(() => { setSavingRetention(false); onToast('Retention policy saved', 'success'); }, 1500); }}
          disabled={savingRetention}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all">
          {savingRetention ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Retention Policy
        </button>
      </SectionCard>

      {/* Maintenance */}
      <SectionCard title="Platform Maintenance" subtitle="Administrative actions and maintenance controls">
        {maintenance && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-sm font-medium">Webhook processing is PAUSED — maintenance mode active</p>
          </div>
        )}
        <div className="space-y-0">
          {[
            {
              key: 'cache', label: 'Clear Redis Cache',
              desc: 'Flush all cached data from Redis. Jobs will continue processing.',
              btn: 'Clear Cache', msg: 'Redis cache cleared',
            },
            {
              key: 'purge', label: 'Purge Old Analyses',
              desc: 'Remove analyses older than the retention period from the database.',
              btn: 'Purge Now', msg: 'Old analyses purged',
            },
          ].map(({ key, label, desc, btn, msg }) => (
            <div key={key} className="flex items-center justify-between py-4 border-b border-[#1E2130]">
              <div>
                <p className="text-slate-200 font-medium text-sm">{label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
              </div>
              <button onClick={() => doAction(key, msg)} disabled={loadingAction === key}
                className="flex items-center gap-1.5 text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10
                  disabled:opacity-60 px-3 py-1.5 rounded-lg transition-all">
                {loadingAction === key
                  ? <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
                {btn}
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between py-4 border-b border-[#1E2130]">
            <div>
              <p className="text-slate-200 font-medium text-sm">Maintenance Mode</p>
              <p className="text-slate-500 text-xs mt-0.5">Pause webhook processing for planned maintenance</p>
            </div>
            <Toggle checked={maintenance} onChange={v => { setMaintenance(v); onToast(v ? 'Maintenance mode enabled' : 'Maintenance mode disabled', v ? 'info' : 'success'); }} danger />
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-slate-200 font-medium text-sm">Export Data</p>
              <p className="text-slate-500 text-xs mt-0.5">Download all analyses and vulnerabilities as JSON</p>
            </div>
            <button onClick={() => onToast('Export started — download will begin shortly', 'info')}
              className="flex items-center gap-1.5 text-sm text-slate-400 border border-[#2A2F45] hover:border-[#3A3F55]
                hover:text-slate-200 px-3 py-1.5 rounded-lg transition-all">
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Platform Info */}
      <SectionCard title="Platform Information" subtitle="Read-only platform metadata">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {[
            { key: 'Platform',    val: 'AIOps Platform v1.0.0' },
            { key: 'Company',     val: 'Capgemini Altran Telnet Corporation Tunisie' },
            { key: 'Environment', val: 'Development' },
            { key: 'Node.js',     val: 'v20.x LTS' },
            { key: 'Database',    val: 'MongoDB 7.x' },
            { key: 'AI Model',    val: 'llama-3.3-70b-versatile (Groq)' },
            { key: 'Uptime',      val: '2 days, 4 hours' },
            { key: 'Last Deploy', val: 'April 17, 2026' },
          ].map(({ key, val }) => (
            <div key={key} className="flex flex-col gap-0.5 py-2 border-b border-[#1E2130] last:border-0">
              <span className="text-slate-500 text-xs">{key}</span>
              <span className="text-slate-200 text-sm font-medium">{val}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
