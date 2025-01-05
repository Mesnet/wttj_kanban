import { useParams } from 'react-router-dom'
import { useJob, useCandidates } from '../../hooks'
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

function JobShow() {
  const { jobId } = useParams()
  const { job } = useJob(jobId)
  const { candidates } = useCandidates(jobId)
  const [sortedCandidates, setSortedCandidates] = useState<SortedCandidates>({})
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null)

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
    const { active } = event;
    const activeId = active.id as string; // e.g., 'item_123'

    const [activeElementType, activeElementId] = activeId.split('_');

    if (activeElementType !== 'item') {
      return; // Only handle drag starts for items
    }

    // Find the column containing the active item
    const currentColumn = Object.keys(sortedCandidates).find(column =>
      sortedCandidates[column].find(candidate => candidate.id === Number(activeElementId))
    );

    if (currentColumn) {
      const candidate = sortedCandidates[currentColumn].find(c => c.id === Number(activeElementId));
      setActiveCandidate(candidate || null);
    }
  };


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveCandidate(null);
      return;
    }

    const activeId = active.id as string; // e.g., 'item_123'
    const overId = over.id as string; // e.g., 'item_456' or 'column_interview'

    const [overElementType, overElementId] = overId.split('_');
    const [activeElementType, activeElementId] = activeId.split('_');

    if (activeElementType !== 'item') {
      setActiveCandidate(null);
      return; // Only handle item drag operations
    }

    // Step 1: Identify source and destination columns
    const sourceColumn = Object.keys(sortedCandidates).find(column =>
      sortedCandidates[column].find(candidate => candidate.id === Number(activeElementId))
    );

    const destinationColumn =
      overElementType === 'column'
        ? overElementId // If dropped on a column
        : Object.keys(sortedCandidates).find(column =>
            sortedCandidates[column].find(candidate => candidate.id === Number(overElementId))
          );

    if (!sourceColumn || !destinationColumn) {
      setActiveCandidate(null);
      return; // Invalid drag operation
    }

    if (sourceColumn === destinationColumn) {
      // Reordering within the same column
      const items = [...sortedCandidates[sourceColumn]];
      const activeIndex = items.findIndex(candidate => candidate.id === Number(activeElementId));
      const overIndex = items.findIndex(candidate => candidate.id === Number(overElementId));

      const updatedItems = arrayMove(items, activeIndex, overIndex);

      // Step 4: Update state only for the source column
      setSortedCandidates({
        ...sortedCandidates,
        [sourceColumn]: updatedItems,
      });
    } else {
      // Moving to a different column

      // Step 2: Remove element from the source column
      const sourceItems = sortedCandidates[sourceColumn].filter(
        candidate => candidate.id !== Number(activeElementId)
      );

      // Step 3: Add element to the destination column
      const movedItem = sortedCandidates[sourceColumn].find(
        candidate => candidate.id === Number(activeElementId)
      )!;
      const destinationItems = [...(sortedCandidates[destinationColumn] || [])];

      if (overElementType === 'item') {
        // Dropped above or below another item
        const overIndex = destinationItems.findIndex(
          candidate => candidate.id === Number(overElementId)
        );
        destinationItems.splice(overIndex, 0, movedItem); // Insert at the correct position
      } else {
        // Dropped in an empty column or at the bottom
        destinationItems.push(movedItem);
      }

      // Step 4: Update state for both columns
      setSortedCandidates({
        ...sortedCandidates,
        [sourceColumn]: sourceItems,
        [destinationColumn]: destinationItems,
      });
    }

    setActiveCandidate(null);
  };



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
