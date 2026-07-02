import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PhoneCall, Plus, Trash2, User, Clock } from 'lucide-react';
import { apiClient } from '../api/client.js';
import { usersApi } from '../api/users.api.js';
import { Spinner } from '../components/ui/Spinner.jsx';
import { Card } from '../components/ui/Card.jsx';

function formatDate(d) {
  return d ? new Date(d).toLocaleString('fr-TN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

export function OnCallPage() {
  const queryClient = useQueryClient();
  const currentUser = useSelector(s => s.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  const [form, setForm] = useState({ userId: '', startsAt: '', endsAt: '', note: '' });
  const [showForm, setShowForm] = useState(false);

  const { data: currentData, isLoading: loadingCurrent } = useQuery({
    queryKey: ['oncall', 'current'],
    queryFn: () => apiClient.get('/api/oncall/current'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: scheduleData, isLoading: loadingSchedule } = useQuery({
    queryKey: ['oncall', 'schedule'],
    queryFn: () => apiClient.get('/api/oncall'),
    staleTime: 30_000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    staleTime: 300_000,
    enabled: isAdmin,
  });

  const usersList = usersData?.users || [];
  const entries = scheduleData?.entries || [];
  const onCall = currentData?.onCall;

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/api/oncall', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oncall'] });
      setForm({ userId: '', startsAt: '', endsAt: '', note: '' });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/api/oncall/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['oncall'] }),
  });

  const handleCreate = () => {
    if (!form.userId || !form.startsAt || !form.endsAt) return;
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Rotation On-Call</h1>
            <p className="text-slate-500 text-sm">Planning et garde en astreinte</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Planifier une garde
          </button>
        )}
      </div>

      {/* Current on-call */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <h2 className="text-sm font-semibold text-slate-100">Astreinte actuelle</h2>
        </div>
        {loadingCurrent ? (
          <Spinner size="sm" />
        ) : onCall ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-600/30 flex items-center justify-center">
              <span className="text-lg font-bold text-indigo-400">
                {(onCall.userId?.name || onCall.userId?.email || '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-slate-100 font-semibold">{onCall.userId?.name}</p>
              <p className="text-slate-500 text-sm">{onCall.userId?.email}</p>
              <p className="text-slate-600 text-xs mt-0.5">
                Jusqu'au {formatDate(onCall.endsAt)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-4 text-slate-500">
            <User className="w-5 h-5" />
            <p className="text-sm">Aucune garde planifiée pour le moment</p>
          </div>
        )}
      </Card>

      {/* Add form */}
      {showForm && isAdmin && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-100 mb-4">Nouvelle période d'astreinte</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Responsable</label>
              <select
                value={form.userId}
                onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}
                className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 text-slate-100 text-sm
                  focus:outline-none focus:border-indigo-500"
              >
                <option value="">Sélectionner un utilisateur</option>
                {usersList.filter(u => u.isActive).map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Note (optionnel)</label>
              <input
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                placeholder="Ex: Semaine critique — release v2"
                className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 text-slate-100 text-sm
                  focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Début</label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={e => setForm(p => ({ ...p, startsAt: e.target.value }))}
                className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 text-slate-100 text-sm
                  focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Fin</label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={e => setForm(p => ({ ...p, endsAt: e.target.value }))}
                className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 text-slate-100 text-sm
                  focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !form.userId || !form.startsAt || !form.endsAt}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
            >
              {createMutation.isPending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Plus className="w-4 h-4" />}
              Créer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-[#2A2F45] rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </Card>
      )}

      {/* Schedule */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-100">Planning des 30 prochains jours</h2>
        </div>
        {loadingSchedule ? (
          <Spinner size="sm" />
        ) : entries.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">Aucune garde planifiée.</p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => {
              const now = new Date();
              const isCurrent = new Date(entry.startsAt) <= now && new Date(entry.endsAt) >= now;
              return (
                <div key={entry._id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors
                    ${isCurrent
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-[#1A1D26] border-[#2A2F45]'}`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isCurrent ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-indigo-400">
                      {(entry.userId?.name || entry.userId?.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium">{entry.userId?.name || entry.userId?.email}</p>
                    <p className="text-slate-500 text-xs">
                      {formatDate(entry.startsAt)} → {formatDate(entry.endsAt)}
                    </p>
                    {entry.note && <p className="text-slate-600 text-xs mt-0.5 italic">{entry.note}</p>}
                  </div>
                  {isCurrent && (
                    <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      En cours
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => deleteMutation.mutate(entry._id)}
                      className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default OnCallPage;
