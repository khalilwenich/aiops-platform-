import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, User, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { WarRoomPanel } from '../components/incident/WarRoomPanel.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { incidentApi } from '../api/incident.api.js';

const SEV_STYLE = {
  critical: 'bg-red-500/10 border-red-500/20 text-red-400',
  high:     'bg-orange-500/10 border-orange-500/20 text-orange-400',
  medium:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
  low:      'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

export function timeSince(date) {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function Incidents() {
  const queryClient = useQueryClient();
  const [warRoom, setWarRoom] = useState(null);
  const [showResolved, setShowResolved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', 'all'],
    queryFn: () => incidentApi.getAll({ limit: 100 }),
    staleTime: 15_000,
  });

  const allIncidents = data?.incidents || [];
  const incidents = allIncidents.filter(i => i.status !== 'resolved');
  const resolved  = allIncidents.filter(i => i.status === 'resolved');
  const openCount = incidents.filter(i => i.status === 'open').length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['incidents'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => incidentApi.updateStatus(id, { status }),
    onSuccess: (updated) => {
      invalidate();
      setWarRoom(prev => {
        if (!prev || prev._id !== updated._id) return prev;
        return updated.status === 'resolved' ? null : updated;
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ id, message }) => incidentApi.addComment(id, message),
    onSuccess: (updated) => {
      invalidate();
      setWarRoom(prev => (prev && prev._id === updated._id ? updated : prev));
    },
  });

  const postMortemMutation = useMutation({
    mutationFn: (id) => incidentApi.generatePostMortem(id),
    onSuccess: (result) => {
      invalidate();
      setWarRoom(prev => (prev ? { ...prev, postMortem: result.postMortem } : prev));
    },
  });

  const handleStatusChange = (id, status) => statusMutation.mutate({ id, status });
  const handleAddComment   = (id, message) => commentMutation.mutate({ id, message });
  const handlePostMortem   = (id) => postMortemMutation.mutate(id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-lg bg-red-600/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            {openCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {openCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Incidents — War Room
              {openCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Active incidents and resolution tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Open: {openCount}
          </span>
          <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full">
            Investigating: {incidents.filter(i => i.status === 'investigating').length}
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}

      {/* Active incidents */}
      {!isLoading && incidents.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Active Incidents
          </h2>
          <div className="space-y-3">
            {incidents.map(inc => (
              <div key={inc._id} className="bg-[#111318] border border-[#1E2130] rounded-xl p-5 hover:border-[#2A2F45] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded border ${SEV_STYLE[inc.severity]}`}>
                        {inc.severity?.toUpperCase()}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${inc.status === 'investigating' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                        {inc.status}
                      </span>
                      <span className="text-xs text-slate-600">{inc.incidentId}</span>
                    </div>
                    <h3 className="text-slate-100 font-semibold text-sm">{inc.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        Detected {timeSince(inc.detectedAt)}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <User className="w-3.5 h-3.5" />
                        {inc.assignedTo || 'Unassigned'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setWarRoom(warRoom?._id === inc._id ? null : inc)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all flex-shrink-0"
                  >
                    {warRoom?._id === inc._id ? 'Close' : 'View War Room'}
                  </button>
                </div>

                {warRoom?._id === inc._id && (
                  <div className="mt-4 pt-4 border-t border-[#1E2130]">
                    <WarRoomPanel
                      incident={warRoom}
                      onClose={() => setWarRoom(null)}
                      onStatusChange={handleStatusChange}
                      onAddComment={handleAddComment}
                      onPostMortem={handlePostMortem}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && incidents.length === 0 && (
        <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-100 font-semibold">All clear!</p>
          <p className="text-slate-500 text-sm mt-1">No active incidents at the moment.</p>
        </div>
      )}

      {/* Resolved */}
      {!isLoading && (
        <div>
          <button onClick={() => setShowResolved(v => !v)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors">
            {showResolved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Resolved Incidents ({resolved.length})
          </button>

          {showResolved && (
            <div className="mt-3 bg-[#111318] border border-[#1E2130] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E2130]">
                    {['Title', 'Project', 'Severity', 'MTTR', 'Resolved By', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resolved.map(r => (
                    <tr key={r._id} className="border-b border-[#1E2130] last:border-0 hover:bg-[#1A1D26]/30 transition-colors">
                      <td className="px-4 py-3 text-slate-300 text-xs max-w-xs truncate">{r.title}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{r.projectName}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${SEV_STYLE[r.severity]}`}>{r.severity}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs font-medium">{r.mttr ?? '—'} min</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {r.timeline?.findLast?.(t => t.action === 'resolved')?.actor || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString('fr-TN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
