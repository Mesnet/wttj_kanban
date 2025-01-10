import { useQuery, useMutation } from "react-query"
import { Candidate, ColumnState, Column } from "../types"
import {
  getJob,
  getJobs,
  getColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  getCandidates,
  getCandidate,
  updateCandidate,
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

export const useUpdateColumn = () => {
  return useMutation<
    Column,
    Error,
    { columnId: string; updates: Partial<Pick<Column, "name">> }
  >(
    async ({ columnId, updates }) => {
      return updateColumn(columnId, updates)
    },
    {
      onError: (error) => {
        console.error("Error updating column:", error.message)
      },
    }
  )
}

// Delete a column
export const useDeleteColumn = () => {
  const mutation = useMutation((columnId: string) => deleteColumn(columnId), {
    onError: (error) => {
      console.error('Error deleting column:', error)
    },
  })

  return mutation
}

export const useCandidate = (jobId?: string, candidateId?: string) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => getCandidate(jobId, candidateId),
    enabled: !!candidateId,
  })

  return { isLoading, error, candidate: data }
}


export const useCandidates = (
  setColumnData: React.Dispatch<React.SetStateAction<ColumnState>>,
  columnData: ColumnState
) => {
  return useMutation(
    async ({ jobId, columnId }: { jobId: string; columnId: string }) => {
      const page = columnData[columnId]?.page || 1
      const { candidates, pagination } = await getCandidates(jobId, columnId, page)
      return { columnId, candidates, pagination }
    },
    {
      onSuccess: ({ columnId, candidates, pagination }) => {
        setColumnData((prev) => {
          const existingCandidates = prev[columnId]?.items || []

          // Filter out duplicates based on candidate ID
          const newCandidates = candidates.filter(
            (newCandidate) =>
              !existingCandidates.some(
                (existingCandidate) => existingCandidate.id === newCandidate.id
              )
          )

          return {
            ...prev,
            [columnId]: {
              ...prev[columnId],
              items: [...existingCandidates, ...newCandidates],  // Avoid duplicates
              hasMore: pagination.total_pages > pagination.current_page,
              page: pagination.current_page + 1,
              name: prev[columnId]?.name,
            }
          }
        })
      },
      onError: (error, { columnId }) => {
        console.error(`Error fetching candidates for column ${columnId}:`, error)
      },
    }
  )
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
