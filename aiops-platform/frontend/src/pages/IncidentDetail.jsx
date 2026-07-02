import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Brain, AlertTriangle, Clock, User, FileText } from 'lucide-react';
import { incidentApi } from '../api/incident.api.js';
import { IncidentTimeline } from '../components/incident/IncidentTimeline.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';

const SEV_STYLE = {
  critical: 'bg-red-500/10 border-red-500/20 text-red-400',
  high:     'bg-orange-500/10 border-orange-500/20 text-orange-400',
  medium:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
  low:      'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

const STATUS_STYLE = {
  open:          'bg-red-500/10 text-red-400',
  acknowledged:  'bg-indigo-500/10 text-indigo-400',
  investigating: 'bg-amber-500/10 text-amber-400',
  resolved:      'bg-emerald-500/10 text-emerald-400',
};

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-slate-200 text-sm">{value || '—'}</p>
    </div>
  );
}

export function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useSelector(state => state.auth.user);

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentApi.getById(id),
    staleTime: 15_000,
  });

  const commentMutation = useMutation({
    mutationFn: ({ id, message }) => incidentApi.addComment(id, message),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incident', id] }),
  });

  const postMortemMutation = useMutation({
    mutationFn: () => incidentApi.generatePostMortem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incident', id] }),
  });

  const exportPostMortem = () => {
    if (!incident?.postMortem) return;
    const blob = new Blob([incident.postMortem], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postmortem-${incident.incidentId || id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  if (!incident) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Incident introuvable</p>
      </div>
    );
  }

  const assignedUser = incident.assignedTo;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="mt-1 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs text-slate-500 font-mono">{incident.incidentId}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${SEV_STYLE[incident.severity] || ''}`}>
              {incident.severity?.toUpperCase()}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLE[incident.status] || ''}`}>
              {incident.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">{incident.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Metadata */}
        <div className="col-span-1 space-y-4">
          <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-5 space-y-4">
            <Detail label="Projet" value={incident.projectName} />
            <Detail
              label="Détecté"
              value={incident.detectedAt ? new Date(incident.detectedAt).toLocaleString('fr-TN') : ''}
            />
            {incident.resolvedAt && (
              <Detail
                label="Résolu"
                value={new Date(incident.resolvedAt).toLocaleString('fr-TN')}
              />
            )}
            {incident.mttr != null && (
              <Detail label="MTTR" value={`${incident.mttr} min`} />
            )}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Assigné à</p>
              {assignedUser ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {(assignedUser.name || assignedUser.email || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-indigo-300 text-sm">{assignedUser.name || assignedUser.email}</span>
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">Non assigné</p>
              )}
            </div>
          </div>

          {incident.analysis && (
            <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-indigo-400" />
                <p className="text-sm font-semibold text-slate-100">Analyse AI</p>
              </div>
              {incident.analysis.rootCause && (
                <div className="mb-2">
                  <p className="text-xs text-slate-500 mb-1">Cause racine</p>
                  <p className="text-slate-300 text-xs leading-relaxed">{incident.analysis.rootCause}</p>
                </div>
              )}
              {incident.analysis.recommendation && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Recommandation</p>
                  <p className="text-slate-300 text-xs leading-relaxed">{incident.analysis.recommendation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="col-span-2 bg-[#111318] border border-[#1E2130] rounded-xl p-5 flex flex-col" style={{ minHeight: '500px' }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100">Timeline complète</h2>
            <span className="text-xs text-slate-500">({incident.timeline?.length || 0} événements)</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <IncidentTimeline
              timeline={incident.timeline || []}
              incidentId={incident._id}
              onAddComment={(id, message) => commentMutation.mutate({ id, message })}
            />
          </div>
        </div>
      </div>

      {/* Post-mortem */}
      <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100">Post-Mortem Report</h2>
          </div>
          <div className="flex gap-2">
            {incident.postMortem && (
              <button
                onClick={exportPostMortem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#2A2F45] text-slate-400
                  hover:text-slate-200 hover:border-[#3A3F55] rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Exporter (.txt)
              </button>
            )}
            <button
              onClick={() => postMortemMutation.mutate()}
              disabled={postMortemMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500
                disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              {postMortemMutation.isPending
                ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Brain className="w-3.5 h-3.5" />}
              {incident.postMortem ? 'Régénérer' : 'Générer Post-Mortem'}
            </button>
          </div>
        </div>

        {incident.postMortem ? (
          <pre className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed bg-[#0A0B0F] border border-[#1E2130] rounded-lg p-5">
            {incident.postMortem}
          </pre>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm">
            Aucun post-mortem généré. Cliquez sur "Générer Post-Mortem" pour créer un rapport complet.
          </div>
        )}
      </div>
    </div>
  );
}

export default IncidentDetail;
