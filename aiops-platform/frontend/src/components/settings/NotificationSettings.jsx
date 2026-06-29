import { useEffect, useState } from 'react';
import { Save, Lock, Loader2 } from 'lucide-react';
import { settingsApi } from '../../api/settings.api.js';

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-6 mb-4">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="border-t border-[#1E2130] pt-1">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0
        ${checked ? 'bg-indigo-600' : 'bg-slate-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
        ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function Badge({ children, variant = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    indigo:  'bg-indigo-500/10 text-indigo-400',
    amber:   'bg-amber-500/10 text-amber-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[variant]}`}>{children}</span>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled, badge }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-[#1E2130] last:border-0">
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2">
          <p className="text-slate-200 font-medium text-sm">{label}</p>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
          {disabled && <Lock className="w-3 h-3 text-slate-600" />}
        </div>
        <p className="text-slate-500 text-xs mt-0.5">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function SaveButton({ onClick, loading, children, fullWidth }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500
        disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg
        transition-all duration-200 ${fullWidth ? 'w-full' : ''}`}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : <Save className="w-4 h-4" />
      }
      {children}
    </button>
  );
}

const DEFAULTS = {
  pipeline: { failed: true, recovered: true, success: false, manual: true },
  thresholds: { failureRate: 50, mttr: 60, confidence: 70 },
  security: { critical: true, high: true, medium: false, qualityGate: true },
  channels: { email: { enabled: false, address: '' }, slack: { enabled: false, webhookUrl: '' } },
};

export default function NotificationSettings({ onToast }) {
  const [pipeline, setPipeline] = useState(DEFAULTS.pipeline);
  const [thresholds, setThresholds] = useState(DEFAULTS.thresholds);
  const [security, setSecurity] = useState(DEFAULTS.security);
  const [channels, setChannels] = useState({ email: false, slack: false });
  const [emailAddr, setEmailAddr]   = useState('');
  const [slackUrl, setSlackUrl]     = useState('');
  const [slackTest, setSlackTest]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    settingsApi.getAll()
      .then(({ settings }) => {
        const n = settings.notifications;
        setPipeline(n.pipeline);
        setThresholds(n.thresholds);
        setSecurity(n.security);
        setChannels({ email: n.channels.email.enabled, slack: n.channels.slack.enabled });
        setEmailAddr(n.channels.email.address);
        setSlackUrl(n.channels.slack.webhookUrl);
      })
      .catch(() => onToast('Failed to load notification settings', 'error'))
      .finally(() => setReady(true));
  }, [onToast]);

  const testSlack = async () => {
    setSlackTest('loading');
    try {
      const { success } = await settingsApi.testSlack(slackUrl);
      setSlackTest(success ? 'success' : 'error');
    } catch {
      setSlackTest('error');
    }
  };

  const testEmail = () => {
    onToast('Email delivery is not configured on this server yet', 'error');
  };

  const save = async () => {
    setLoading(true);
    try {
      await settingsApi.updateSection('notifications', {
        pipeline,
        thresholds,
        security,
        channels: {
          email: { enabled: channels.email, address: emailAddr },
          slack: { enabled: channels.slack, webhookUrl: slackUrl },
        },
      });
      onToast('Notification settings saved', 'success');
    } catch (err) {
      onToast(err?.error || 'Failed to save notification settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return <div className="text-slate-500 text-sm">Loading notification settings…</div>;
  }

  return (
    <div>
      <SectionCard title="Pipeline Events" subtitle="Choose which pipeline events trigger notifications">
        <ToggleRow label="Pipeline Failed"      description="Notify when any pipeline fails"                    checked={pipeline.failed}    onChange={v => setPipeline(p => ({ ...p, failed: v }))} />
        <ToggleRow label="Pipeline Recovered"   description="Notify when pipeline succeeds after failure"       checked={pipeline.recovered} onChange={v => setPipeline(p => ({ ...p, recovered: v }))} />
        <ToggleRow label="Pipeline Success"     description="Notify for every successful pipeline"             checked={pipeline.success}   onChange={v => setPipeline(p => ({ ...p, success: v }))} />
        <ToggleRow label="Manual Action Required" description="Pipeline waiting for manual trigger"           checked={pipeline.manual}    onChange={v => setPipeline(p => ({ ...p, manual: v }))} />
      </SectionCard>

      <SectionCard title="Alert Thresholds" subtitle="Define when alerts are triggered">
        {[
          { label: 'Failure Rate Alert', desc: 'Alert when failure rate exceeds in 24h', key: 'failureRate', suffix: '%' },
          { label: 'MTTR Alert',         desc: 'Alert when mean time to resolution exceeds', key: 'mttr', suffix: 'min' },
          { label: 'Min AI Confidence',  desc: 'Only process analyses above threshold', key: 'confidence', suffix: '%' },
        ].map(({ label, desc, key, suffix }) => (
          <div key={key} className="flex justify-between items-center py-4 border-b border-[#1E2130] last:border-0">
            <div>
              <p className="text-slate-200 font-medium text-sm">{label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={thresholds[key]}
                onChange={e => setThresholds(t => ({ ...t, [key]: Number(e.target.value) }))}
                className="w-20 text-center bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-2 py-1.5
                  text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-slate-400 text-sm w-6">{suffix}</span>
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Security Alerts" subtitle="Vulnerability detection notifications">
        <ToggleRow label="CRITICAL Vulnerabilities" description="Immediate alert for critical CVEs"  checked={security.critical}    onChange={v => setSecurity(s => ({ ...s, critical: v }))}    badge={{ label: 'Recommended', variant: 'emerald' }} />
        <ToggleRow label="HIGH Vulnerabilities"     description="Alert for HIGH severity CVEs"       checked={security.high}        onChange={v => setSecurity(s => ({ ...s, high: v }))} />
        <ToggleRow label="MEDIUM Vulnerabilities"   description="Alert for MEDIUM severity CVEs"     checked={security.medium}      onChange={v => setSecurity(s => ({ ...s, medium: v }))} />
        <ToggleRow label="Quality Gate Failed"      description="SonarQube quality gate failure"     checked={security.qualityGate} onChange={v => setSecurity(s => ({ ...s, qualityGate: v }))} />
      </SectionCard>

      <SectionCard title="Notification Channels" subtitle="Where to deliver your alerts">
        {/* In-app */}
        <div className="flex justify-between items-center py-4 border-b border-[#1E2130]">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-slate-200 font-medium text-sm">In-App Notifications</p>
              <Lock className="w-3 h-3 text-slate-600" />
            </div>
            <p className="text-slate-500 text-xs mt-0.5">Always active</p>
          </div>
          <Toggle checked disabled onChange={() => {}} />
        </div>

        {/* Email */}
        <div className="py-4 border-b border-[#1E2130]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-200 font-medium text-sm">Email Notifications</p>
              <p className="text-slate-500 text-xs mt-0.5">Receive alerts by email</p>
            </div>
            <Toggle checked={channels.email} onChange={v => setChannels(c => ({ ...c, email: v }))} />
          </div>
          {channels.email && (
            <div className="mt-3 flex gap-2 animate-[slideDown_0.2s_ease-out]">
              <input
                type="email"
                placeholder="alerts@company.com"
                value={emailAddr}
                onChange={e => setEmailAddr(e.target.value)}
                className="flex-1 bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2
                  text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button onClick={testEmail} className="text-sm text-slate-400 hover:text-slate-200 border border-[#2A2F45]
                hover:border-[#3A3F55] rounded-lg px-3 py-2 transition-all">
                Send test email
              </button>
            </div>
          )}
        </div>

        {/* Slack */}
        <div className="py-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-200 font-medium text-sm">Slack</p>
              <p className="text-slate-500 text-xs mt-0.5">Send alerts to a Slack channel via webhook</p>
            </div>
            <Toggle checked={channels.slack} onChange={v => { setChannels(c => ({ ...c, slack: v })); setSlackTest(null); }} />
          </div>
          {channels.slack && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackUrl}
                  onChange={e => { setSlackUrl(e.target.value); setSlackTest(null); }}
                  className="flex-1 bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2
                    text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={testSlack}
                  disabled={slackTest === 'loading'}
                  className="text-sm text-slate-400 hover:text-slate-200 border border-[#2A2F45]
                    hover:border-[#3A3F55] rounded-lg px-3 py-2 transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  {slackTest === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Test Connection
                </button>
              </div>
              {slackTest === 'success' && <p className="text-emerald-400 text-xs">✅ Webhook working</p>}
              {slackTest === 'error'   && <p className="text-red-400 text-xs">❌ Failed — check URL</p>}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[#1E2130]">
          <SaveButton onClick={save} loading={loading} fullWidth>Save Notification Settings</SaveButton>
        </div>
      </SectionCard>
    </div>
  );
}
