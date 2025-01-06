import { useEffect } from "react";
import { Socket } from "phoenix";

import { useParams } from 'react-router-dom'
import { useJob, useCandidates, useUpdateCandidate } from '../../hooks'
import { Text } from '@welcome-ui/text'
import { Flex } from '@welcome-ui/flex'
import { Box } from '@welcome-ui/box'
import { useMemo, useState } from 'react'
import { Candidate } from '../../api'
import JobStatus from '../../components/JobStatus'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove } from '@dnd-kit/sortable'

type Statuses = 'new' | 'interview' | 'hired' | 'rejected'
const COLUMNS: Statuses[] = ['new', 'interview', 'hired', 'rejected']

interface SortedCandidates {
  [key: string]: Candidate[]
}

type CandidateUpdatedPayload = {
  id: number;
  position: number;
  status: Statuses;
};

function JobShow() {
  const { jobId } = useParams()
  const { job } = useJob(jobId)
  const { candidates } = useCandidates(jobId)
  const updateCandidate = useUpdateCandidate()
  const [sortedCandidates, setSortedCandidates] = useState<SortedCandidates>({})
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null)

  useEffect(() => {
    if (!jobId) return;

    // Initialize the Phoenix Socket and Channel
    const socket = new Socket("/socket", { params: { token: "your-auth-token" } });
    socket.connect();

    const channel = socket.channel(`job:${jobId}`, {});
    channel.join()
      .receive("ok", () => console.log(`Joined job:${jobId} channel successfully`))
      .receive("error", (err: any) => console.error(`Failed to join job:${jobId} channel`, err));

    // Listen for "candidate_updated" events
    channel.on("candidate_updated", (payload: CandidateUpdatedPayload) => {
      console.log("Real-time update received:", payload);

      const { id, position, status } = payload;

      setSortedCandidates((prev) => {
        // Ensure `prev` is defined and is an object
        if (!prev || typeof prev !== "object") return prev;

        const updated = { ...prev };

        let fromColumn = null;

        // Step 1: Find and remove the candidate from the old column
        for (const column of Object.keys(updated)) {
          const candidates = updated[column] || []; // Ensure the column has a valid array
          const index = candidates.findIndex((c) => c.id === id);
          if (index !== -1) {
            // Remove the candidate from the old column
            const [candidate] = candidates.splice(index, 1);

            // Store the from column for reindexing later
            fromColumn = column;

            // Step 2: Add the candidate to the new column
            if (candidate) {
              candidate.status = status;
              candidate.position = position;
              if (!updated[status]) updated[status] = [];
              updated[status].splice(position, 0, candidate); // Insert at the new position
            }

            break;
          }
        }

        // Step 3: Reorder candidates in the "from" column to fix positions
        if (fromColumn && Array.isArray(updated[fromColumn])) {
          updated[fromColumn] = updated[fromColumn].map((candidate, idx) => ({
            ...candidate,
            position: idx,
          }));
        }

        // Step 4: Reorder candidates in the "to" column to fix positions
        if (Array.isArray(updated[status])) {
          updated[status] = updated[status].map((candidate, idx) => ({
            ...candidate,
            position: idx,
          }));
        }

        return updated;
      });
    });

    return () => {
      channel.leave();
      socket.disconnect();
    };
  }, [jobId]);


  useMemo(() => {
    if (!candidates) return
    const sorted = candidates.reduce<SortedCandidates>((acc, c: Candidate) => {
      acc[c.status] = [...(acc[c.status] || []), c].sort((a, b) => a.position - b.position)
      return acc
    }, {})
    setSortedCandidates(sorted)
  }, [candidates])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string // e.g., 'item_123'

    const [activeElementType, activeElementId] = activeId.split('_')

    if (activeElementType !== 'item') {
      return // Only handle drag starts for items
    }

    // Find the column containing the active item
    const currentColumn = Object.keys(sortedCandidates).find(column =>
      sortedCandidates[column].find(candidate => candidate.id === Number(activeElementId))
    )

    if (currentColumn) {
      const candidate = sortedCandidates[currentColumn].find(c => c.id === Number(activeElementId))
      setActiveCandidate(candidate || null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) {
      setActiveCandidate(null)
      return
    }

    const activeId = active.id as string // e.g., 'item_123'
    const overId = over.id as string // e.g., 'item_456' or 'column_interview'

    const [overElementType, overElementId] = overId.split('_')
    const [activeElementType, activeElementId] = activeId.split('_')

    if (activeElementType !== 'item') {
      setActiveCandidate(null)
      return // Only handle item drag operations
    }

    // Step 1: Identify source and destination columns
    const sourceColumn = findColumnByItemId(Number(activeElementId))
    const destinationColumn = findDestinationColumn(overElementType, overElementId)

    if (!sourceColumn || !destinationColumn) {
      setActiveCandidate(null)
      return // Invalid drag operation
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
    return Object.keys(sortedCandidates).find(column =>
      sortedCandidates[column].find(candidate => candidate.id === itemId)
    )
  }

  const findDestinationColumn = (
    overElementType: string,
    overElementId: string
  ): string | undefined => {
    if (overElementType === 'column') {
      return overElementId // If dropped on a column
    }
    return Object.keys(sortedCandidates).find(column =>
      sortedCandidates[column].find(candidate => candidate.id === Number(overElementId))
    )
  }

  const reindexedItems = (items: Candidate[]): Candidate[] => {
    return items.map((item, index) => ({ ...item, position: index }))
  }

  const handleReorderWithinColumn = (column: string, activeId: number, overId: number) => {
    const items = [...sortedCandidates[column]]
    const activeIndex = items.findIndex(candidate => candidate.id === activeId)
    const overIndex = items.findIndex(candidate => candidate.id === overId)

    const updatedItems = arrayMove(items, activeIndex, overIndex)

    setSortedCandidates({
      ...sortedCandidates,
      [column]: reindexedItems(updatedItems),
    })

    updateCandidateBackend(jobId as string, activeId, {
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
      candidate => candidate.id !== activeId
    )
    const movedItem = sortedCandidates[sourceColumn].find(
      candidate => candidate.id === activeId
    )!
    const destinationItems = [...(sortedCandidates[destinationColumn] || [])]

    let overIndex: number = destinationItems.length // Default to the end of the column

    if (overElementType === 'item') {
      // Dropped above or below another item
      overIndex = destinationItems.findIndex(candidate => candidate.id === overElementId)
      destinationItems.splice(overIndex, 0, movedItem) // Insert at the correct position
    } else {
      // Dropped in an empty column or at the bottom
      destinationItems.push(movedItem)
    }

    setSortedCandidates({
      ...sortedCandidates,
      [sourceColumn]: reindexedItems(sourceItems),
      [destinationColumn]: reindexedItems(destinationItems),
    })

    updateCandidateBackend(jobId as string, activeId, {
      position: overIndex,
      status: destinationColumn as Statuses,
    })
  }

  const updateCandidateBackend = (
    jobId: string,
    candidateId: number,
    updates: Partial<Pick<Candidate, 'status' | 'position'>>
  ) => {
    if (!jobId) {
      console.error('Job ID is undefined. Cannot update candidate.')
      return
    }

    // Call mutate with the correct payload structure
    updateCandidate.mutate({
      jobId,
      candidateId,
      updates: { candidate: updates }, // Wrap updates under the "candidate" key
    })
  }

  return (
    <>
      <Box backgroundColor="neutral-70" p={20} alignItems="center">
        <Text variant="h5" color="white" m={0}>
          {job?.name}
        </Text>
      </Box>
      <Box p={20}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Flex gap={10}>
            {COLUMNS.map(column => (
              <SortableContext key={column} items={sortedCandidates[column]?.map(c => c.id) || []}>
                <JobStatus column={column} candidates={sortedCandidates[column] || []} />
              </SortableContext>
            ))}
          </Flex>
          <DragOverlay>
            {activeCandidate && (
              <div style={{ padding: 10, backgroundColor: 'white', borderRadius: 4 }}>
                {activeCandidate.email}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </Box>
    </>
  )
}

export default JobShow
