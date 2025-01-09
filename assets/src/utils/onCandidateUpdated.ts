import { ColumnState } from "../types"

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
    for (const column of Object.keys(updated)) {
      const idx = updated[column].items.findIndex((c) => c.id === id)
      if (idx !== -1) {
        fromColumn = column
        const [candidate] = updated[column].items.splice(idx, 1)
        // update candidate props
        candidate.position = position
        candidate.column_id = column_id
        // splice into the “to” column
        updated[column_id].items.splice(position, 0, candidate)
        break
      }
    }

    // 3) Reindex the "from" column
    if (fromColumn) {
      updated[fromColumn].items = updated[fromColumn].items.map((c, i) => ({
        ...c,
        position: i,
      }))
    }

    // 4) Reindex the "to" column
    updated[column_id].items = updated[column_id].items.map((c, i) => ({
      ...c,
      position: i,
    }))

    return updated
  })
}
