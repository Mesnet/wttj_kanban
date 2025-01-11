// onCandidateUpdated.spec.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { onCandidateUpdated } from "./onCandidateUpdated"
import { Candidate } from "../types"

describe("onCandidateUpdated", () => {
  let columnData: Record<
    string,
    { items: Candidate[]; hasMore: boolean; page: number; name: string }
  >
	let setColumnData: ReturnType<typeof vi.fn>

  beforeEach(() => {
    columnData = {
      "1": {
        items: [
          { id: 1, email: "candidate1@test.com", position: 0, column_id: "1" },
          { id: 2, email: "candidate2@test.com", position: 1, column_id: "1" },
        ],
        hasMore: true,
        page: 3,
        name: "New",
      },
      "2": {
        items: [
          { id: 3, email: "candidate3@test.com", position: 0, column_id: "2" },
        ],
        hasMore: true,
        page: 3,
        name: "Interview",
      },
      "3": { items: [], hasMore: true, page: 1, name: "Hired" },
      "4": { items: [], hasMore: true, page: 1, name: "Rejected" },
    }

    // Mock setColumnData to capture the updater function calls
    setColumnData = vi.fn()
  })

  it("moves a candidate from one column to another at the correct position", () => {
    const payload = {
      id: 1,
      position: 1,
      column_id: "2", // Move candidate #1 to column "2" at position 1
    }

    onCandidateUpdated({ payload, setColumnData })

    // We expect setColumnData to have been called exactly once
    expect(setColumnData).toHaveBeenCalledTimes(1)

    // Retrieve the actual update function passed to setColumnData
    const updateFn = setColumnData.mock.calls[0][0]

    // Execute that function with our initial columnData to see the final result
    const updatedcolumnData = updateFn(columnData)

    // Candidate #1 should no longer be in column "1"
    expect(updatedcolumnData["1"].items).toEqual([
      { id: 2, email: "candidate2@test.com", position: 0, column_id: "1" },
    ])

    // Candidate #1 should now appear in column "2" at position 1
    expect(updatedcolumnData["2"].items).toEqual([
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

    onCandidateUpdated({ payload, setColumnData })

    const updateFn = setColumnData.mock.calls[0][0]
    const updatedcolumnData = updateFn(columnData)

    // Column "1" after removal of #2 should have only #1 at position=0
    expect(updatedcolumnData["1"].items).toEqual([
      { id: 1, email: "candidate1@test.com", position: 0, column_id: "1" },
    ])

    // Column "2":
    // Candidate #2 should end up at position=0
    // Candidate #3 reindexed to position=1
    expect(updatedcolumnData["2"].items).toEqual([
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

    onCandidateUpdated({ payload, setColumnData })

    const updateFn = setColumnData.mock.calls[0][0]
    const updatedcolumnData = updateFn(columnData)

    // Column "2" becomes empty
    expect(updatedcolumnData["2"].items).toEqual([])

    // Column "1" now has #3 at position=0, then #1 at position=1, then #2 at position=2
    expect(updatedcolumnData["1"].items).toEqual([
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

    onCandidateUpdated({ payload, setColumnData })

    // If candidate is not found, setColumnData still called but updates do nothing
    expect(setColumnData).toHaveBeenCalledTimes(1)

    const updateFn = setColumnData.mock.calls[0][0]
    const updatedcolumnData = updateFn(columnData)

    // Expect columnData to remain unchanged
    expect(updatedcolumnData).toEqual(columnData)
  })

  it("decreases the page count by one when moving a candidate between columns", () => {
    const payload = {
      id: 1,           // Move candidate #1
      position: 0,     // To the first position
      column_id: "2",  // Moving from column "1" -> "2"
    }

    // Set the initial page to 2 to test the decrement
    columnData["1"].page = 3

    onCandidateUpdated({ payload, setColumnData })

    // Capture the update function
    const updateFn = setColumnData.mock.calls[0][0]
    const updatedColumnData = updateFn(columnData)

    // Assert that the page count decreased by 1
    expect(updatedColumnData["1"].page).toBe(2)
  })

  it("does not change the page count when moving a candidate within the same column", () => {
    const payload = {
      id: 1,           // Move candidate #1
      position: 1,     // Move to position 1 in the same column
      column_id: "1",  // Staying within column "1"
    }

    // Set the initial page to 3 to verify it doesn't change
    columnData["1"].page = 3

    onCandidateUpdated({ payload, setColumnData })

    // Capture the update function
    const updateFn = setColumnData.mock.calls[0][0]
    const updatedColumnData = updateFn(columnData)

    // Assert that the page count did NOT change
    expect(updatedColumnData["1"].page).toBe(3)

    // Assert the candidate was moved within the same column
    expect(updatedColumnData["1"].items).toEqual([
      { id: 2, email: "candidate2@test.com", position: 0, column_id: "1" },
      { id: 1, email: "candidate1@test.com", position: 1, column_id: "1" },
    ])
  })

})
