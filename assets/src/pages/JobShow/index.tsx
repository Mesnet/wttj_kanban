import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useJob, useUpdateCandidate } from "../../hooks"
import { Text } from "@welcome-ui/text"
import { Flex } from "@welcome-ui/flex"
import { Box } from "@welcome-ui/box"
import { Candidate } from "../../api"
import JobStatus from "../../components/JobStatus"
import CandidateCard from "../../components/Candidate"
import {
  DndContext,
  closestCorners,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext } from "@dnd-kit/sortable"
import { JobWebSocket } from "../../utils/websocket"
import { onCandidateUpdated } from "../../utils/onCandidateUpdated"
import { useDragAndDrop } from "../../hooks/useDragAndDrop"

interface ColumnState {
  [key: string]: {
    items: Candidate[];
    hasMore: boolean;
    page: number;
  };
}

function JobShow() {
  const { jobId } = useParams()
  const { job } = useJob(jobId)
  const updateCandidate = useUpdateCandidate()
  const [columns, setColumns] = useState<ColumnState>({})

  useEffect(() => {
    // Fetch dynamic columns and initialize state
    const fetchColumns = async () => {
      const response = await fetch("/api/columns")
      const { data } = await response.json()
      const initialState = data.reduce((acc: ColumnState, column: { id: string }) => {
        acc[column.id] = { items: [], hasMore: true, page: 1 }
        return acc
      }, {})
      setColumns(initialState)
    }

    fetchColumns()
  }, [])

  useEffect(() => {
    if (!jobId || !columns) return

    const ws = new JobWebSocket({
      jobId,
      token: "your-secret-token",
      onCandidateUpdated: (payload) => {
        onCandidateUpdated({ payload, setColumns })
      },
      onError: (err) => console.error("WebSocket error:", err),
    })

    ws.joinChannel()

    return () => {
      ws.leaveChannel()
      ws.disconnect()
    }
  }, [jobId])

  const updateCandidateBackend = (
    jobId: string,
    candidateId: number,
    updates: Partial<Pick<Candidate, "column_id" | "position">>
  ) => {
    if (!jobId) {
      console.error("Job ID is undefined. Cannot update candidate.")
      return
    }

    updateCandidate.mutate({
      jobId,
      candidateId,
      updates: { candidate: updates },
    })
  }

  const fetchCandidatesForColumn = async (columnId: string) => {
    if (!columns[columnId]?.hasMore) return

    const response = await fetch(
      `/api/jobs/${jobId}/candidates?column_id=${columnId}&page=${columns[columnId].page}`
    )
    const { data, hasMore } = await response.json()

    setColumns((prev) => ({
      ...prev,
      [columnId]: {
        items: [...prev[columnId].items, ...data],
        hasMore,
        page: prev[columnId].page + 1,
      },
    }))
  }

  const { activeCandidate: dragActiveCandidate, handleDragStart, handleDragEnd } = useDragAndDrop({
    columns,
    setColumns,
    updateCandidateBackend,
    jobId: jobId!,
  })

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

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
            {Object.keys(columns).map((columnId) => (
              <SortableContext
                key={columnId}
                items={columns[columnId]?.items.map((c) => c.id) || []}
              >
                <JobStatus
                  column={columnId}
                  candidates={columns[columnId]?.items || []}
                  hasMore={columns[columnId]?.hasMore}
                  onFetchMore={() => fetchCandidatesForColumn(columnId)}
                />
              </SortableContext>
            ))}
          </Flex>
          <DragOverlay>
            {dragActiveCandidate && (
              <CandidateCard candidate={dragActiveCandidate} isOverlay />
            )}
          </DragOverlay>
        </DndContext>
      </Box>
    </>
  )
}

export default JobShow
