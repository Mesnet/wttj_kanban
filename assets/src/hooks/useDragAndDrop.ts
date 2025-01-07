import { useState } from "react"
import { arrayMove } from "@dnd-kit/sortable"
import { Candidate } from "../api"

type Statuses = "new" | "interview" | "hired" | "rejected"

interface SortedCandidates {
  [key: string]: Candidate[]
}

interface UseDragAndDropConfig {
  sortedCandidates: SortedCandidates
  setSortedCandidates: React.Dispatch<React.SetStateAction<SortedCandidates>>
  updateCandidateBackend: (
    jobId: string,
    candidateId: number,
    updates: Partial<Pick<Candidate, "status" | "position">>
  ) => void
  jobId: string
}

export function useDragAndDrop({
  sortedCandidates,
  setSortedCandidates,
  updateCandidateBackend,
  jobId,
}: UseDragAndDropConfig) {
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null)

  const handleDragStart = (event: any) => {
    const { active } = event
    const activeId = active.id as string

    const [activeElementType, activeElementId] = activeId.split("_")

    if (activeElementType !== "item") return

    const currentColumn = Object.keys(sortedCandidates).find((column) =>
      sortedCandidates[column].find((candidate) => candidate.id === Number(activeElementId))
    )

    if (currentColumn) {
      const candidate = sortedCandidates[currentColumn].find(
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
    const destinationColumn = findDestinationColumn(overElementType, overElementId)

    if (!sourceColumn || !destinationColumn) {
      setActiveCandidate(null)
      return
    }

    if (sourceColumn === destinationColumn) {
      handleReorderWithinColumn(sourceColumn, Number(activeElementId), Number(overElementId))
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
    return Object.keys(sortedCandidates).find((column) =>
      sortedCandidates[column].find((candidate) => candidate.id === itemId)
    )
  }

  const findDestinationColumn = (
    overElementType: string,
    overElementId: string
  ): string | undefined => {
    if (overElementType === "column") return overElementId
    return Object.keys(sortedCandidates).find((column) =>
      sortedCandidates[column].find((candidate) => candidate.id === Number(overElementId))
    )
  }

  const reindexedItems = (items: Candidate[]): Candidate[] => {
    return items.map((item, index) => ({ ...item, position: index }))
  }

  const handleReorderWithinColumn = (column: string, activeId: number, overId: number) => {
    const items = [...sortedCandidates[column]]
    const activeIndex = items.findIndex((candidate) => candidate.id === activeId)
    const overIndex = items.findIndex((candidate) => candidate.id === overId)

    const updatedItems = arrayMove(items, activeIndex, overIndex)

    setSortedCandidates({
      ...sortedCandidates,
      [column]: reindexedItems(updatedItems),
    })

    updateCandidateBackend(jobId, activeId, {
      position: overIndex,
      status: column as Statuses,
    })
  }

  const handleMoveBetweenColumns = (
    sourceColumn: string,
    destinationColumn: string,
    activeId: number,
    overElementType: string,
    overElementId: number
  ) => {
    const sourceItems = sortedCandidates[sourceColumn].filter(
      (candidate) => candidate.id !== activeId
    )
    const movedItem = sortedCandidates[sourceColumn].find(
      (candidate) => candidate.id === activeId
    )!
    const destinationItems = [...(sortedCandidates[destinationColumn] || [])]

    let overIndex: number = destinationItems.length

    if (overElementType === "item") {
      overIndex = destinationItems.findIndex((candidate) => candidate.id === overElementId)
      destinationItems.splice(overIndex, 0, movedItem)
    } else {
      destinationItems.push(movedItem)
    }

    setSortedCandidates({
      ...sortedCandidates,
      [sourceColumn]: reindexedItems(sourceItems),
      [destinationColumn]: reindexedItems(destinationItems),
    })

    updateCandidateBackend(jobId, activeId, {
      position: overIndex,
      status: destinationColumn as Statuses,
    })
  }

  return {
    activeCandidate,
    handleDragStart,
    handleDragEnd,
  }
}
