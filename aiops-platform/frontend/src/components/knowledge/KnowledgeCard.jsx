import { Tag, Clock, TrendingUp, Terminal, ChevronDown } from 'lucide-react';

const TYPE_STYLES = {
  build_failure:          { label: 'Build',       color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  test_failure:           { label: 'Test',        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  dependency_issue:       { label: 'Dependency',  color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  security_vulnerability: { label: 'Security',    color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  configuration_error:    { label: 'Config',      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  unknown:                { label: 'Unknown',     color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

export function KnowledgeCard({ entry, onSelect }) {
  const style = TYPE_STYLES[entry.errorType] || TYPE_STYLES.unknown;

  return (
    <div
      className="bg-[#111318] border border-[#1E2130] rounded-xl p-5 hover:border-[#2A2F45]
        transition-all duration-200 cursor-pointer flex flex-col gap-3"
      onClick={() => onSelect(entry)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${style.color}`}>
              {style.label}
            </span>
            <span className="text-xs text-slate-600">{entry.usedCount}x used</span>
          </div>
          <h3 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-2">{entry.title}</h3>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 flex-shrink-0">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{entry.successRate}%</span>
        </div>
      </div>

      <p className="text-slate-400 text-xs line-clamp-2">{entry.rootCause}</p>
      <p className="text-slate-300 text-xs line-clamp-2">{entry.solution}</p>

      {entry.command && (
        <div className="flex items-center gap-2 bg-[#0A0B0F] rounded-lg px-3 py-1.5 border border-[#1E2130]">
          <Terminal className="w-3 h-3 text-indigo-400 flex-shrink-0" />
          <code className="text-xs text-indigo-300 font-mono truncate">{entry.command}</code>
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex flex-wrap gap-1">
          {(entry.tags || []).slice(0, 3).map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs text-slate-500 bg-[#1A1D26] px-2 py-0.5 rounded">
              <Tag className="w-2.5 h-2.5" />{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <Clock className="w-3 h-3" />
          {entry.lastUsed ? new Date(entry.lastUsed).toLocaleDateString('fr-TN') : '—'}
        </div>
      </div>

      <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 w-fit">
        View Details <ChevronDown className="w-3 h-3" />
      </button>
    </div>
  );
}
