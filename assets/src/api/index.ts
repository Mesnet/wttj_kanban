type Job = {
  id: string
  name: string
}

export type Candidate = {
  id: number
  email: string
  status: 'new' | 'interview' | 'hired' | 'rejected'
  position: number
}

export const getJobs = async (): Promise<Job[]> => {
  const response = await fetch(`http://localhost:4000/api/jobs`)
  const { data } = await response.json()
  return data
}

export const getJob = async (jobId?: string): Promise<Job | null> => {
  if (!jobId) return null
  const response = await fetch(`http://localhost:4000/api/jobs/${jobId}`)
  const { data } = await response.json()
  return data
}

export const getCandidates = async (jobId?: string): Promise<Candidate[]> => {
  if (!jobId) return []
  const response = await fetch(`http://localhost:4000/api/jobs/${jobId}/candidates`)
  const { data } = await response.json()
  return data
}

/**
 * Updates a candidate's status and position.
 *
 * @param jobId - The ID of the job of the candidate.
 * @param candidateId - The ID of the candidate to update.
 * @param updates - An object containing the updated fields (e.g., status and position).
 * @returns The updated candidate.
 */

export const updateCandidate = async (
  jobId: string,
  candidateId: number,
  updates: { candidate: Partial<Pick<Candidate, 'status' | 'position'>> }
): Promise<Candidate> => {
  const response = await fetch(
    `http://localhost:4000/api/jobs/${jobId}/candidates/${candidateId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates), // Send the "candidate" key in the payload
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update candidate with ID ${candidateId}`);
  }

  const { data } = await response.json();
  return data;
}
