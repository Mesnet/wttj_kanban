import { Candidate } from "../api"

interface ColumnState {
  [key: string]: {
    items: Candidate[];
    hasMore: boolean;
    page: number;
  };
}

interface OnCandidateUpdatedParams {
  payload: {
    id: number
    position: number
    column_id: string
  }
  setColumns: React.Dispatch<React.SetStateAction<ColumnState>>
}

export const onCandidateUpdated = ({
  payload,
  setColumns,
}: OnCandidateUpdatedParams): void => {
  const { id, position, column_id } = payload

  setColumns((prev) => {
    const updated = { ...prev }
    let fromColumn: string | null = null

    // Find and remove the candidate from the old column
    for (const column of Object.keys(updated)) {
      const candidates = updated[column]?.items || []
      const index = candidates.findIndex((c) => c.id === id)
      if (index !== -1) {
        const [candidate] = candidates.splice(index, 1)
        fromColumn = column
        if (candidate) {
          candidate.column_id = column_id
          candidate.position = position
          updated[column_id].items.splice(position, 0, candidate)
        }
        break
      }
    }

    // Reindex the "from" column
    if (fromColumn && Array.isArray(updated[fromColumn])) {
      updated[fromColumn].items = updated[fromColumn].items.map((candidate, idx) => ({
        ...candidate,
        position: idx,
      }))
    }

    // Reindex the "to" column
    if (Array.isArray(updated[column_id])) {
      updated[column_id].items = updated[column_id].map((candidate, idx) => ({
        ...candidate,
        position: idx,
      }))
    }

    return updated
  })
}
