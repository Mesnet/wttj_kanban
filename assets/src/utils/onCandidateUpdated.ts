import { Candidate } from "../api"

type Statuses = "new" | "interview" | "hired" | "rejected"

interface SortedCandidates {
  [key: string]: Candidate[]
}

interface OnCandidateUpdatedParams {
  payload: {
    id: number
    position: number
    status: Statuses
  }
  setSortedCandidates: React.Dispatch<React.SetStateAction<SortedCandidates>>
}

export const onCandidateUpdated = ({
  payload,
  setSortedCandidates,
}: OnCandidateUpdatedParams): void => {
  const { id, position, status } = payload

  setSortedCandidates((prev) => {
    const updated = { ...prev }
    let fromColumn: string | null = null

    // Find and remove the candidate from the old column
    for (const column of Object.keys(updated)) {
      const candidates = updated[column] || []
      const index = candidates.findIndex((c) => c.id === id)
      if (index !== -1) {
        const [candidate] = candidates.splice(index, 1)
        fromColumn = column
        if (candidate) {
          candidate.status = status
          candidate.position = position
          if (!updated[status]) updated[status] = []
          updated[status].splice(position, 0, candidate)
        }
        break
      }
    }

    // Reindex the "from" column
    if (fromColumn && Array.isArray(updated[fromColumn])) {
      updated[fromColumn] = updated[fromColumn].map((candidate, idx) => ({
        ...candidate,
        position: idx,
      }))
    }

    // Reindex the "to" column
    if (Array.isArray(updated[status])) {
      updated[status] = updated[status].map((candidate, idx) => ({
        ...candidate,
        position: idx,
      }))
    }

    return updated
  })
}
