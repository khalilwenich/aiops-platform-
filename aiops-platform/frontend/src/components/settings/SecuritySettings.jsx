import { useState, useEffect, useCallback } from 'react';
import { Monitor, Smartphone, Copy, Trash2, Plus, X, Save } from 'lucide-react';

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

function Toggle({ checked, onChange, disabled }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0
        ${checked ? 'bg-indigo-600' : 'bg-slate-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
        ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

const SESSIONS = [
  { id: 1, device: 'Windows 11 — Chrome',    icon: Monitor,    ip: '192.168.1.23', location: 'Tunis, TN',    last: 'Now',         current: true },
  { id: 2, device: 'iPhone 15 — Safari',     icon: Smartphone, ip: '192.168.1.45', location: 'Tunis, TN',    last: '2 hours ago', current: false },
  { id: 3, device: 'Ubuntu — Firefox',       icon: Monitor,    ip: '10.0.2.15',    location: 'Vagrant VM',   last: '1 day ago',   current: false },
];

const MOCK_TOKENS = [
  { id: 1, name: 'CI/CD Token',    scopes: ['read', 'webhook'], created: 'Apr 17, 2026', expires: 'Apr 17, 2027' },
  { id: 2, name: 'Dashboard Token', scopes: ['read'],           created: 'Apr 20, 2026', expires: 'Never' },
];

const LOGIN_HISTORY = [
  { date: 'Apr 27, 2026 09:14', ip: '192.168.1.23', location: 'Tunis, TN',  status: 'success', device: 'Chrome / Windows' },
  { date: 'Apr 26, 2026 21:03', ip: '192.168.1.23', location: 'Tunis, TN',  status: 'success', device: 'Chrome / Windows' },
  { date: 'Apr 25, 2026 18:47', ip: '10.0.2.15',    location: 'Vagrant VM', status: 'failed',  device: 'Firefox / Ubuntu' },
  { date: 'Apr 24, 2026 14:22', ip: '192.168.1.23', location: 'Tunis, TN',  status: 'success', device: 'Chrome / Windows' },
  { date: 'Apr 23, 2026 10:05', ip: '192.168.1.45', location: 'Tunis, TN',  status: 'success', device: 'Safari / iPhone' },
];

function GenerateTokenModal({ onClose, onGenerate }) {
  const [name, setName]       = useState('');
  const [expires, setExpires] = useState('1 year');
  const [scopes, setScopes]   = useState({ read: true, write: false, webhook: false, admin: false });
  const [generated, setGenerated] = useState(null);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const generate = () => {
    const token = 'aio_' + Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
    setGenerated(token);
    onGenerate({ name, expires, scopes });
  };

  const copy = () => {
    navigator.clipboard.writeText(generated).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#111318] border border-[#2A2F45] rounded-2xl p-6 w-96 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-slate-100 font-semibold text-lg">Generate API Token</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
        </div>

        {!generated ? (
          <>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Token Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="My CI Token"
                  className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5
                    text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Expiration</label>
                <select value={expires} onChange={e => setExpires(e.target.value)}
                  className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5
                    text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  {['30 days', '90 days', '1 year', 'Never'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Scopes</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(scopes).map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={scopes[s]} onChange={e => setScopes(p => ({ ...p, [s]: e.target.checked }))}
                        className="accent-indigo-500" />
                      <span className="text-slate-300 text-sm capitalize">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={generate} disabled={!name}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-all">
              Generate Token
            </button>
          </>
        ) : (
          <>
            <p className="text-slate-200 text-sm mb-3">Your new API token:</p>
            <div className="bg-[#1A1D26] border border-[#2A2F45] rounded-lg p-3 font-mono text-xs text-indigo-300 break-all mb-2">
              {generated}
            </div>
            <button onClick={copy}
              className="w-full flex items-center justify-center gap-2 border border-[#2A2F45] hover:border-[#3A3F55]
                text-slate-300 text-sm py-2 rounded-lg transition-all mb-3">
              <Copy className="w-3.5 h-3.5" />{copied ? 'Copied!' : 'Copy Token'}
            </button>
            <p className="text-amber-400 text-xs text-center">⚠️ Copy this token now. It won't be shown again.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SecuritySettings({ onToast }) {
  const [sessions, setSessions]         = useState(SESSIONS);
  const [tokens, setTokens]             = useState(MOCK_TOKENS);
  const [showModal, setShowModal]       = useState(false);
  const [security, setSecurity]         = useState({ timeout: true, loginNotif: true, webhookSig: true });
  const [timeoutDur, setTimeoutDur]     = useState('30 min');
  const [webhookTooltip, setWebhookTooltip] = useState(false);

  const revoke = id => setSessions(s => s.filter(x => x.id !== id));
  const deleteToken = id => setTokens(t => t.filter(x => x.id !== id));

  return (
    <div>
      {showModal && (
        <GenerateTokenModal
          onClose={() => setShowModal(false)}
          onGenerate={() => { setShowModal(false); onToast('Token generated — copy it now!', 'info'); }}
        />
      )}

      {/* Active Sessions */}
      <SectionCard title="Active Sessions" subtitle="Devices currently logged in to your account">
        <div className="space-y-3 mb-4">
          {sessions.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center justify-between py-3 border-b border-[#1E2130] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#1A1D26] rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-slate-200 text-sm font-medium">{s.device}</p>
                      {s.current && <span className="bg-indigo-600/20 text-indigo-400 text-xs px-1.5 py-0.5 rounded">This session</span>}
                    </div>
                    <p className="text-slate-500 text-xs">{s.ip} · {s.location} · {s.last}</p>
                  </div>
                </div>
                <button onClick={() => !s.current && revoke(s.id)} disabled={s.current}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                    ${s.current
                      ? 'opacity-30 cursor-not-allowed border-[#2A2F45] text-slate-500'
                      : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}>
                  Revoke
                </button>
              </div>
            );
          })}
        </div>
        <button onClick={() => { setSessions([SESSIONS[0]]); onToast('All other sessions revoked', 'success'); }}
          className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm py-2 rounded-lg transition-all">
          Revoke all other sessions
        </button>
      </SectionCard>

      {/* API Tokens */}
      <SectionCard title="API Tokens" subtitle="Manage programmatic access to the platform">
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-all">
            <Plus className="w-4 h-4" /> Generate New Token
          </button>
        </div>
        <div className="space-y-3">
          {tokens.map(t => (
            <div key={t.id} className="flex items-center justify-between py-3 border-b border-[#1E2130] last:border-0">
              <div>
                <p className="text-slate-200 text-sm font-medium">{t.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {t.scopes.map(s => (
                    <span key={s} className="bg-slate-700/40 text-slate-400 text-xs px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                  <span className="text-slate-600 text-xs">Created {t.created} · Expires {t.expires}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onToast('Token copied to clipboard', 'success')}
                  className="text-slate-500 hover:text-slate-300 transition-colors"><Copy className="w-4 h-4" /></button>
                <button onClick={() => deleteToken(t.id)}
                  className="text-red-500/60 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Login History */}
      <SectionCard title="Login History" subtitle="Recent authentication attempts">
        <div className="overflow-hidden rounded-lg border border-[#1E2130]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2130]">
                {['Date', 'IP Address', 'Location', 'Status', 'Device'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LOGIN_HISTORY.map((row, i) => (
                <tr key={i} className={`border-b border-[#1E2130] last:border-0 ${row.status === 'failed' ? 'bg-red-500/5' : ''}`}>
                  <td className="px-4 py-3 text-slate-400 text-xs">{row.date}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs font-mono">{row.ip}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{row.location}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${row.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {row.status === 'success' ? '✅ Success' : '❌ Failed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{row.device}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Security Options */}
      <SectionCard title="Security Options" subtitle="Configure authentication and security policies">
        <div>
          <div className="flex justify-between items-start py-4 border-b border-[#1E2130]">
            <div>
              <p className="text-slate-200 font-medium text-sm">Session Timeout</p>
              <p className="text-slate-500 text-xs mt-0.5">Automatically log out after inactivity</p>
            </div>
            <div className="flex items-center gap-3">
              {security.timeout && (
                <select value={timeoutDur} onChange={e => setTimeoutDur(e.target.value)}
                  className="bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-3 py-1.5 text-slate-300 text-sm
                    focus:outline-none focus:border-indigo-500">
                  {['15 min', '30 min', '1 hour', '4 hours'].map(o => <option key={o}>{o}</option>)}
                </select>
              )}
              <Toggle checked={security.timeout} onChange={v => setSecurity(s => ({ ...s, timeout: v }))} />
            </div>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-[#1E2130]">
            <div>
              <p className="text-slate-200 font-medium text-sm">Login Notifications</p>
              <p className="text-slate-500 text-xs mt-0.5">Alert when a new login occurs</p>
            </div>
            <Toggle checked={security.loginNotif} onChange={v => setSecurity(s => ({ ...s, loginNotif: v }))} />
          </div>

          <div className="relative flex justify-between items-center py-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-slate-200 font-medium text-sm">Webhook Signature Verification</p>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded">Recommended</span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">Validate HMAC signatures on all incoming webhooks</p>
            </div>
            <div className="relative"
              onMouseEnter={() => setWebhookTooltip(true)}
              onMouseLeave={() => setWebhookTooltip(false)}>
              <Toggle checked={security.webhookSig} onChange={() => setWebhookTooltip(true)} />
              {webhookTooltip && !security.webhookSig && (
                <div className="absolute right-0 bottom-7 bg-slate-800 border border-[#2A2F45] rounded-lg px-3 py-2 text-xs text-slate-300 whitespace-nowrap shadow-xl z-10">
                  Required for security
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#1E2130]">
          <button onClick={() => { setTimeout(() => onToast('Security settings saved', 'success'), 1500); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all">
            <Save className="w-4 h-4" /> Save Security Settings
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
