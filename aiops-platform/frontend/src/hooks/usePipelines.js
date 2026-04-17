import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelinesApi } from '../api/pipelines.api.js';

export function usePipelines(params = {}) {
  return useQuery({
    queryKey: ['pipelines', params],
    queryFn: () => pipelinesApi.getAll(params),
    staleTime: 30_000,
  });
}

export function usePipelineById(id) {
  return useQuery({
    queryKey: ['pipelines', id],
    queryFn: () => pipelinesApi.getById(id),
    enabled: !!id,
  });
}

export function usePipelineStats() {
  return useQuery({
    queryKey: ['pipelines', 'stats'],
    queryFn: () => pipelinesApi.getStats(),
    staleTime: 60_000,
  });
}

export function useRetriggerAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => pipelinesApi.retrigger(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
  });
}
