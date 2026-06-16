import { User, Star, ExternalLink } from 'lucide-react';

export function TeamMetrics({ report }) {
  const { mostImpactedDev, mostStableProject } = report;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-5 hover:border-[#2A2F45] transition-all">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Most Impacted Developer</h3>
        {mostImpactedDev ? (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-orange-600
              flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {mostImpactedDev.name[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-slate-100 font-semibold text-base">{mostImpactedDev.name}</p>
              <p className="text-slate-400 text-sm mt-1">
                <span className="text-red-400 font-semibold">{mostImpactedDev.count}</span> pipeline failures this week
              </p>
              <button className="mt-3 flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs transition-colors">
                View their pipelines <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-slate-500">
            <User className="w-8 h-8" />
            <p className="text-sm">No failure data this week</p>
          </div>
        )}
      </div>

      <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-5 hover:border-[#2A2F45] transition-all">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Most Stable Project</h3>
        {mostStableProject ? (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600
              flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-100 font-semibold text-base">{mostStableProject.projectName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-emerald-400 font-bold text-lg">{mostStableProject.score}/100</span>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-medium">
                  Grade {mostStableProject.grade}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1">0 critical failures this week</p>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No score data available</p>
        )}
      </div>
    </div>
  );
}
