import { useState } from 'react';
import { Bot, User, CheckCircle, AlertTriangle, MessageSquare, Send } from 'lucide-react';

const ACTION_STYLES = {
  detected:     { icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  assigned:     { icon: User,          color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  comment:      { icon: MessageSquare, color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20' },
  resolved:     { icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  status_update:{ icon: Bot,           color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20' },
};

export function IncidentTimeline({ timeline = [], onAddComment, incidentId }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!comment.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onAddComment?.(incidentId, comment);
      setComment('');
      setLoading(false);
    }, 800);
  };

  const isBot = (actor) => actor === 'AIOps Bot' || actor?.includes('bot');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {[...timeline].reverse().map((entry, i) => {
          const style = ACTION_STYLES[entry.action] || ACTION_STYLES.comment;
          const Icon  = style.icon;
          const bot   = isBot(entry.actor);

          return (
            <div key={i} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} border ${style.border}`}>
                {bot ? <Bot className={`w-4 h-4 ${style.color}`} /> : <User className={`w-4 h-4 ${style.color}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold ${bot ? 'text-indigo-400' : 'text-slate-300'}`}>
                    {entry.actor}
                  </span>
                  <span className="text-xs text-slate-600">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleString('fr-TN') : ''}
                  </span>
                </div>
                <div className={`text-sm text-slate-300 bg-[#1A1D26] rounded-lg px-3 py-2 border ${style.border}`}>
                  {entry.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#1E2130] pt-4">
        <div className="flex gap-2">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add an update to this incident..."
            rows={2}
            className="flex-1 bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-3 py-2
              text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500
              focus:ring-1 focus:ring-indigo-500 resize-none"
          />
          <button onClick={submit} disabled={!comment.trim() || loading}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
              text-white text-sm font-medium px-4 rounded-lg transition-all self-end py-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
