import { useState, useEffect, useCallback } from 'react';
import { User, Bell, Link2, Brain, Shield, Building2, CheckCircle, XCircle, Info } from 'lucide-react';
import ProfileSettings from '../components/settings/ProfileSettings.jsx';
import NotificationSettings from '../components/settings/NotificationSettings.jsx';
import IntegrationsSettings from '../components/settings/IntegrationsSettings.jsx';
import AISettings from '../components/settings/AISettings.jsx';
import SecuritySettings from '../components/settings/SecuritySettings.jsx';
import PlatformSettings from '../components/settings/PlatformSettings.jsx';

const TABS = [
  { id: 'profile',       label: 'Profile',          icon: User },
  { id: 'notifications', label: 'Notifications',    icon: Bell },
  { id: 'integrations',  label: 'Integrations',     icon: Link2 },
  { id: 'ai',            label: 'AI Configuration', icon: Brain },
  { id: 'security',      label: 'Security',         icon: Shield },
  { id: 'platform',      label: 'Platform',         icon: Building2 },
];

function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl
            animate-[slideInRight_0.3s_ease-out]
            ${t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : ''}
            ${t.type === 'error'   ? 'bg-red-500/10 border-red-500/30 text-red-400' : ''}
            ${t.type === 'info'    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : ''}
          `}
        >
          {t.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {t.type === 'error'   && <XCircle className="w-4 h-4 flex-shrink-0" />}
          {t.type === 'info'    && <Info className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm font-medium">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-2 opacity-60 hover:opacity-100 text-current">✕</button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { toasts, addToast, removeToast } = useToast();

  const COMPONENTS = {
    profile:       <ProfileSettings       onToast={addToast} />,
    notifications: <NotificationSettings  onToast={addToast} />,
    integrations:  <IntegrationsSettings  onToast={addToast} />,
    ai:            <AISettings            onToast={addToast} />,
    security:      <SecuritySettings      onToast={addToast} />,
    platform:      <PlatformSettings      onToast={addToast} />,
  };

  return (
    <div className="flex h-full min-h-screen bg-[#0A0B0F]" style={{ marginTop: 0 }}>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Left nav */}
      <aside className="w-56 flex-shrink-0 bg-[#111318] border-r border-[#1E2130] flex flex-col pt-6">
        <p className="px-4 mb-4 text-xs font-semibold text-slate-600 uppercase tracking-widest">Settings</p>
        <nav className="flex flex-col gap-0.5 px-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 text-sm font-medium w-full text-left
                  ${active
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 pl-[10px]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1D26] border-l-2 border-transparent'
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
              <p className="text-slate-400 text-sm mt-1">Manage your AIOps platform configuration</p>
            </div>
            <span className="text-slate-600 text-xs pt-1">Capgemini Altran Telnet Corporation Tunisie</span>
          </div>

          {COMPONENTS[activeTab]}
        </div>
      </div>
    </div>
  );
}
