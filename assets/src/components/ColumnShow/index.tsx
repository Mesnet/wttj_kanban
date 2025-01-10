import { useRef, useState } from 'react'
import { Flex } from '@welcome-ui/flex'
import { Box } from '@welcome-ui/box'
import { Text } from '@welcome-ui/text'
import { Button } from '@welcome-ui/button'
import { InputText } from '@welcome-ui/input-text'
import { TrashIcon } from '@welcome-ui/icons'
import CandidateCard from '../Candidate'
import { Badge } from '@welcome-ui/badge'
import { Candidate, Column } from '../../types'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll' // Import the new hook

export type ColumnData = {
  name: string
  items: Candidate[]
  hasMore: boolean
  page: number
}

type ColumnProps = {
  columnId: string
  columnData: ColumnData
  onFetchMore: () => void,
  onColumnUpdate: (columnId: string, updates: Partial<Pick<Column, "name">>) => void,
  onDeleteColumn: (columnId: string) => void,
}

function ColumnShow({ columnId, columnData, onFetchMore, onColumnUpdate, onDeleteColumn }: ColumnProps) {
  const { name, items, hasMore, page } = columnData
  const { setNodeRef } = useDroppable({ id: `column_${columnId}` })
  const scrollableRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newColumnName, setNewColumnName] = useState(name)

  useInfiniteScroll({ containerRef: scrollableRef, hasMore, onFetchMore })
  // Merge refs
  const mergedRef = (node: HTMLDivElement) => {
    setNodeRef(node)
    scrollableRef.current = node
  }

  const updateColumnName = () => {
    setIsEditing(false)
    const updates = { name: newColumnName };
    onColumnUpdate(columnId, updates)
  }

  const deleteColumn = () => {
    setIsEditing(false)
    onDeleteColumn(columnId)
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
        {isEditing ? (
          <Box minWidth="100%">
            <InputText
              placeholder="Enter column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              style={{
                marginBottom: "10px"
              }}
            >
            </InputText>

            <Flex justifyContent="space-between">
              <Button onClick={updateColumnName} variant="primary" disabled={!newColumnName.trim() || newColumnName === name}>
                Update
              </Button>
              <Flex>
                <Button onClick={deleteColumn} danger>
                  <TrashIcon />
                </Button>


                <Button onClick={() => { setIsEditing(false); setNewColumnName(name)}} variant="ghost" ml={5}>
                  &times;
                </Button>
              </Flex>

            </Flex>
          </Box>
        ) : (
          <>
            <Text
              onClick={() => setIsEditing(true)}
              style={{ cursor: "pointer" }}
              color="black"
              m={0}
              textTransform="capitalize"

            >
              {name}
            </Text>
            <Badge>
              {`${items.length}${hasMore ? '+' : ''}`}
            </Badge>
          </>
        )}

      </Flex>
      {!items.length && (
        <Text color="neutral-500" textAlign="center" pt={10}>
          No candidates yet
        </Text>
      )}
      <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <Flex
          ref={mergedRef} // Use the merged ref here
          direction="column"
          p={10}
          pb={0}
          style={{
            height: '100%',
            maxHeight: 'calc(100vh - 225px)',
            overflowY: 'auto',
          }}
        >
          {items.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </Flex>
      </SortableContext>
    </Box>
  )
}

export default ColumnShow
