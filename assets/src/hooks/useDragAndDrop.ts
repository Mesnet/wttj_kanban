import { useState } from "react"
import { arrayMove } from "@dnd-kit/sortable"
import { Candidate } from "../api"

interface ColumnState {
  [key: string]: {
    items: Candidate[]
    hasMore: boolean
    page: number;
    name: string;
  }
}

interface UseDragAndDropConfig {
  columns: ColumnState
  setColumns: React.Dispatch<React.SetStateAction<ColumnState>>
  updateCandidateBackend: (
    jobId: string,
    candidateId: number,
    updates: Partial<Pick<Candidate, "column_id" | "position">>
  ) => void
  jobId: string
}

export function useDragAndDrop({
  columns,
  setColumns,
  updateCandidateBackend,
  jobId,
}: UseDragAndDropConfig) {
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null)

  const handleDragStart = (event: any) => {
    const { active } = event
    const activeId = active.id as string

    const [activeElementType, activeElementId] = activeId.split("_")

    if (activeElementType !== "item") return

    const currentColumn = Object.keys(columns).find((column) =>
      columns[column].items.find(
        (candidate) => candidate.id === Number(activeElementId)
      )
    )

    if (currentColumn) {
      const candidate = columns[currentColumn].items.find(
        (c) => c.id === Number(activeElementId)
      )
      setActiveCandidate(candidate || null)
    }
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!over) {
      setActiveCandidate(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    const [overElementType, overElementId] = overId.split("_")
    const [activeElementType, activeElementId] = activeId.split("_")

    if (activeElementType !== "item") {
      setActiveCandidate(null)
      return
    }

    const sourceColumn = findColumnByItemId(Number(activeElementId))
    const destinationColumn = findDestinationColumn(
      overElementType,
      overElementId
    )

    if (!sourceColumn || !destinationColumn) {
      setActiveCandidate(null)
      return
    }

    if (sourceColumn === destinationColumn) {
      handleReorderWithinColumn(
        sourceColumn,
        Number(activeElementId),
        Number(overElementId)
      )
    } else {
      handleMoveBetweenColumns(
        sourceColumn,
        destinationColumn,
        Number(activeElementId),
        overElementType,
        Number(overElementId)
      )
    }

    setActiveCandidate(null)
  }

  const findColumnByItemId = (itemId: number): string | undefined => {
    return Object.keys(columns).find((column) =>
      columns[column].items.find((candidate) => candidate.id === itemId)
    )
  }

  const findDestinationColumn = (
    overElementType: string,
    overElementId: string
  ): string | undefined => {
    if (overElementType === "column") return overElementId
    return Object.keys(columns).find((column) =>
      columns[column].items.find(
        (candidate) => candidate.id === Number(overElementId)
      )
    )
  }

  const reindexedItems = (items: Candidate[]): Candidate[] => {
    return items.map((item, index) => ({ ...item, position: index }))
  }

  const handleReorderWithinColumn = (
    column: string,
    activeId: number,
    overId: number
  ) => {
    const items = [...columns[column].items]
    const activeIndex = items.findIndex((candidate) => candidate.id === activeId)
    const overIndex = items.findIndex((candidate) => candidate.id === overId)

    const updatedItems = arrayMove(items, activeIndex, overIndex)

    setColumns((prev) => ({
      ...prev,
      [column]: {
        ...prev[column],
        items: reindexedItems(updatedItems),
      },
    }))

    updateCandidateBackend(jobId, activeId, {
      position: overIndex,
      column_id: column,
    })
  }

  const handleMoveBetweenColumns = (
    sourceColumn: string,
    destinationColumn: string,
    activeId: number,
    overElementType: string,
    overElementId: number
  ) => {
    const sourceItems = columns[sourceColumn].items.filter(
      (candidate) => candidate.id !== activeId
    )
    const movedItem = columns[sourceColumn].items.find(
      (candidate) => candidate.id === activeId
    )!
    const destinationItems = [...columns[destinationColumn].items]

    let overIndex: number = destinationItems.length

    if (overElementType === "item") {
      overIndex = destinationItems.findIndex(
        (candidate) => candidate.id === overElementId
      )
      destinationItems.splice(overIndex, 0, movedItem)
    } else {
      destinationItems.push(movedItem)
    }

    setColumns((prev) => ({
      ...prev,
      [sourceColumn]: {
        ...prev[sourceColumn],
        items: reindexedItems(sourceItems),
      },
      [destinationColumn]: {
        ...prev[destinationColumn],
        items: reindexedItems(destinationItems),
      },
    }))

    updateCandidateBackend(jobId, activeId, {
      position: overIndex,
      column_id: destinationColumn,
    })
  }

  return {
    activeCandidate,
    handleDragStart,
    handleDragEnd,
  }
}
