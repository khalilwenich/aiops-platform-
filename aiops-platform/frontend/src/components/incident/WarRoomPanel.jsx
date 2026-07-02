import { useState } from 'react';
import { X, Brain, CheckCircle, AlertTriangle, Loader2, FileText, UserCheck, UserX, Eye } from 'lucide-react';
import { IncidentTimeline } from './IncidentTimeline.jsx';

export function WarRoomPanel({ incident, currentUser, onClose, onStatusChange, onAssign, onAddComment, onPostMortem }) {
  const [loadingStatus, setLoadingStatus] = useState(null);
  const [loadingAssign, setLoadingAssign]   = useState(false);
  const [loadingPostmortem, setLoadingPostmortem] = useState(false);
  const [showPostmortem, setShowPostmortem] = useState(!!incident.postMortem);

  const changeStatus = (status) => {
    setLoadingStatus(status);
    onStatusChange?.(incident._id || incident.id, status);
    setTimeout(() => setLoadingStatus(null), 1500);
  };

  const toggleAssign = () => {
    setLoadingAssign(true);
    onAssign?.(incident._id || incident.id);
    setTimeout(() => setLoadingAssign(false), 1000);
  };

  const generatePostmortem = () => {
    setLoadingPostmortem(true);
    onPostMortem?.(incident._id || incident.id);
    setTimeout(() => { setLoadingPostmortem(false); setShowPostmortem(true); }, 2500);
  };

  const assignedUser = incident.assignedTo;
  const isAssignedToMe = assignedUser &&
    (assignedUser._id === currentUser?.id || assignedUser.email === currentUser?.email);

  const statusFlow = {
    open:          { next: 'acknowledged', label: 'Acquitter',        icon: Eye,          color: 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10' },
    acknowledged:  { next: 'investigating', label: 'En investigation', icon: AlertTriangle, color: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' },
    investigating: { next: null,            label: null,               icon: null,          color: '' },
  };
  const nextStep = statusFlow[incident.status];

  return (
    <div className="bg-[#111318] border border-[#2A2F45] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2130] bg-[#0D0F14]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-slate-100 font-semibold">{incident.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded font-medium
            ${incident.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
              incident.severity === 'high'     ? 'bg-orange-500/10 text-orange-400' :
                                                 'bg-amber-500/10 text-amber-400'}`}>
            {incident.severity?.toUpperCase()}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-0">
        {/* Timeline — 3/5 */}
        <div className="col-span-3 p-6 border-r border-[#1E2130] h-96">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-4">Incident Timeline</p>
          <IncidentTimeline
            timeline={incident.timeline || []}
            incidentId={incident._id || incident.id}
            onAddComment={onAddComment}
          />
        </div>

        {/* Details — 2/5 */}
        <div className="col-span-2 p-6 flex flex-col gap-4 overflow-y-auto h-96">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Projet</p>
            <p className="text-slate-200 text-sm">{incident.projectName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Détecté</p>
            <p className="text-slate-200 text-sm">
              {incident.detectedAt ? new Date(incident.detectedAt).toLocaleString('fr-TN') : '—'}
            </p>
          </div>

          {/* Assignee block */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Assigné à</p>
            {assignedUser ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {(assignedUser.name || assignedUser.email || '?')[0].toUpperCase()}
                </div>
                <span className="text-indigo-300 text-sm font-medium">
                  {assignedUser.name || assignedUser.email}
                </span>
                {isAssignedToMe && <span className="text-xs text-slate-500">(moi)</span>}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Non assigné</p>
            )}
          </div>

          {incident.analysis && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Analyse AI</p>
              <p className="text-slate-300 text-xs leading-relaxed bg-[#1A1D26] rounded-lg p-3">
                {incident.analysis.rootCause || incident.analysis.summary || '—'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-[#1E2130]">

            {/* S'assigner / Se désassigner */}
            {incident.status !== 'resolved' && (
              <button
                onClick={toggleAssign}
                disabled={loadingAssign}
                className={`flex items-center justify-center gap-2 border text-sm py-2 rounded-lg transition-all disabled:opacity-60
                  ${isAssignedToMe
                    ? 'border-slate-500/30 text-slate-400 hover:bg-slate-500/10'
                    : 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'}`}
              >
                {loadingAssign
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : isAssignedToMe
                    ? <UserX className="w-4 h-4" />
                    : <UserCheck className="w-4 h-4" />}
                {isAssignedToMe ? 'Me désassigner' : "M'assigner"}
              </button>
            )}

            {/* Acquitter / En investigation */}
            {nextStep?.next && incident.status !== 'resolved' && (
              <button
                onClick={() => changeStatus(nextStep.next)}
                disabled={!!loadingStatus}
                className={`flex items-center justify-center gap-2 border text-sm py-2 rounded-lg transition-all disabled:opacity-60 ${nextStep.color}`}
              >
                {loadingStatus === nextStep.next
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <nextStep.icon className="w-4 h-4" />}
                {nextStep.label}
              </button>
            )}

            {/* Résoudre */}
            {incident.status !== 'resolved' && (
              <button
                onClick={() => changeStatus('resolved')}
                disabled={!!loadingStatus}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm py-2 rounded-lg transition-all disabled:opacity-60"
              >
                {loadingStatus === 'resolved'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle className="w-4 h-4" />}
                Résoudre
              </button>
            )}

            {/* Post-mortem */}
            <button
              onClick={generatePostmortem}
              disabled={loadingPostmortem}
              className="flex items-center justify-center gap-2 border border-[#2A2F45] text-slate-400 hover:text-slate-200 hover:border-[#3A3F55] text-sm py-2 rounded-lg transition-all disabled:opacity-60"
            >
              {loadingPostmortem
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Brain className="w-4 h-4" />}
              {incident.postMortem ? 'Régénérer Post-Mortem' : 'Générer Post-Mortem'}
            </button>
          </div>
        </div>
      </div>

      {/* Post-mortem display */}
      {showPostmortem && incident.postMortem && (
        <div className="border-t border-[#1E2130] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <p className="text-slate-100 font-semibold">Post-Mortem Report</p>
            </div>
            <button onClick={() => setShowPostmortem(false)} className="text-slate-500 hover:text-slate-300 text-xs">
              Masquer
            </button>
          </div>
          <pre className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed bg-[#0A0B0F] border border-[#1E2130] rounded-lg p-4">
            {incident.postMortem}
          </pre>
        </div>
      )}
    </div>
  );
}
