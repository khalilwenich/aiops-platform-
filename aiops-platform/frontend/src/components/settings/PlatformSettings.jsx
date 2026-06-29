import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Download, Trash2, Save, AlertTriangle, Users } from 'lucide-react';
import { settingsApi } from '../../api/settings.api.js';

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

function formatUptime(seconds) {
  if (!seconds) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function PlatformSettings({ onToast }) {
  const [services, setServices] = useState([]);
  const [platformInfo, setPlatformInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [retention, setRetention] = useState({ pipelines: 90, analyses: 90, vulns: 180 });
  const [maintenance, setMaintenance] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [savingRetention, setSavingRetention] = useState(false);
  const [ready, setReady] = useState(false);

  const loadStatus = useCallback(() => {
    setRefreshing(true);
    return settingsApi.getPlatformStatus()
      .then(({ services, platformInfo }) => { setServices(services); setPlatformInfo(platformInfo); })
      .catch(() => onToast('Failed to load system status', 'error'))
      .finally(() => setRefreshing(false));
  }, [onToast]);

  useEffect(() => {
    Promise.all([
      settingsApi.getAll().then(({ settings }) => {
        setRetention(settings.platform.retention);
        setMaintenance(settings.platform.maintenance);
      }),
      loadStatus(),
    ])
      .catch(() => onToast('Failed to load platform settings', 'error'))
      .finally(() => setReady(true));
  }, [loadStatus, onToast]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { loadStatus(); return 30; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  const refresh = () => { setCountdown(30); loadStatus().then(() => onToast('System status refreshed', 'info')); };

  const saveRetention = async () => {
    setSavingRetention(true);
    try {
      await settingsApi.updateSection('platform', { retention });
      onToast('Retention policy saved', 'success');
    } catch (err) {
      onToast(err?.error || 'Failed to save retention policy', 'error');
    } finally {
      setSavingRetention(false);
    }
  };

  const toggleMaintenance = async (v) => {
    setMaintenance(v);
    try {
      await settingsApi.updateSection('platform', { maintenance: v });
      onToast(v ? 'Maintenance mode enabled' : 'Maintenance mode disabled', v ? 'info' : 'success');
    } catch (err) {
      setMaintenance(!v);
      onToast(err?.error || 'Failed to update maintenance mode', 'error');
    }
  };

  const clearCache = async () => {
    if (!window.confirm('Clear the entire Redis cache?')) return;
    setLoadingAction('cache');
    try {
      const { message } = await settingsApi.clearCache();
      onToast(message, 'success');
    } catch (err) {
      onToast(err?.error || 'Failed to clear cache', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const purgeAnalyses = async () => {
    if (!window.confirm(`Permanently delete analyses older than ${retention.analyses} days?`)) return;
    setLoadingAction('purge');
    try {
      const { message } = await settingsApi.purgeOldAnalyses();
      onToast(message, 'success');
    } catch (err) {
      onToast(err?.error || 'Failed to purge analyses', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const exportJson = async () => {
    try {
      const data = await settingsApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aiops-export.json';
      a.click();
      URL.revokeObjectURL(url);
      onToast('Export downloaded', 'success');
    } catch (err) {
      onToast(err?.error || 'Export failed', 'error');
    }
  };

  const latencyColor = (ms) => {
    if (ms == null) return 'text-slate-400';
    if (ms < 50)  return 'text-emerald-400';
    if (ms < 200) return 'text-amber-400';
    return 'text-red-400';
  };

  const dotColor = (s) => ['Connected', 'Operational', 'Running'].includes(s) ? 'bg-emerald-500' : 'bg-red-500';

  if (!ready) {
    return <div className="text-slate-500 text-sm">Loading platform settings…</div>;
  }

  return (
    <div>
      {/* User Management pointer */}
      <SectionCard title="User Management" subtitle="Manage platform users and their permissions">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Users className="w-4 h-4 text-indigo-400" />
          <p>User accounts are managed from the <span className="text-indigo-400 font-medium">Users</span> tab.</p>
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
                {s.latencyMs != null && <span className={`text-sm font-mono font-medium ${latencyColor(s.latencyMs)}`}>{s.latencyMs}ms</span>}
                {s.activeJobs != null && <span className="text-slate-400 text-sm">{s.activeJobs} jobs</span>}
                {dotColor(s.status) === 'bg-emerald-500' ? <span className="text-emerald-400 text-sm">✅</span> : <span className="text-red-400 text-sm">⚠️</span>}
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
        <button onClick={saveRetention} disabled={savingRetention}
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
            <p className="text-amber-300 text-sm font-medium">Maintenance mode is active</p>
          </div>
        )}
        <div className="space-y-0">
          <div className="flex items-center justify-between py-4 border-b border-[#1E2130]">
            <div>
              <p className="text-slate-200 font-medium text-sm">Clear Redis Cache</p>
              <p className="text-slate-500 text-xs mt-0.5">Flush all cached data from Redis. Jobs will continue processing.</p>
            </div>
            <button onClick={clearCache} disabled={loadingAction === 'cache'}
              className="flex items-center gap-1.5 text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10
                disabled:opacity-60 px-3 py-1.5 rounded-lg transition-all">
              {loadingAction === 'cache'
                ? <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
              Clear Cache
            </button>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-[#1E2130]">
            <div>
              <p className="text-slate-200 font-medium text-sm">Purge Old Analyses</p>
              <p className="text-slate-500 text-xs mt-0.5">Remove analyses older than the retention period from the database.</p>
            </div>
            <button onClick={purgeAnalyses} disabled={loadingAction === 'purge'}
              className="flex items-center gap-1.5 text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10
                disabled:opacity-60 px-3 py-1.5 rounded-lg transition-all">
              {loadingAction === 'purge'
                ? <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
              Purge Now
            </button>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-[#1E2130]">
            <div>
              <p className="text-slate-200 font-medium text-sm">Maintenance Mode</p>
              <p className="text-slate-500 text-xs mt-0.5">Flag the platform as under maintenance</p>
            </div>
            <Toggle checked={maintenance} onChange={toggleMaintenance} danger />
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-slate-200 font-medium text-sm">Export Data</p>
              <p className="text-slate-500 text-xs mt-0.5">Download the latest analyses and vulnerabilities as JSON</p>
            </div>
            <button onClick={exportJson}
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
            { key: 'Environment', val: platformInfo?.nodeEnv || '—' },
            { key: 'Node.js',     val: platformInfo?.nodeVersion || '—' },
            { key: 'Database',    val: 'MongoDB' },
            { key: 'Server Uptime', val: formatUptime(platformInfo?.uptimeSeconds) },
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
