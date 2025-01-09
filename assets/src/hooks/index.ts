import { useQuery, useMutation, useInfiniteQuery } from "react-query"
import {
  getCandidates,
  getJob,
  getJobs,
  getColumns,
  createColumn,
  updateCandidate,
  Candidate,
} from "../api"

// Fetch all jobs
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

// Fetch all columns
export const useColumns = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: ["columns"],
    queryFn: getColumns,
  })

  return { isLoading, error, columns: data }
}

// Create a new column
export const useCreateColumn = () => {
  const mutation = useMutation((name: string) => createColumn(name), {
    onError: (error) => {
      console.error('Error creating column:', error)
    },
  })

  return mutation;
}

// Fetch candidates for a specific column with pagination
export const useCandidates = (jobId: string, columnId: string) => {
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading, error } =
    useInfiniteQuery({
      queryKey: ["candidates", jobId, columnId],
      queryFn: ({ pageParam = 1 }) => getCandidates(jobId, columnId, pageParam),
      enabled: !!jobId && !!columnId,
    })

  return {
    candidates: data?.pages.flatMap((page) => page.candidates) || [],
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    error,
  }
}

// Update a candidate
export const useUpdateCandidate = () => {
  const mutation = useMutation({
    mutationFn: ({
      jobId,
      candidateId,
      updates,
    }: {
      jobId: string
      candidateId: number
      updates: { candidate: Partial<Pick<Candidate, "column_id" | "position">> }
    }) => updateCandidate(jobId, candidateId, updates),
    onError: (error) => {
      console.error("Error updating candidate:", error)
    },
  })

  return mutation
}
