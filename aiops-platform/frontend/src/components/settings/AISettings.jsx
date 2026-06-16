import { useState } from 'react';
import { Save, Info } from 'lucide-react';

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

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex justify-between items-center py-3.5 border-b border-[#1E2130] last:border-0">
      <div>
        <p className="text-slate-200 font-medium text-sm">{label}</p>
        <p className="text-slate-500 text-xs mt-0.5">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

const ERROR_TYPES = [
  { key: 'build',    label: 'Build Failures',           desc: 'Compilation, packaging' },
  { key: 'test',     label: 'Test Failures',            desc: 'Unit, integration tests' },
  { key: 'dep',      label: 'Dependency Issues',        desc: 'Version conflicts' },
  { key: 'security', label: 'Security Vulnerabilities', desc: 'CVEs, insecure deps' },
  { key: 'config',   label: 'Configuration Errors',     desc: 'Env vars, config files' },
  { key: 'perf',     label: 'Performance Issues',       desc: 'Timeouts, memory' },
];

export default function AISettings({ onToast }) {
  const [behavior, setBehavior] = useState({ autoFailed: true, autoSuccess: false, reAnalyze: true, threshold: 60 });
  const [errorTypes, setErrorTypes] = useState({ build: true, test: true, dep: true, security: true, config: true, perf: true });
  const [contextEnabled, setContextEnabled] = useState(false);
  const [contextText, setContextText] = useState('');
  const [fixes, setFixes] = useState({ cli: true, code: true, autoResolve: false, maxFixes: 3 });
  const [loading, setLoading] = useState(false);

  const save = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onToast('AI configuration saved', 'success'); }, 1500);
  };

  const charColor = contextText.length >= 480 ? 'text-red-400' : contextText.length >= 400 ? 'text-amber-400' : 'text-slate-500';

  return (
    <div>
      <SectionCard title="Analysis Behavior" subtitle="Control when and how AI analysis triggers">
        <ToggleRow label="Auto-analyze Failed Pipelines" description="Trigger AI analysis automatically on failure" checked={behavior.autoFailed}  onChange={v => setBehavior(b => ({ ...b, autoFailed: v }))} />
        <ToggleRow label="Analyze Successful Pipelines"  description="Also analyze pipelines that succeed"         checked={behavior.autoSuccess} onChange={v => setBehavior(b => ({ ...b, autoSuccess: v }))} />
        <ToggleRow label="Re-analyze on Low Confidence"  description="Retry analysis when confidence score is low" checked={behavior.reAnalyze}   onChange={v => setBehavior(b => ({ ...b, reAnalyze: v }))} />
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-slate-200 font-medium text-sm">Confidence threshold</p>
            <p className="text-slate-500 text-xs mt-0.5">Minimum score to consider analysis reliable</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min={0} max={100} value={behavior.threshold}
              onChange={e => setBehavior(b => ({ ...b, threshold: Number(e.target.value) }))}
              className="w-20 text-center bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-2 py-1.5
                text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            <span className="text-slate-400 text-sm">%</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Error Classification" subtitle="Select which error types the AI should detect">
        <div className="grid grid-cols-2 gap-x-8">
          {ERROR_TYPES.map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 py-3 border-b border-[#1E2130] last:border-0 cursor-pointer group">
              <div className="relative mt-0.5 flex-shrink-0">
                <input type="checkbox" checked={errorTypes[key]}
                  onChange={e => setErrorTypes(t => ({ ...t, [key]: e.target.checked }))}
                  className="sr-only peer" />
                <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center
                  ${errorTypes[key] ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 group-hover:border-slate-400'}`}>
                  {errorTypes[key] && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
              <div>
                <p className="text-slate-200 text-sm font-medium">{label}</p>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Project Context" subtitle="Custom context injected into every AI prompt">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-slate-200 font-medium text-sm">Enable custom context</p>
            <p className="text-slate-500 text-xs mt-0.5">Add project-specific information to improve AI accuracy</p>
          </div>
          <button type="button" onClick={() => setContextEnabled(v => !v)}
            className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer
              ${contextEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
              ${contextEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className={`overflow-hidden transition-all duration-300 ${contextEnabled ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
          <textarea
            rows={8}
            maxLength={500}
            value={contextText}
            onChange={e => setContextText(e.target.value)}
            placeholder="e.g. This is a Node.js microservice using Express. It runs on Kubernetes. The main database is MongoDB..."
            className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-3
              text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500
              focus:ring-1 focus:ring-indigo-500 transition-all duration-200 text-sm resize-none"
          />
          <p className={`text-xs mt-1 text-right ${charColor}`}>{contextText.length} / 500</p>
          <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-300 text-sm">Context is prepended to every AI prompt. Keep it concise for best results.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Suggested Fixes Settings" subtitle="Configure how fix suggestions are generated">
        <ToggleRow label="Include CLI Commands" description="Show runnable terminal commands in suggestions" checked={fixes.cli}         onChange={v => setFixes(f => ({ ...f, cli: v }))} />
        <ToggleRow label="Include Code Hints"   description="Show code snippets and file changes"          checked={fixes.code}        onChange={v => setFixes(f => ({ ...f, code: v }))} />
        <ToggleRow label="Auto-mark Resolved"   description="Mark analysis resolved after fix is applied"  checked={fixes.autoResolve} onChange={v => setFixes(f => ({ ...f, autoResolve: v }))} />
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-slate-200 font-medium text-sm">Max fixes to suggest</p>
            <p className="text-slate-500 text-xs mt-0.5">Number of fix suggestions per analysis (1–10)</p>
          </div>
          <input type="number" min={1} max={10} value={fixes.maxFixes}
            onChange={e => setFixes(f => ({ ...f, maxFixes: Number(e.target.value) }))}
            className="w-20 text-center bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-2 py-1.5
              text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
      </SectionCard>

      <SectionCard title="AI Usage This Month" subtitle="Read-only statistics">
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { value: '127', label: 'Total analyses' },
            { value: '84%', label: 'Avg confidence' },
            { value: '8.3s', label: 'Avg analysis time' },
            { value: '184k', label: 'Tokens used' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#1A1D26] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-400">{value}</p>
              <p className="text-slate-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
        <button onClick={save} disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60
            text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save AI Configuration
        </button>
      </SectionCard>
    </div>
  );
}
