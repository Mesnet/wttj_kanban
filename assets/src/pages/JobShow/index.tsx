import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useJob, useUpdateCandidate, useCreateColumn, useCandidates, useUpdateColumn, useDeleteColumn } from "../../hooks"
import { Text } from "@welcome-ui/text"
import { Flex } from "@welcome-ui/flex"
import { Box } from "@welcome-ui/box"
import { Candidate, Column, ColumnState } from "../../types"

import ColumnShow from "../../components/ColumnShow"
import CandidateCard from "../../components/Candidate"
import ColumnNew from "../../components/ColumnNew"
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


function JobShow() {
  const { jobId } = useParams()
  const { job } = useJob(jobId)
  const updateCandidate = useUpdateCandidate()
  const createColumn = useCreateColumn()
  const [columns, setColumns] = useState<ColumnState>({})
  const [columnsFetched, setColumnsFetched] = useState(false)
  const fetchCandidates = useCandidates(setColumns, columns);
  const updateColumn = useUpdateColumn()
  const deleteColumn = useDeleteColumn()

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
    if (!jobId || !columnsFetched) return

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
  const fetchCandidatesForColumn = (columnId: string) => {
    if (!jobId || !columns[columnId]?.hasMore) return

    fetchCandidates.mutate({ jobId: jobId, columnId })
  };

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

  const addColumn = async (columnName: string) => {
    try {
      const column = await createColumn.mutateAsync(columnName);
      setColumns((prev) => ({
        ...prev,
        [column.id]: { items: [], hasMore: false, page: 1, name: column.name },
      }));
    } catch (error) {
      console.error('Error creating column:', error);
    }
  }

  const handleUpdateColumn = async (
    columnId: string,
    updates: Partial<Pick<Column, "name">>
  ) => {
    try {
      const column = await updateColumn.mutateAsync({
        columnId,
        updates
      })

      console.log("Updated column:", column)

      setColumns((prev) => ({
        ...prev,
        [columnId]: { ...prev[columnId], name: column.name },
      }))
    } catch (error) {
      console.error("Error updating column:", error)
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await deleteColumn.mutateAsync(columnId)
      const { [columnId]: _, ...rest } = columns
      setColumns(rest)
    } catch (error) {
      console.error("Error deleting column:", error)
    }
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
          <Flex
            gap={10}
            style={{
              overflowX: "auto",
              overflowY: "hidden",
              whiteSpace: "nowrap",
              padding: "10px 0",
            }}
          >
            {Object.keys(columns).map((columnId) => (
              <SortableContext
                key={columnId}
                items={columns[columnId]?.items.map((c) => c.id) || []}
              >
                <ColumnShow
                  columnId={columnId}
                  columnName={columns[columnId].name}
                  candidates={columns[columnId].items || []}
                  hasMore={columns[columnId].hasMore}
                  onFetchMore={() => fetchCandidatesForColumn(columnId)}
                  onColumnUpdate={(columnId, updates) => handleUpdateColumn(columnId, updates)}
                  onDeleteColumn={() => handleDeleteColumn(columnId)}
                />
              </SortableContext>
            ))}
            <ColumnNew onAddColumn={addColumn} />
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
