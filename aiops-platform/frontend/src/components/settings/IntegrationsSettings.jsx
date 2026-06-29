import { useEffect, useState } from 'react';
import { GitBranch, Shield, Search, Brain, Eye, EyeOff, Zap, Save, Info, Loader2 } from 'lucide-react';
import { settingsApi } from '../../api/settings.api.js';

function SectionCard({ title, subtitle, children, accentColor, icon, iconBg, connected }) {
  return (
    <div className={`bg-[#111318] border border-[#1E2130] rounded-xl p-6 mb-4 border-l-4 ${accentColor}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/30 text-slate-500'
        }`}>
          {connected ? 'Connected' : 'Not configured'}
        </span>
      </div>
      <div className="border-t border-[#1E2130] pt-5">{children}</div>
    </div>
  );
}

function InputField({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
      <input
        className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5
          text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500
          focus:ring-1 focus:ring-indigo-500 transition-all duration-200 text-sm"
        {...props}
      />
    </div>
  );
}

function PasswordInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 pr-10
            text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500
            focus:ring-1 focus:ring-indigo-500 transition-all duration-200 text-sm"
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function CardFooter({ onTest, onSave, loading, testResult }) {
  return (
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#1E2130]">
      <div className="flex items-center gap-3">
        <button
          onClick={onTest}
          disabled={loading === 'test'}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200
            border border-[#2A2F45] hover:border-[#3A3F55] rounded-lg px-3 py-2 transition-all disabled:opacity-60"
        >
          {loading === 'test' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Test Connection
        </button>
        {testResult === 'success' && <span className="text-emerald-400 text-xs">✅ Connected</span>}
        {testResult === 'error'   && <span className="text-red-400 text-xs">❌ Connection failed</span>}
      </div>
      <button
        onClick={onSave}
        disabled={loading === 'save'}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60
          text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
      >
        {loading === 'save' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  );
}

const isMasked = (v) => typeof v === 'string' && v.startsWith('••••');

export default function IntegrationsSettings({ onToast }) {
  const [gitlab, setGitlab]   = useState({ url: '', token: '', secret: '', branch: 'main' });
  const [sonar,  setSonar]    = useState({ url: '', token: '', project: '' });
  const [trivy,  setTrivy]    = useState({ source: 'artifacts', filename: 'trivy-report.json', severity: 'HIGH' });
  const [groq,   setGroq]     = useState({ key: '', model: 'llama-3.3-70b-versatile', maxTokens: 1500, temperature: 0.3 });
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    settingsApi.getAll()
      .then(({ settings }) => {
        const { gitlab: g, sonarqube: s, trivy: t, groq: q } = settings.integrations;
        setGitlab(g);
        setSonar({ url: s.url, token: s.token, project: s.project });
        setTrivy(t);
        setGroq({ key: q.key, model: q.model, maxTokens: q.maxTokens, temperature: q.temperature });
      })
      .catch(() => onToast('Failed to load integration settings', 'error'))
      .finally(() => setReady(true));
  }, [onToast]);

  const doTest = async (key, service, payload) => {
    setLoading(l => ({ ...l, [key]: 'test' }));
    try {
      const { success } = await settingsApi.testIntegration(service, payload);
      setResults(r => ({ ...r, [key]: success ? 'success' : 'error' }));
    } catch {
      setResults(r => ({ ...r, [key]: 'error' }));
    } finally {
      setLoading(l => ({ ...l, [key]: null }));
    }
  };

  const doSave = async (key, label, section, payload) => {
    setLoading(l => ({ ...l, [key]: 'save' }));
    try {
      await settingsApi.updateSection('integrations', { [section]: payload });
      onToast(`${label} settings saved`, 'success');
    } catch (err) {
      onToast(err?.error || `Failed to save ${label} settings`, 'error');
    } finally {
      setLoading(l => ({ ...l, [key]: null }));
    }
  };

  if (!ready) {
    return <div className="text-slate-500 text-sm">Loading integration settings…</div>;
  }

  return (
    <div>
      {/* GitLab */}
      <SectionCard title="GitLab" accentColor="border-orange-500"
        icon={<GitBranch className="w-5 h-5 text-orange-400" />} iconBg="bg-orange-500/10"
        connected={results.gitlab === 'success' || (!!gitlab.url && isMasked(gitlab.token))}>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="GitLab Instance URL" value={gitlab.url} placeholder="https://gitlab.company.com"
            onChange={e => setGitlab(g => ({ ...g, url: e.target.value }))} />
          <PasswordInput label="Personal Access Token" value={gitlab.token} placeholder="glpat-xxxxxxxxxxxx"
            onChange={e => setGitlab(g => ({ ...g, token: e.target.value }))} />
          <PasswordInput label="Webhook Secret" value={gitlab.secret} placeholder="dev-webhook-secret"
            onChange={e => setGitlab(g => ({ ...g, secret: e.target.value }))} />
          <InputField label="Default Branch" value={gitlab.branch} placeholder="main"
            onChange={e => setGitlab(g => ({ ...g, branch: e.target.value }))} />
        </div>
        <CardFooter
          onTest={() => doTest('gitlab', 'gitlab', { url: gitlab.url, token: isMasked(gitlab.token) ? '' : gitlab.token })}
          onSave={() => doSave('gitlab', 'GitLab', 'gitlab', gitlab)}
          loading={loading.gitlab} testResult={results.gitlab} />
      </SectionCard>

      {/* SonarQube */}
      <SectionCard title="SonarQube" accentColor="border-blue-500"
        icon={<Shield className="w-5 h-5 text-blue-400" />} iconBg="bg-blue-500/10"
        connected={results.sonar === 'success' || (!!sonar.url && isMasked(sonar.token))}>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="SonarQube URL" value={sonar.url} placeholder="http://localhost:9001"
            onChange={e => setSonar(s => ({ ...s, url: e.target.value }))} />
          <PasswordInput label="Authentication Token" value={sonar.token} placeholder="squ_xxxxxxxxxxxx"
            onChange={e => setSonar(s => ({ ...s, token: e.target.value }))} />
          <InputField label="Default Project Key" value={sonar.project} placeholder="my-project"
            onChange={e => setSonar(s => ({ ...s, project: e.target.value }))} />
        </div>
        <CardFooter
          onTest={() => doTest('sonar', 'sonarqube', { url: sonar.url })}
          onSave={() => doSave('sonar', 'SonarQube', 'sonarqube', sonar)}
          loading={loading.sonar} testResult={results.sonar} />
      </SectionCard>

      {/* Trivy */}
      <SectionCard title="Trivy" accentColor="border-cyan-500"
        icon={<Search className="w-5 h-5 text-cyan-400" />} iconBg="bg-cyan-500/10" connected>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Report Source</label>
            <div className="flex gap-2">
              {['artifacts', 'local'].map(s => (
                <button key={s} onClick={() => setTrivy(t => ({ ...t, source: s }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border
                    ${trivy.source === s
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                      : 'bg-[#1A1D26] border-[#2A2F45] text-slate-400 hover:border-[#3A3F55]'}`}>
                  {s === 'artifacts' ? '● GitLab Artifacts' : '○ Local Path'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Artifact Filename" value={trivy.filename} placeholder="trivy-report.json"
              onChange={e => setTrivy(t => ({ ...t, filename: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Minimum Severity</label>
              <select value={trivy.severity} onChange={e => setTrivy(t => ({ ...t, severity: e.target.value }))}
                className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5
                  text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-300 text-sm">Trivy reports are fetched automatically from GitLab CI artifacts after each pipeline run.</p>
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-[#1E2130]">
          <button onClick={() => doSave('trivy', 'Trivy', 'trivy', trivy)} disabled={loading.trivy === 'save'}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60
              text-white text-sm font-medium px-4 py-2 rounded-lg transition-all">
            {loading.trivy === 'save' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Trivy Settings
          </button>
        </div>
      </SectionCard>

      {/* Groq AI */}
      <SectionCard title="Groq AI" accentColor="border-purple-500"
        icon={<Brain className="w-5 h-5 text-purple-400" />} iconBg="bg-purple-500/10"
        connected={results.groq === 'success' || isMasked(groq.key)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="password" value={groq.key} onChange={e => setGroq(g => ({ ...g, key: e.target.value }))}
                  placeholder="gsk_xxxxxxxxxxxx"
                  className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5
                    text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <button onClick={() => doTest('groq', 'groq', { key: isMasked(groq.key) ? '' : groq.key })} disabled={loading.groq === 'test'}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200
                  border border-[#2A2F45] hover:border-[#3A3F55] rounded-lg px-3 py-2 transition-all">
                {loading.groq === 'test' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Test API Key
              </button>
            </div>
            {results.groq === 'success' && <p className="text-emerald-400 text-xs mt-1">✅ API key valid</p>}
            {results.groq === 'error' && <p className="text-red-400 text-xs mt-1">❌ Invalid key or unreachable</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Model</label>
            <select value={groq.model} onChange={e => setGroq(g => ({ ...g, model: e.target.value }))}
              className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5
                text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile — Recommended ⭐</option>
              <option value="llama-3.1-8b-instant">llama-3.1-8b-instant — Faster</option>
              <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 — Alternative</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Max Tokens</label>
            <input type="number" min={500} max={4000} value={groq.maxTokens}
              onChange={e => setGroq(g => ({ ...g, maxTokens: Number(e.target.value) }))}
              className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5
                text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Temperature</label>
            <input type="range" min={0} max={10} step={1} value={groq.temperature * 10}
              onChange={e => setGroq(g => ({ ...g, temperature: Number(e.target.value) / 10 }))}
              className="w-full accent-indigo-500" />
            <div className="flex justify-between mt-1">
              <span className="text-slate-500 text-xs">0.0 — Precise</span>
              <span className="text-indigo-400 font-bold text-sm">{groq.temperature.toFixed(1)}</span>
              <span className="text-slate-500 text-xs">1.0 — Creative</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-[#1E2130]">
          <button onClick={() => doSave('groqSave', 'AI', 'groq', groq)} disabled={loading.groqSave === 'save'}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60
              text-white text-sm font-medium px-4 py-2 rounded-lg transition-all">
            {loading.groqSave === 'save' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save AI Settings
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
