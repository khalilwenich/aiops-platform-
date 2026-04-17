import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket.js';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/pipelines': 'Pipelines',
  '/analysis': 'AI Analysis',
  '/security': 'Security',
  '/settings': 'Settings',
};

export function Topbar() {
  const location = useLocation();
  const { isConnected } = useWebSocket();

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'AIOps';

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-30 flex items-center px-6 gap-4">
      {/* Page title */}
      <h1 className="text-base font-semibold text-text-primary">{title}</h1>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search pipelines, projects... (⌘K)"
            className="w-full bg-surface-2 border border-border rounded-full pl-9 pr-4 py-2 text-sm text-text-secondary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'live-dot' : 'bg-slate-600'}`}
          />
          <span className={`text-xs font-medium ${isConnected ? 'text-success' : 'text-text-muted'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
