import { Flex } from '@welcome-ui/flex'
import { Box } from '@welcome-ui/box'
import { Text } from '@welcome-ui/text'
import CandidateCard from '../../components/Candidate'
import { Badge } from '@welcome-ui/badge'
import { Candidate } from '../../api'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

type JobStatusProps = {
  column: string
  candidates: Candidate[]
  onFetchMore: () => void
  hasMore: boolean
}

function JobStatus({ column, candidates, onFetchMore, hasMore }: JobStatusProps) {
  const { setNodeRef } = useDroppable({
    id: `column_${column}`,
  })

  return (
    <Box
      key={column}
      w={300}
      border={1}
      backgroundColor="white"
      borderColor="neutral-30"
      borderRadius="md"
      overflow="hidden"
    >
      <Flex
        p={10}
        borderBottom={1}
        borderColor="neutral-30"
        alignItems="center"
        justify="space-between"
      >
        <Text color="black" m={0} textTransform="capitalize">
          {column}
        </Text>
        <Badge>{candidates.length}</Badge>
      </Flex>
      <SortableContext items={candidates.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <Flex ref={setNodeRef} direction="column">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
          {hasMore && (
            <button onClick={onFetchMore}>Load More</button>
          )}
        </Flex>
      </SortableContext>
    </Box>
  )
}

export default JobStatus
