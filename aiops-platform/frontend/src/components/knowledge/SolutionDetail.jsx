import { useEffect, useState } from 'react';
import { X, Copy, Check, Terminal, Tag } from 'lucide-react';

export function SolutionDetail({ entry, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const copy = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-[#111318] border border-[#2A2F45] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[#1E2130] sticky top-0 bg-[#111318] z-10">
          <h2 className="text-slate-100 font-semibold text-lg">{entry.title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Root Cause</p>
            <p className="text-slate-200 text-sm leading-relaxed">{entry.rootCause}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Solution</p>
            <p className="text-slate-200 text-sm leading-relaxed">{entry.solution}</p>
          </div>

          {entry.command && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Command</p>
              <div className="bg-[#0A0B0F] border border-[#1E2130] rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Terminal className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <code className="text-indigo-300 font-mono text-sm">{entry.command}</code>
                </div>
                <button onClick={() => copy(entry.command)}
                  className="text-slate-500 hover:text-slate-300 flex-shrink-0 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {entry.codeHint && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Code Hint</p>
              <pre className="bg-[#0A0B0F] border border-[#1E2130] rounded-lg p-4 text-sm text-slate-300 font-mono overflow-x-auto">
                {entry.codeHint}
              </pre>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(entry.tags || []).map(tag => (
              <span key={tag} className="flex items-center gap-1.5 bg-[#1A1D26] border border-[#2A2F45]
                text-slate-400 text-xs px-2.5 py-1 rounded-full">
                <Tag className="w-3 h-3" />{tag}
              </span>
            ))}
          </div>

          <div className="bg-[#1A1D26] rounded-xl p-4 flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              This solution was used <span className="text-indigo-400 font-semibold">{entry.usedCount} times</span> with{' '}
              <span className="text-emerald-400 font-semibold">{entry.successRate}% success rate</span>
            </p>
          </div>

          {entry.projectIds?.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Used in Projects</p>
              <div className="flex flex-wrap gap-2">
                {entry.projectIds.map(pid => (
                  <span key={pid} className="text-xs bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full">
                    {pid}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
