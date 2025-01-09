// onCandidateUpdated.spec.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { onCandidateUpdated } from "./onCandidateUpdated"
import { Candidate } from "../types"
import React from "react"

describe("onCandidateUpdated", () => {
  let columns: Record<
    string,
    { items: Candidate[]; hasMore: boolean; page: number; name: string }
  >
  let setColumns: React.Dispatch<React.SetStateAction<typeof columns>>

  beforeEach(() => {
    columns = {
      "1": {
        items: [
          { id: 1, email: "candidate1@test.com", position: 0, column_id: "1" },
          { id: 2, email: "candidate2@test.com", position: 1, column_id: "1" },
        ],
        hasMore: true,
        page: 1,
        name: "New",
      },
      "2": {
        items: [
          { id: 3, email: "candidate3@test.com", position: 0, column_id: "2" },
        ],
        hasMore: true,
        page: 1,
        name: "Interview",
      },
      "3": { items: [], hasMore: true, page: 1, name: "Hired" },
      "4": { items: [], hasMore: true, page: 1, name: "Rejected" },
    }

    // Mock setColumns to capture the updater function calls
    setColumns = vi.fn()
  })

  it("moves a candidate from one column to another at the correct position", () => {
    const payload = {
      id: 1,
      position: 1,
      column_id: "2", // Move candidate #1 to column "2" at position 1
    }

    onCandidateUpdated({ payload, setColumns })

    // We expect setColumns to have been called exactly once
    expect(setColumns).toHaveBeenCalledTimes(1)

    // Retrieve the actual update function passed to setColumns
    const updateFn = setColumns.mock.calls[0][0]

    // Execute that function with our initial columns to see the final result
    const updatedColumns = updateFn(columns)

    // Candidate #1 should no longer be in column "1"
    expect(updatedColumns["1"].items).toEqual([
      { id: 2, email: "candidate2@test.com", position: 0, column_id: "1" },
    ])

    // Candidate #1 should now appear in column "2" at position 1
    expect(updatedColumns["2"].items).toEqual([
      { id: 3, email: "candidate3@test.com", position: 0, column_id: "2" },
      { id: 1, email: "candidate1@test.com", position: 1, column_id: "2" },
    ])
  })

  it("reindexes the 'from' column correctly after removal", () => {
    const payload = {
      id: 2,
      position: 0,
      column_id: "2", // Move candidate #2 from column "1" -> column "2" at pos 0
    }

    onCandidateUpdated({ payload, setColumns })

    const updateFn = setColumns.mock.calls[0][0]
    const updatedColumns = updateFn(columns)

    // Column "1" after removal of #2 should have only #1 at position=0
    expect(updatedColumns["1"].items).toEqual([
      { id: 1, email: "candidate1@test.com", position: 0, column_id: "1" },
    ])

    // Column "2":
    // Candidate #2 should end up at position=0
    // Candidate #3 reindexed to position=1
    expect(updatedColumns["2"].items).toEqual([
      { id: 2, email: "candidate2@test.com", position: 0, column_id: "2" },
      { id: 3, email: "candidate3@test.com", position: 1, column_id: "2" },
    ])
  })

  it("reindexes the 'to' column if the candidate moves into it", () => {
    const payload = {
      id: 3,
      position: 0,
      column_id: "1", // Move candidate #3 from column "2" -> column "1" at pos 0
    }

    onCandidateUpdated({ payload, setColumns })

    const updateFn = setColumns.mock.calls[0][0]
    const updatedColumns = updateFn(columns)

    // Column "2" becomes empty
    expect(updatedColumns["2"].items).toEqual([])

    // Column "1" now has #3 at position=0, then #1 at position=1, then #2 at position=2
    expect(updatedColumns["1"].items).toEqual([
      { id: 3, email: "candidate3@test.com", position: 0, column_id: "1" },
      { id: 1, email: "candidate1@test.com", position: 1, column_id: "1" },
      { id: 2, email: "candidate2@test.com", position: 2, column_id: "1" },
    ])
  })

  it("does nothing if the candidate is not found in any column", () => {
    const payload = {
      id: 999,
      position: 0,
      column_id: "1",
    }

    onCandidateUpdated({ payload, setColumns })

    // If candidate is not found, setColumns still called but updates do nothing
    expect(setColumns).toHaveBeenCalledTimes(1)

    const updateFn = setColumns.mock.calls[0][0]
    const updatedColumns = updateFn(columns)

    // Expect columns to remain unchanged
    expect(updatedColumns).toEqual(columns)
  })
})
