import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getCandidates, getJob, getJobs, updateCandidate, Candidate } from '../api'

export const useJobs = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  })

  return { isLoading, error, jobs: data }
}

export const useJob = (jobId?: string) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
  })

  return { isLoading, error, job: data }
}

export const useCandidates = (jobId?: string) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['candidates', jobId],
    queryFn: () => getCandidates(jobId),
    enabled: !!jobId,
  })

  return { isLoading, error, candidates: data }
}

export const useUpdateCandidate = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      jobId,
      candidateId,
      updates,
    }: {
      jobId: string;
      candidateId: number;
      updates: { candidate: Partial<Pick<Candidate, 'status' | 'position'>> };
    }) => updateCandidate(jobId, candidateId, updates), // Call updateCandidate with the correct payload structure
    onSuccess: () => {
      queryClient.invalidateQueries(['candidates']); // Invalidate cache to refresh the candidate list
    },
    onError: (error) => {
      console.error('Error updating candidate:', error);
    },
  });

  return mutation;
};
