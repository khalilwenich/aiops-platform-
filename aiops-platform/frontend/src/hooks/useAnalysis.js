import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analysisApi } from '../api/analysis.api.js';

export function useRecentAnalyses(params = {}) {
  return useQuery({
    queryKey: ['analyses', 'recent', params],
    queryFn: async () => {
      const res = await analysisApi.getRecent(params);
      return res?.analyses ?? (Array.isArray(res) ? res : []);
    },
    staleTime: 30_000,
  });
}

export function useAnalysisByPipeline(pipelineId) {
  return useQuery({
    queryKey: ['analyses', pipelineId],
    queryFn: () => analysisApi.getByPipeline(pipelineId),
    enabled: !!pipelineId,
  });
}

export function useRecurringIssues() {
  return useQuery({
    queryKey: ['analyses', 'recurring'],
    queryFn: () => analysisApi.getRecurring(),
    staleTime: 60_000,
  });
}

export function useMarkResolved() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => analysisApi.markResolved(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
  });
}
