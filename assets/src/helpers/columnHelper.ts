// columnHelper.ts

import { Column, ColumnState } from "../types"

// Initialize columns with default state
export const initializeColumns = (
  columns: { id: string; name: string }[] | undefined,
  setColumnData: React.Dispatch<React.SetStateAction<ColumnState>>
) => {
  if (columns) {
    const initialState = columns.reduce((acc: ColumnState, column) => {
      acc[column.id] = { items: [], hasMore: true, page: 1, name: column.name }
      return acc
    }, {})
    setColumnData(initialState)
  }
}

// Fetch candidates for a specific column
export const fetchCandidatesForColumn = (
  columnId: string,
  jobId: string | undefined,
  columnData: ColumnState,
  fetchCandidates: any
) => {
  if (!jobId || !columnData[columnId]?.hasMore) return

  fetchCandidates.mutate({ jobId, columnId })
}

// Handle creation of a new column
export const handleCreateColumn = async (
  columnName: string,
  createColumn: any,
  setColumnData: React.Dispatch<React.SetStateAction<ColumnState>>
) => {
  try {
    const column = await createColumn.mutateAsync(columnName)
    setColumnData((prev) => ({
      ...prev,
      [column.id]: { items: [], hasMore: false, page: 1, name: column.name },
    }))
  } catch (error) {
    console.error("Error creating column:", error)
  }
}

// Handle updating an existing column
export const handleUpdateColumn = async (
  columnId: string,
  updates: Partial<Pick<Column, "name">>,
  updateColumn: any,
  setColumnData: React.Dispatch<React.SetStateAction<ColumnState>>
) => {
  try {
    const response = await updateColumn.mutateAsync({ columnId, updates })
    setColumnData((prev) => ({
      ...prev,
      [columnId]: { ...prev[columnId], name: response.data.name },
    }))
  } catch (error) {
    console.error("Error updating column:", error)
  }
}

// Handle deletion of a column
export const handleDeleteColumn = async (
  columnId: string,
  deleteColumn: any,
  setColumnData: React.Dispatch<React.SetStateAction<ColumnState>>,
  columnData: ColumnState
) => {
  try {
    await deleteColumn.mutateAsync(columnId)
    const { [columnId]: _, ...rest } = columnData
    setColumnData(rest)
  } catch (error) {
    console.error("Error deleting column:", error)
  }
}
