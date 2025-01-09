import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useJob, useUpdateCandidate } from "../../hooks"
import { Text } from "@welcome-ui/text"
import { Flex } from "@welcome-ui/flex"
import { Box } from "@welcome-ui/box"
import { Candidate } from "../../api"
import Column from "../../components/Column"
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
    items: Candidate[]
    hasMore: boolean
    page: number
    name: string
  }
}

function JobShow() {
  const { jobId } = useParams()
  const { job } = useJob(jobId)
  const updateCandidate = useUpdateCandidate()
  const [columns, setColumns] = useState<ColumnState>({})
  const [columnsFetched, setColumnsFetched] = useState(false)

  // Fetch columns and initialize state
  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const response = await fetch("/api/columns")
        const { data } = await response.json()

        const initialState = data.reduce(
          (acc: ColumnState, column: { id: string, name: string }) => {
            acc[column.id] = { items: [], hasMore: true, page: 1, name: column.name }
            return acc
          },
          {}
        )

        setColumns(initialState)
        setColumnsFetched(true)
      } catch (error) {
        console.error("Error fetching columns:", error)
      }
    }

    fetchColumns()
  }, [])

  // WebSocket for real-time updates
  useEffect(() => {
    if (!jobId || Object.keys(columns).length === 0) return

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
  }, [jobId, columns])

  useEffect(() => {
    if (columnsFetched) {
      Object.keys(columns).forEach((columnId) => {
        fetchCandidatesForColumn(columnId)
      })
    }
  }, [columnsFetched])

  // Fetch candidates for a column
  const fetchCandidatesForColumn = async (columnId: string) => {
    if (!columns[columnId]?.hasMore) return
    try {
      const response = await fetch(
        `/api/jobs/${jobId}/candidates?column_id=${columnId}&page=${columns[columnId].page}`
      )
      const { results, pagination } = await response.json()

      setColumns((prev) => ({
        ...prev,
        [columnId]: {
          items: [...prev[columnId].items, ...results],
          hasMore: pagination.total_pages > pagination.current_page,
          page: pagination.current_page + 1,
          name: prev[columnId].name
        },
      }))
    } catch (error) {
      console.error(`Error fetching candidates for column ${columnId}:`, error)
    }
  }

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
                <Column
                  columnId={columnId}
                  columnName={columns[columnId].name}
                  candidates={columns[columnId].items || []}
                  hasMore={columns[columnId].hasMore}
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
