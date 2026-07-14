import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, GitBranch, Brain, ShieldAlert, Settings, LogOut, Zap, BookOpen, Heart, FileText, AlertTriangle, BarChart2, PhoneCall, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice.js';
import { incidentApi } from '../../api/incident.api.js';
import clsx from 'clsx';

const NAV_ITEMS = [
  { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pipelines',  icon: GitBranch,        label: 'Pipelines' },
  { path: '/analysis',   icon: Brain,            label: 'AI Analysis' },
  { path: '/security',   icon: ShieldAlert,      label: 'Security' },
  { path: '/knowledge',  icon: BookOpen,         label: 'Knowledge Base' },
  { path: '/health',     icon: Heart,            label: 'Health Score' },
  { path: '/reports',    icon: FileText,         label: 'Weekly Report' },
  { path: '/incidents',  icon: AlertTriangle,    label: 'Incidents' },
  { path: '/metrics',    icon: BarChart2,        label: 'Métriques' },
  { path: '/oncall',     icon: PhoneCall,        label: 'On-Call' },
  { path: '/teams',      icon: Users,            label: 'Équipes',   adminOnly: true },
  { path: '/settings',   icon: Settings,         label: 'Settings' },
];

export function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);

  const { data: openIncidents } = useQuery({
    queryKey: ['incidents', 'open-count'],
    queryFn: () => incidentApi.getAll({ status: 'open', limit: 1 }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const openCount = openIncidents?.total || 0;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#0D0F14] border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-indigo-400" />
        </div>
        <span className="text-lg font-bold gradient-text">AIOps</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.filter(item => !item.adminOnly || user?.role === 'admin').map(({ path, icon: Icon, label }) => {
          const badge = path === '/incidents' ? openCount : 0;
          return (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary-glow text-indigo-400 border-l-2 border-indigo-500 pl-[10px]'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-2'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center ml-auto font-bold">
                {badge}
              </span>
            )}
          </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-border">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-indigo-400">
                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{user.name || user.email}</p>
              <span className={clsx(
                'text-xs capitalize',
                user.role === 'admin' ? 'text-indigo-400' : user.role === 'analyst' ? 'text-yellow-400' : user.role === 'security' ? 'text-red-400' : 'text-text-muted'
              )}>
                {user.role}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-red-400 hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
