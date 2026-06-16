import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Zap, TrendingDown, Target, Search } from 'lucide-react';
import { KnowledgeCard } from '../components/knowledge/KnowledgeCard.jsx';
import { SolutionDetail } from '../components/knowledge/SolutionDetail.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { knowledgeApi } from '../api/knowledge.api.js';

const FILTERS = ['All', 'Build', 'Test', 'Dependency', 'Security', 'Config'];
const FILTER_MAP = {
  Build: 'build_failure', Test: 'test_failure', Dependency: 'dependency_issue',
  Security: 'security_vulnerability', Config: 'configuration_error',
};

export default function KnowledgeBase() {
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', 'all'],
    queryFn: () => knowledgeApi.getAll({ limit: 200 }),
    staleTime: 30_000,
  });

  const entries = data?.entries || [];

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchType = filter === 'All' || e.errorType === FILTER_MAP[filter];
      const q = search.toLowerCase();
      const matchSearch = !q || e.title.toLowerCase().includes(q) ||
        e.rootCause.toLowerCase().includes(q) || (e.tags || []).some(t => t.includes(q));
      return matchType && matchSearch;
    });
  }, [entries, search, filter]);

  const totalHits = entries.reduce((s, e) => s + (e.usedCount || 0), 0);
  const avgSuccessRate = entries.length
    ? Math.round(entries.reduce((s, e) => s + (e.successRate || 0), 0) / entries.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-1">Solutions learned from past incidents — platform gets smarter over time</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search solutions..."
            className="pl-9 pr-4 py-2 bg-[#1A1D26] border border-[#2A2F45] rounded-lg text-slate-100
              placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1
              focus:ring-indigo-500 w-64 transition-all"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: BookOpen,     label: 'Total Solutions',   value: entries.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { icon: Zap,          label: 'Cache Hits',        value: totalHits,            color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: TrendingDown, label: 'API Calls Saved',   value: Math.max(0, totalHits - entries.length), color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: Target,       label: 'Avg Success Rate',  value: `${avgSuccessRate}%`, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-[#111318] border border-[#1E2130] rounded-xl p-4 hover:border-[#2A2F45] transition-all flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-500 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-[#1A1D26] text-slate-400 hover:text-slate-200 border border-[#2A2F45]'}`}>
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(entry => (
            <KnowledgeCard key={entry._id} entry={entry} onSelect={setSelected} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-16 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{entries.length === 0
                ? 'No solutions recorded yet — they accumulate automatically as resolved analyses are marked resolved.'
                : 'No solutions found for this filter.'}</p>
            </div>
          )}
        </div>
      )}

      {selected && <SolutionDetail entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
