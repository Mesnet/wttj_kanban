import { Card } from '@welcome-ui/card'
import { Candidate } from '../../api'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CandidateCardProps {
  candidate: Candidate
  isOverlay?: boolean // Add a prop to differentiate between overlay and list
}

function CandidateCard({ candidate, isOverlay }: CandidateCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `item_${candidate.id}`,
  })

  const style = isOverlay
    ? { backgroundColor: "white", borderRadius: 4 }
    : { transform: CSS.Transform.toString(transform), transition }

  return (
    <Card
      ref={isOverlay ? undefined : setNodeRef} // Drag handling only when not in overlay
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      mb={10}
      style={{
        ...style,
        height: "auto",
        minHeight: "50px",
      }}
    >
      <Card.Body>{candidate.email}</Card.Body>
    </Card>
  )
}

export default CandidateCard
