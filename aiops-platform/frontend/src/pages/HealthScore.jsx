import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Heart } from 'lucide-react';
import { HealthScoreCard } from '../components/health/HealthScoreCard.jsx';
import { ProjectComparison } from '../components/health/ProjectComparison.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { healthApi } from '../api/health.api.js';

export function buildHistory(projects, historyByProject) {
  const weekCount = Math.max(0, ...projects.map(p => (historyByProject[p.projectId] || []).length));
  const weeks = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    const point = { week: `W${weekCount - i}` };
    projects.forEach(p => {
      const entry = (historyByProject[p.projectId] || [])[i];
      if (entry) point[p.projectName] = entry.score;
    });
    weeks.push(point);
  }
  return weeks;
}

export default function HealthScore() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['health-score', 'all'],
    queryFn: () => healthApi.getAllScores(),
    staleTime: 30_000,
  });

  const { data: historyByProject = {} } = useQuery({
    queryKey: ['health-score', 'history', projects.map(p => p.projectId)],
    queryFn: async () => {
      const entries = await Promise.all(
        projects.map(async p => [p.projectId, await healthApi.getHistory(p.projectId)])
      );
      return Object.fromEntries(entries);
    },
    enabled: projects.length > 0,
  });

  const computeAllMutation = useMutation({
    mutationFn: () => healthApi.computeAll(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-score'] }),
  });

  const history = buildHistory(projects, historyByProject);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Project Health Score</h1>
            <p className="text-slate-400 text-sm mt-0.5">Weekly quality and reliability scores per project</p>
          </div>
        </div>
        <button onClick={() => computeAllMutation.mutate()} disabled={computeAllMutation.isPending}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60
            text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all">
          <RefreshCw className={`w-4 h-4 ${computeAllMutation.isPending ? 'animate-spin' : ''}`} />
          Compute All Scores
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : projects.length === 0 ? (
        <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-12 text-center">
          <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-100 font-semibold">No health scores yet</p>
          <p className="text-slate-500 text-sm mt-1">Click "Compute All Scores" to generate scores from pipeline data.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {projects.map(p => <HealthScoreCard key={p.projectId} project={p} />)}
          </div>
          <ProjectComparison projects={projects} history={history} />
        </>
      )}
    </div>
  );
}
