import { Job, Column, Candidate } from '../types';

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

export const getColumns = async (): Promise<Column[]> => {
  const response = await fetch(`http://localhost:4000/api/columns`)
  const { data } = await response.json()
  return data
}

export const createColumn = async (name: string): Promise<Column> => {
  const response = await fetch(`http://localhost:4000/api/columns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ column: { name } }),
  })

  if (!response.ok) {
    throw new Error('Failed to create column')
  }

  const { data } = await response.json()
  return data
}

export const updateColumn = async (
  columnId: string,
  updates: Partial<Pick<Column, "name">>
): Promise<Column> => {
  const response = await fetch(`/api/columns/${columnId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ column: updates }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update column with id: ${columnId}`);
  }

  return await response.json()
}

export const deleteColumn = async (columnId: string): Promise<void> => {
  const response = await fetch(`http://localhost:4000/api/columns/${columnId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete column with ID ${columnId}`)
  }
}

// Fetch candidates by column
export const getCandidates = async (
  jobId: string,
  columnId: string,
  page: number
): Promise<{ candidates: Candidate[]; pagination: { total_pages: number; current_page: number } }> => {
  const response = await fetch(
    `/api/jobs/${jobId}/candidates?column_id=${columnId}&page=${page}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch candidates for column ${columnId}`);
  }

  const data = await response.json();

  return {
    candidates: data.results,
    pagination: data.pagination,
  };
};

export const getCandidate = async (jobId?: string, candidateId?: string): Promise<Candidate | null> => {
  if (!jobId || !candidateId) return null
  const response = await fetch(`http://localhost:4000/api/jobs/${jobId}/candidates/${candidateId}`)
  const { data } = await response.json()
  return data
}

// Update candidate
export const updateCandidate = async (
  jobId: string,
  candidateId: number,
  updates: { candidate: Partial<Pick<Candidate, 'column_id' | 'position'>> }
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
  )

  if (!response.ok) {
    throw new Error(`Failed to update candidate with ID ${candidateId}`)
  }

  const { data } = await response.json()
  return data
}
