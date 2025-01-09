import { useRef } from 'react'
import { Flex } from '@welcome-ui/flex'
import { Box } from '@welcome-ui/box'
import { Text } from '@welcome-ui/text'
import CandidateCard from '../../components/Candidate'
import { Badge } from '@welcome-ui/badge'
import { Candidate } from '../../api'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll' // Import the new hook

type ColumnProps = {
  columnId: string
  columnName: string
  candidates: Candidate[]
  onFetchMore: () => void
  hasMore: boolean
}

function Column({ columnId, columnName, candidates, onFetchMore, hasMore }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: `column_${columnId}` })
  const scrollableRef = useRef<HTMLDivElement>(null)

  useInfiniteScroll({ containerRef: scrollableRef, hasMore, onFetchMore })

  // Merge refs
  const mergedRef = (node: HTMLDivElement) => {
    setNodeRef(node)
    scrollableRef.current = node
  }

  return (
    <Box
      key={columnId}
      border={1}
      backgroundColor="white"
      borderColor="neutral-30"
      borderRadius="md"
      overflow="hidden"
      style={{
				height: "fit-content",
        minWidth: '300px'
			}}
    >
      <Flex
        p={10}
        borderBottom={1}
        borderColor="neutral-30"
        alignItems="center"
        justify="space-between"
      >
        <Text color="black" m={0} textTransform="capitalize">
          {columnName}
        </Text>
        <Badge>
          {`${candidates.length}${hasMore ? '+' : ''}`}
        </Badge>
      </Flex>
      {!candidates.length && (
        <Text color="neutral-500" textAlign="center" pt={10}>
          No candidates yet
        </Text>
      )}
      <SortableContext items={candidates.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <Flex
          ref={mergedRef} // Use the merged ref here
          direction="column"
          p={10}
          pb={0}
          style={{
            height: '100%',
            maxHeight: 'calc(100vh - 205px)',
            overflowY: 'auto',
          }}
        >
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </Flex>
      </SortableContext>
    </Box>
  )
}

export default Column
