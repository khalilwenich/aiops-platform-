import { useState } from 'react';
import { X, Brain, CheckCircle, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { IncidentTimeline } from './IncidentTimeline.jsx';

export function WarRoomPanel({ incident, onClose, onStatusChange, onAddComment, onPostMortem }) {
  const [loadingStatus, setLoadingStatus]   = useState(null);
  const [loadingPostmortem, setLoadingPostmortem] = useState(false);
  const [showPostmortem, setShowPostmortem] = useState(false);

  const changeStatus = (status) => {
    setLoadingStatus(status);
    setTimeout(() => {
      onStatusChange?.(incident._id || incident.id, status);
      setLoadingStatus(null);
    }, 1200);
  };

  const generatePostmortem = () => {
    setLoadingPostmortem(true);
    setTimeout(() => {
      onPostMortem?.(incident._id || incident.id);
      setLoadingPostmortem(false);
      setShowPostmortem(true);
    }, 2000);
  };

  return (
    <div className="bg-[#111318] border border-[#2A2F45] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2130] bg-[#0D0F14]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-slate-100 font-semibold">{incident.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded font-medium
            ${incident.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
              incident.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
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
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Project</p>
            <p className="text-slate-200 text-sm">{incident.projectName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Detected</p>
            <p className="text-slate-200 text-sm">
              {incident.detectedAt ? new Date(incident.detectedAt).toLocaleString('fr-TN') : '—'}
            </p>
          </div>
          {incident.analysis && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">AI Summary</p>
              <p className="text-slate-300 text-xs leading-relaxed bg-[#1A1D26] rounded-lg p-3">
                {incident.analysis.rootCause || incident.analysis.summary || '—'}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-[#1E2130]">
            {incident.status !== 'investigating' && incident.status !== 'resolved' && (
              <button onClick={() => changeStatus('investigating')} disabled={!!loadingStatus}
                className="flex items-center justify-center gap-2 border border-amber-500/30 text-amber-400
                  hover:bg-amber-500/10 text-sm py-2 rounded-lg transition-all disabled:opacity-60">
                {loadingStatus === 'investigating'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <AlertTriangle className="w-4 h-4" />}
                Mark Investigating
              </button>
            )}
            {incident.status !== 'resolved' && (
              <button onClick={() => changeStatus('resolved')} disabled={!!loadingStatus}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500
                  text-white text-sm py-2 rounded-lg transition-all disabled:opacity-60">
                {loadingStatus === 'resolved'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle className="w-4 h-4" />}
                Mark Resolved
              </button>
            )}
            <button onClick={generatePostmortem} disabled={loadingPostmortem}
              className="flex items-center justify-center gap-2 border border-[#2A2F45] text-slate-400
                hover:text-slate-200 hover:border-[#3A3F55] text-sm py-2 rounded-lg transition-all disabled:opacity-60">
              {loadingPostmortem
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Brain className="w-4 h-4" />}
              Generate Post-Mortem
            </button>
          </div>
        </div>
      </div>

      {(showPostmortem && incident.postMortem) && (
        <div className="border-t border-[#1E2130] p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-indigo-400" />
            <p className="text-slate-100 font-semibold">Post-Mortem Report</p>
          </div>
          <pre className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed bg-[#0A0B0F]
            border border-[#1E2130] rounded-lg p-4">
            {incident.postMortem}
          </pre>
        </div>
      )}
    </div>
  );
}
