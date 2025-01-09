import { useQuery, useMutation } from "react-query"
import { Candidate, ColumnState } from "../types"
import {
  getCandidates,
  getJob,
  getJobs,
  getColumns,
  createColumn,
  updateCandidate,
  deleteColumn
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

  return mutation
}

export const useCandidates = (
  setColumns: React.Dispatch<React.SetStateAction<ColumnState>>,
  columns: ColumnState
) => {
  return useMutation(
    async ({ jobId, columnId }: { jobId: string; columnId: string }) => {
      const page = columns[columnId]?.page || 1;
      const { candidates, pagination } = await getCandidates(jobId, columnId, page);
      return { columnId, candidates, pagination };
    },
    {
      onSuccess: ({ columnId, candidates, pagination }) => {
        setColumns((prev) => ({
          ...prev,
          [columnId]: {
            ...prev[columnId],
            items: [...(prev[columnId]?.items || []), ...candidates],
            hasMore: pagination.total_pages > pagination.current_page,
            page: pagination.current_page + 1,
            name: prev[columnId]?.name,
          },
        }));
      },
      onError: (error, { columnId }) => {
        console.error(`Error fetching candidates for column ${columnId}:`, error);
      },
    }
  );
};


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
