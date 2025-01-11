import { expect, test } from 'vitest'

import { Candidate } from '../../types'
import { render } from '../../test-utils'
import CandidateCard from '../../components/Candidate'

test('renders candidate email', () => {
  const candidate: Candidate = { id: 10, email: 'test@example.com', position: 1, column_id: '1' }
  const { getByText } = render(<CandidateCard candidate={candidate} />)
  expect(getByText('test@example.com')).toBeInTheDocument()
})
