import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Layers } from 'lucide-react';
import { useProject } from '../../context/ProjectContext.jsx';

export function GlobalProjectFilter() {
  const { selectedProject, setSelectedProject, projects } = useProject();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = selectedProject === 'all'
    ? { name: 'All Projects' }
    : projects.find(p => p.id === selectedProject) || { name: 'All Projects' };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-3 py-2
          text-slate-300 hover:border-[#3A3F55] hover:text-slate-100 transition-all text-sm"
      >
        <Layers className="w-3.5 h-3.5 text-indigo-400" />
        <span>{current.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-48 bg-[#111318] border border-[#2A2F45]
          rounded-xl shadow-xl z-50 overflow-hidden">
          {[{ id: 'all', name: 'All Projects', namespace: '' }, ...projects].map(p => {
            const active = p.id === 'all' ? selectedProject === 'all' : selectedProject === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setSelectedProject(p.id === 'all' ? 'all' : p.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${active ? 'text-indigo-400 bg-indigo-600/10' : 'text-slate-300 hover:bg-[#1A1D26]'}`}
              >
                <div className="flex-1 text-left">
                  <p className="font-medium">{p.name}</p>
                  {p.namespace && <p className="text-xs text-slate-500">{p.namespace}</p>}
                </div>
                {active && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
