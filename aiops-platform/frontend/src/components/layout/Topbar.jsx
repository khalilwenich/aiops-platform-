import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket.js';

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/pipelines':  'Pipelines',
  '/analysis':   'AI Analysis',
  '/security':   'Security',
  '/knowledge':  'Knowledge Base',
  '/health':     'Health Score',
  '/reports':    'Weekly Report',
  '/incidents':  'Incidents',
  '/metrics':    'Métriques',
  '/oncall':     'On-Call',
  '/teams':      'Équipes',
  '/settings':   'Settings',
};

const MAX_NOTIFS = 20;

function useNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const { on } = useWebSocket();

  useEffect(() => {
    function handleAnalysis(data) {
      const { pipelineId, projectId, analysis } = data;
      const isFailed = analysis?.errorType && analysis.errorType !== 'unknown';
      setNotifs(prev => [
        {
          id: `${pipelineId}-${Date.now()}`,
          type: isFailed ? 'failure' : 'success',
          title: isFailed
            ? `Pipeline failure — ${projectId} #${pipelineId}`
            : `Analyse terminée — ${projectId} #${pipelineId}`,
          detail: analysis?.rootCause || analysis?.summary || '',
          riskLevel: analysis?.riskLevel,
          pipelineId,
          at: new Date(),
          read: false,
        },
        ...prev,
      ].slice(0, MAX_NOTIFS));
      setUnread(n => n + 1);
    }
    return on('analysis:complete', handleAnalysis);
  }, [on]);

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }

  function dismiss(id) {
    setNotifs(prev => {
      const removed = prev.find(n => n.id === id);
      if (removed && !removed.read) setUnread(u => Math.max(0, u - 1));
      return prev.filter(n => n.id !== id);
    });
  }

  return { notifs, unread, markAllRead, dismiss };
}

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected } = useWebSocket();
  const { notifs, unread, markAllRead, dismiss } = useNotifications();

  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const panelRef = useRef(null);

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'AIOps';

  // Close panel on outside click
  useEffect(() => {
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function openPanel() {
    setPanelOpen(v => !v);
    if (!panelOpen) markAllRead();
  }

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/pipelines?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  }

  const riskColor = { critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-green-400' };

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-30 flex items-center px-6 gap-4">
      <h1 className="text-base font-semibold text-text-primary">{title}</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un pipeline ou projet… (Entrée)"
            className="w-full bg-surface-2 border border-border rounded-full pl-9 pr-4 py-2 text-sm text-text-secondary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'live-dot' : 'bg-slate-600'}`} />
          <span className={`text-xs font-medium ${isConnected ? 'text-success' : 'text-text-muted'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Notifications bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={openPanel}
            className="relative p-2 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
            {unread === 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-slate-600" />
            )}
          </button>

          {panelOpen && (
            <div className="absolute right-0 top-12 w-96 max-h-[480px] overflow-y-auto bg-[#0D0F14] border border-[#2A2F45] rounded-xl shadow-2xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2F45]">
                <span className="text-sm font-semibold text-slate-200">Notifications</span>
                <button onClick={() => setPanelOpen(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {notifs.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">
                  Aucune notification pour le moment
                </div>
              ) : (
                notifs.map(n => (
                  <div
                    key={n.id}
                    className="flex gap-3 px-4 py-3 border-b border-[#1A1D26] hover:bg-[#1A1D26] transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {n.type === 'failure'
                        ? <AlertTriangle className={`w-4 h-4 ${riskColor[n.riskLevel] || 'text-orange-400'}`} />
                        : <CheckCircle className="w-4 h-4 text-green-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => { navigate(`/pipelines/${n.pipelineId}`); setPanelOpen(false); dismiss(n.id); }}
                        className="text-xs font-medium text-slate-200 hover:text-indigo-400 text-left w-full truncate"
                      >
                        {n.title}
                      </button>
                      {n.detail && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{n.detail}</p>
                      )}
                      <p className="text-xs text-slate-600 mt-0.5">
                        {n.at.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button onClick={() => dismiss(n.id)} className="flex-shrink-0 text-slate-600 hover:text-slate-400 mt-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
