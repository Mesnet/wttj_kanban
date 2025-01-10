import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { Text } from "@welcome-ui/text"
import { Flex } from "@welcome-ui/flex"
import { Box } from "@welcome-ui/box"

import { Candidate, Column, ColumnState } from "../../types"
import { useJob,
  useUpdateCandidate,
  useColumns,
  useCreateColumn,
  useCandidates,
  useUpdateColumn,
  useDeleteColumn
} from "../../hooks"

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
  const [columnData, setColumnData] = useState<ColumnState>({})
  const [dataInitialized, setDataInitialized] = useState(false)

  const { jobId } = useParams()
  const { job } = useJob(jobId)
  const { columns } = useColumns();

  const createColumn = useCreateColumn()
  const updateColumn = useUpdateColumn()
  const deleteColumn = useDeleteColumn()

  const updateCandidate = useUpdateCandidate()
  const fetchCandidates = useCandidates(setColumnData, columnData);

  // Fetch columns and initialize state
  useEffect(() => {
    if (columns) {
      const initialState = columns.reduce(
        (acc: ColumnState, column: { id: string; name: string }) => {
          acc[column.id] = { items: [], hasMore: true, page: 1, name: column.name };
          return acc;
        },
        {}
      );

      setColumnData(initialState);
    }
  }, [columns]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!jobId || !Object.keys(columnData).length) return

    const ws = new JobWebSocket({
      jobId,
      token: "your-secret-token",
      onCandidateUpdated: (payload) => {
        onCandidateUpdated({ payload, setColumnData })
      },
      onError: (err) => console.error("WebSocket error:", err),
    })

    ws.joinChannel()

    return () => {
      ws.leaveChannel()
      ws.disconnect()
    }
  }, [jobId, columnData])

  useEffect(() => {
    if (!Object.keys(columnData).length || dataInitialized) return

    Object.keys(columnData).forEach((columnId) => {
      fetchCandidatesForColumn(columnId)
    })
    setDataInitialized(true)

  }, [Object.keys(columnData).length])

  // Fetch candidates for a column
  const fetchCandidatesForColumn = (columnId: string) => {
    if (!jobId || !columnData[columnId]?.hasMore) return

    fetchCandidates.mutate({ jobId: jobId, columnId })
  }

  const updateCandidateBackend = (
    jobId: string,
    candidateId: number,
    updates: Partial<Pick<Candidate, "column_id" | "position">>
  ) => {
    updateCandidate.mutate({
      jobId,
      candidateId,
      updates: { candidate: updates },
    })
  }

  const handleCreateColumn = async (columnName: string) => {
    try {
      const column = await createColumn.mutateAsync(columnName);
      setColumnData((prev) => ({
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
      const response = await updateColumn.mutateAsync({
        columnId,
        updates
      })

      setColumnData((prev) => ({
        ...prev,
        [columnId]: { ...prev[columnId], name: response.data.name },
      }))
    } catch (error) {
      console.error("Error updating column:", error)
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await deleteColumn.mutateAsync(columnId)
      const { [columnId]: _, ...rest } = columnData
      setColumnData(rest)
    } catch (error) {
      console.error("Error deleting column:", error)
    }
  }

  const { activeCandidate: dragActiveCandidate, handleDragStart, handleDragEnd } = useDragAndDrop({
    columnData,
    setColumnData,
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
            {Object.keys(columnData).map((columnId) => (
              <SortableContext
                key={columnId}
                items={columnData[columnId]?.items.map((c) => c.id) || []}
              >
                <ColumnShow
                  columnId={columnId}
                  columnName={columnData[columnId].name}
                  candidates={columnData[columnId].items || []}
                  hasMore={columnData[columnId].hasMore}
                  onFetchMore={() => fetchCandidatesForColumn(columnId)}
                  onColumnUpdate={(columnId, updates) => handleUpdateColumn(columnId, updates)}
                  onDeleteColumn={() => handleDeleteColumn(columnId)}
                />
              </SortableContext>
            ))}
            <ColumnNew onAddColumn={handleCreateColumn} />
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
