import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useJob, useCandidates, useUpdateCandidate } from "../../hooks"
import { Text } from "@welcome-ui/text"
import { Flex } from "@welcome-ui/flex"
import { Box } from "@welcome-ui/box"
import { Candidate } from "../../api"
import JobStatus from "../../components/JobStatus"
import CandidateCard from "../../components/Candidate"
import { DndContext, closestCorners, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext } from "@dnd-kit/sortable"
import { JobWebSocket } from "../../utils/websocket"
import { useDragAndDrop } from "../../hooks/useDragAndDrop"

type Statuses = "new" | "interview" | "hired" | "rejected"
const COLUMNS: Statuses[] = ["new", "interview", "hired", "rejected"]

interface SortedCandidates {
  [key: string]: Candidate[]
}

function JobShow() {
  const { jobId } = useParams()
  const { job } = useJob(jobId)
  const { candidates } = useCandidates(jobId)
  const updateCandidate = useUpdateCandidate()
  const [sortedCandidates, setSortedCandidates] = useState<SortedCandidates>({})

  useEffect(() => {
    if (!jobId) return

    const ws = new JobWebSocket({
      jobId,
      token: "your-secret-token",
      onCandidateUpdated: (payload) => {
        const { id, position, status } = payload

        setSortedCandidates((prev) => {
          const updated = { ...prev }
          let fromColumn = null

          for (const column of Object.keys(updated)) {
            const candidates = updated[column] || []
            const index = candidates.findIndex((c) => c.id === id)
            if (index !== -1) {
              const [candidate] = candidates.splice(index, 1)
              fromColumn = column
              if (candidate) {
                candidate.status = status as Statuses
                candidate.position = position
                if (!updated[status]) updated[status] = []
                updated[status].splice(position, 0, candidate)
              }
              break
            }
          }

          if (fromColumn && Array.isArray(updated[fromColumn])) {
            updated[fromColumn] = updated[fromColumn].map((candidate, idx) => ({
              ...candidate,
              position: idx,
            }))
          }

          if (Array.isArray(updated[status])) {
            updated[status] = updated[status].map((candidate, idx) => ({
              ...candidate,
              position: idx,
            }))
          }

          return updated
        })
      },
      onError: (err) => console.error("WebSocket error:", err),
    })

    ws.joinChannel()

    return () => {
      ws.leaveChannel()
      ws.disconnect()
    }
  }, [jobId])

  useMemo(() => {
    if (!candidates) return
    const sorted = candidates.reduce<SortedCandidates>((acc, c: Candidate) => {
      acc[c.status] = [...(acc[c.status] || []), c].sort((a, b) => a.position - b.position)
      return acc
    }, {})
    setSortedCandidates(sorted)
  }, [candidates])

  const updateCandidateBackend = (
    jobId: string,
    candidateId: number,
    updates: Partial<Pick<Candidate, "status" | "position">>
  ) => {
    if (!jobId) {
      console.error("Job ID is undefined. Cannot update candidate.")
      return
    }

    updateCandidate.mutate({
      jobId,
      candidateId,
      updates: { candidate: updates }, // Wrap updates under the "candidate" key
    })
  }

  const { activeCandidate: dragActiveCandidate, handleDragStart, handleDragEnd } = useDragAndDrop({
    sortedCandidates,
    setSortedCandidates,
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
            {COLUMNS.map((column) => (
              <SortableContext key={column} items={sortedCandidates[column]?.map((c) => c.id) || []}>
                <JobStatus column={column} candidates={sortedCandidates[column] || []} />
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
