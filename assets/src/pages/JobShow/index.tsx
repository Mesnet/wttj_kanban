import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { Text } from "@welcome-ui/text"
import { Flex } from "@welcome-ui/flex"
import { Box } from "@welcome-ui/box"

import { ColumnState } from "../../types"
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

import { DndContext, closestCorners, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext } from "@dnd-kit/sortable"

import { JobWebSocket } from "../../utils/websocket"
import { onCandidateUpdated } from "../../utils/onCandidateUpdated"
import { useDragAndDrop } from "../../hooks/useDragAndDrop"
import { initializeColumns, fetchCandidatesForColumn, handleCreateColumn, handleUpdateColumn, handleDeleteColumn } from "../../helpers/columnHelper"

function JobShow() {
  const [columnData, setColumnData] = useState<ColumnState>({})
  const [dataInitialized, setDataInitialized] = useState(false)

  const { jobId } = useParams()
  const { job } = useJob(jobId)
  const { columns } = useColumns()

  const createColumn = useCreateColumn()
  const updateColumn = useUpdateColumn()
  const deleteColumn = useDeleteColumn()

  const updateCandidate = useUpdateCandidate()
  const fetchCandidates = useCandidates(setColumnData, columnData)

  useEffect(() => {
    initializeColumns(columns, setColumnData)
  }, [columns])

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
      fetchCandidatesForColumn(columnId, jobId, columnData, fetchCandidates)
    })
    setDataInitialized(true)
  }, [Object.keys(columnData).length])

  const { activeCandidate: dragActiveCandidate, handleDragStart, handleDragEnd } = useDragAndDrop({
    columnData,
    setColumnData,
    updateCandidateBackend: (jobId, candidateId, updates) => {
      updateCandidate.mutate({ jobId, candidateId, updates: { candidate: updates } })
    },
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
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Flex gap={10} style={{ overflowX: "auto", overflowY: "hidden", whiteSpace: "nowrap", padding: "10px 0" }}>
            {Object.keys(columnData).map((columnId) => (
              <SortableContext key={columnId} items={columnData[columnId]?.items.map((c) => c.id) || []}>
                <ColumnShow
                  columnId={columnId}
                  columnData={columnData[columnId]}
                  onFetchMore={() => fetchCandidatesForColumn(columnId, jobId, columnData, fetchCandidates)}
                  onColumnUpdate={(columnId, updates) => handleUpdateColumn(columnId, updates, updateColumn, setColumnData)}
                  onDeleteColumn={() => handleDeleteColumn(columnId, deleteColumn, setColumnData, columnData)}
                />
              </SortableContext>
            ))}
            <ColumnNew onAddColumn={(columnName) => handleCreateColumn(columnName, createColumn, setColumnData)} />
          </Flex>
          <DragOverlay>
            {dragActiveCandidate && <CandidateCard candidate={dragActiveCandidate} isOverlay />}
          </DragOverlay>
        </DndContext>
      </Box>
    </>
  )
}

export default JobShow
