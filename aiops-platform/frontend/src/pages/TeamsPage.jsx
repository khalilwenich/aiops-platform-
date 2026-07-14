import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, UserPlus, UserMinus, Edit2, X, Check, FolderGit2 } from 'lucide-react';
import { teamsApi } from '../api/teams.api.js';
import { usersApi } from '../api/users.api.js';
import { pipelinesApi } from '../api/pipelines.api.js';
import { Spinner } from '../components/ui/Spinner.jsx';
import { Card } from '../components/ui/Card.jsx';

const INPUT_CLS = 'w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-600';
const SELECT_CLS = 'bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500';

function ProjectPicker({ selected, onChange }) {
  const { data } = useQuery({
    queryKey: ['projects'],
    queryFn: pipelinesApi.getProjects,
    staleTime: 60_000,
  });

  const [customInput, setCustomInput] = useState('');
  const knownProjects = data?.projects || [];

  function toggle(pid) {
    if (selected.includes(pid)) {
      onChange(selected.filter(p => p !== pid));
    } else {
      onChange([...selected, pid]);
    }
  }

  function addCustom() {
    const val = customInput.trim();
    if (val && !selected.includes(val)) {
      onChange([...selected, val]);
    }
    setCustomInput('');
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 flex items-center gap-1">
        <FolderGit2 className="w-3.5 h-3.5" />
        Projets accessibles
      </p>

      {/* Known projects from DB */}
      {knownProjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-[#0D0F14] border border-[#2A2F45] rounded-lg">
          {knownProjects.map(p => {
            const isSelected = selected.includes(p.projectId);
            return (
              <button
                key={p.projectId}
                type="button"
                onClick={() => toggle(p.projectId)}
                className={`px-2 py-1 rounded-md text-xs font-mono border transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-[#1A1D26] border-[#2A2F45] text-slate-400 hover:border-indigo-500/30 hover:text-slate-200'
                }`}
              >
                {isSelected && <span className="mr-1">✓</span>}
                {p.projectName || p.projectId}
                {p.projectName && p.projectName !== p.projectId && (
                  <span className="ml-1 text-slate-600">({p.projectId})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Manual entry for projects not yet in DB */}
      <div className="flex gap-2">
        <input
          className={`${INPUT_CLS} flex-1`}
          placeholder="ID projet personnalisé (ex: jenkins-job-name)"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="px-3 py-2 rounded-lg bg-[#1A1D26] border border-[#2A2F45] text-slate-400 hover:text-slate-200 hover:border-indigo-500/30 text-xs transition-colors disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(pid => (
            <span key={pid} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
              {pid}
              <button type="button" onClick={() => onChange(selected.filter(p => p !== pid))} className="hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {knownProjects.length === 0 && (
        <p className="text-xs text-slate-600 italic">Aucun pipeline en base — saisissez les IDs manuellement.</p>
      )}
    </div>
  );
}

export function TeamsPage() {
  const qc = useQueryClient();

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
    staleTime: 30_000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    staleTime: 120_000,
  });

  const teams = teamsData?.teams || [];
  const users = usersData?.users || [];

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', projectIds: [] });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addMemberTeamId, setAddMemberTeamId] = useState(null);
  const [addMemberUserId, setAddMemberUserId] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => teamsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      setShowCreate(false);
      setCreateForm({ name: '', description: '', projectIds: [] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => teamsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      setEditingId(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => teamsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }) => teamsApi.addMember(teamId, userId, 'member'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      setAddMemberTeamId(null);
      setAddMemberUserId('');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }) => teamsApi.removeMember(teamId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });

  function handleCreate() {
    if (!createForm.name.trim()) return;
    createMutation.mutate({
      name: createForm.name.trim(),
      description: createForm.description,
      projectIds: createForm.projectIds,
    });
  }

  function startEdit(team) {
    setEditingId(team._id);
    setEditForm({
      name: team.name,
      description: team.description || '',
      projectIds: team.projectIds || [],
    });
  }

  function handleUpdate() {
    updateMutation.mutate({
      id: editingId,
      data: { name: editForm.name, description: editForm.description, projectIds: editForm.projectIds },
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Équipes</h1>
            <p className="text-slate-500 text-sm">Gérer les équipes et leurs accès aux projets</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle équipe
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="p-5 border border-indigo-500/30 bg-indigo-600/5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Créer une équipe</h3>
          <div className="grid grid-cols-1 gap-3">
            <input
              className={INPUT_CLS}
              placeholder="Nom de l'équipe *"
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
            />
            <input
              className={INPUT_CLS}
              placeholder="Description (optionnel)"
              value={createForm.description}
              onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
            />
            <ProjectPicker
              selected={createForm.projectIds}
              onChange={ids => setCreateForm(f => ({ ...f, projectIds: ids }))}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !createForm.name.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {createMutation.isPending ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
              Créer
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Annuler
            </button>
          </div>
          {createMutation.isError && (
            <p className="mt-2 text-xs text-red-400">{createMutation.error?.message || 'Erreur lors de la création'}</p>
          )}
        </Card>
      )}

      {/* Teams list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : teams.length === 0 ? (
        <Card className="py-12 text-center text-slate-500 text-sm">
          Aucune équipe. Créez-en une pour commencer à isoler les projets.
        </Card>
      ) : (
        <div className="space-y-4">
          {teams.map(team => (
            <Card key={team._id} className="p-5">
              {editingId === team._id ? (
                <div className="space-y-3">
                  <input
                    className={INPUT_CLS}
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nom de l'équipe"
                  />
                  <input
                    className={INPUT_CLS}
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description"
                  />
                  <ProjectPicker
                    selected={editForm.projectIds || []}
                    onChange={ids => setEditForm(f => ({ ...f, projectIds: ids }))}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {updateMutation.isPending ? <Spinner size="sm" /> : <Check className="w-3.5 h-3.5" />}
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">{team.name}</h3>
                      {team.description && <p className="text-xs text-slate-500 mt-0.5">{team.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(team)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-600/10 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Supprimer l'équipe "${team.name}" ?`)) removeMutation.mutate(team._id); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Project IDs */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                      <FolderGit2 className="w-3.5 h-3.5" /> Projets accessibles
                    </p>
                    {team.projectIds?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {team.projectIds.map(pid => (
                          <span key={pid} className="px-2 py-0.5 rounded-md bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
                            {pid}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 italic">Aucun projet assigné</span>
                    )}
                  </div>

                  {/* Members */}
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Membres ({team.members?.length || 0})
                    </p>
                    <div className="space-y-1.5">
                      {(team.members || []).map(m => {
                        const u = m.userId;
                        return (
                          <div key={u?._id || m.userId} className="flex items-center justify-between py-1 px-2 rounded-md bg-surface-2/50">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-indigo-400">
                                  {(u?.name || u?.email || '?')[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-slate-200">{u?.name || '—'}</p>
                                <p className="text-xs text-slate-500">{u?.email || u?._id || m.userId}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 capitalize">{m.role}</span>
                              <button
                                onClick={() => removeMemberMutation.mutate({ teamId: team._id, userId: u?._id || m.userId })}
                                className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                                title="Retirer du membre"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add member */}
                    {addMemberTeamId === team._id ? (
                      <div className="flex gap-2 mt-2">
                        <select
                          className={`flex-1 ${SELECT_CLS}`}
                          value={addMemberUserId}
                          onChange={e => setAddMemberUserId(e.target.value)}
                        >
                          <option value="">Sélectionner un utilisateur…</option>
                          {users
                            .filter(u => !team.members?.some(m => (m.userId?._id || m.userId) === u._id))
                            .map(u => (
                              <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                        <button
                          onClick={() => addMemberMutation.mutate({ teamId: team._id, userId: addMemberUserId })}
                          disabled={!addMemberUserId || addMemberMutation.isPending}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                        >
                          {addMemberMutation.isPending ? <Spinner size="sm" /> : 'Ajouter'}
                        </button>
                        <button
                          onClick={() => { setAddMemberTeamId(null); setAddMemberUserId(''); }}
                          className="px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddMemberTeamId(team._id)}
                        className="mt-2 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Ajouter un membre
                      </button>
                    )}
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeamsPage;
