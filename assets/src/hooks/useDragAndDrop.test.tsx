import { renderHook, act } from "@testing-library/react-hooks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useDragAndDrop } from "./useDragAndDrop"
import { Candidate } from "../types"

describe("useDragAndDrop", () => {
  let columnData: Record<string, { items: Candidate[]; hasMore: boolean; page: number; name: string }>
  let setColumnData: ReturnType<typeof vi.fn>
  let updateCandidateBackend: ReturnType<typeof vi.fn>
  let jobId: string

  beforeEach(() => {
    jobId = "1"
    setColumnData = vi.fn()
    updateCandidateBackend = vi.fn()

    columnData = {
      1: {
        items: [
          { id: 1, email: "candidate1@test.com", position: 0, column_id: "1" },
          { id: 2, email: "candidate2@test.com", position: 1, column_id: "1" },
        ],
        hasMore: true,
        page: 1,
        name: "New",
      },
      2: {
        items: [{ id: 3, email: "candidate3@test.com", position: 0, column_id: "1" }],
        hasMore: true,
        page: 1,
        name: "Interview",
      },
      hired: { items: [], hasMore: true, page: 1, name: "Hired" },
      rejected: { items: [], hasMore: true, page: 1, name: "Rejected" },
    }
  })

  it("sets activeCandidate on drag start", () => {
    const { result } = renderHook(() =>
      useDragAndDrop({
        columnData,
        setColumnData,
        updateCandidateBackend,
        jobId,
      })
    )

    act(() => {
      result.current.handleDragStart({
        active: { id: "item_1" },
      })
    })

    expect(result.current.activeCandidate).toEqual({
      id: 1,
      email: "candidate1@test.com",
      position: 0,
      column_id: "1",
    })
  })

  it("does not set activeCandidate for invalid drag start", () => {
    const { result } = renderHook(() =>
      useDragAndDrop({
        columnData,
        setColumnData,
        updateCandidateBackend,
        jobId,
      })
    )

    act(() => {
      result.current.handleDragStart({
        active: { id: "invalid_id" },
      })
    })

    expect(result.current.activeCandidate).toBeNull()
  })

  it("reorders candidates within the same column on drag end", () => {
    const { result } = renderHook(() =>
      useDragAndDrop({
        columnData,
        setColumnData,
        updateCandidateBackend,
        jobId,
      })
    )

    act(() => {
      result.current.handleDragEnd({
        active: { id: "item_1" },
        over: { id: "item_2" },
      })
    })

    expect(setColumnData).toHaveBeenCalledWith(expect.any(Function))
    const updateFn = setColumnData.mock.calls[0][0]
    const newColumns = updateFn(columnData)

    expect(newColumns[1].items).toEqual([
      { id: 2, email: "candidate2@test.com", position: 0, column_id: "1" },
      { id: 1, email: "candidate1@test.com", position: 1, column_id: "1" },
    ])

    expect(updateCandidateBackend).toHaveBeenCalledWith("1", 1, {
      position: 1,
      column_id: "1",
    })
  })

  it("moves candidates between columnData on drag end", () => {
    const { result } = renderHook(() =>
      useDragAndDrop({
        columnData,
        setColumnData,
        updateCandidateBackend,
        jobId,
      })
    )

    act(() => {
      result.current.handleDragEnd({
        active: { id: "item_1" },
        over: { id: "column_2" },
      })
    })

    expect(setColumnData).toHaveBeenCalledWith(expect.any(Function))
    const updateFn = setColumnData.mock.calls[0][0]
    const newColumns = updateFn(columnData)

    expect(newColumns[1].items).toEqual([{ id: 2, email: "candidate2@test.com", position: 0, "column_id": "1" }])
    expect(newColumns[2].items).toEqual([
      { id: 3, email: "candidate3@test.com", position: 0, "column_id": "1" },
      { id: 1, email: "candidate1@test.com", position: 1, "column_id": "1" },
    ])

    expect(updateCandidateBackend).toHaveBeenCalledWith("1", 1, {
      position: 1,
      column_id: "2",
    })
  })

  it("resets activeCandidate after drag end", () => {
    const { result } = renderHook(() =>
      useDragAndDrop({
        columnData,
        setColumnData,
        updateCandidateBackend,
        jobId,
      })
    )

    act(() => {
      result.current.handleDragEnd({
        active: { id: "item_1" },
        over: { id: "item_2" },
      })
    })

    expect(result.current.activeCandidate).toBeNull()
  })

  it("does nothing if over is null", () => {
    const { result } = renderHook(() =>
      useDragAndDrop({
        columnData,
        setColumnData,
        updateCandidateBackend,
        jobId,
      })
    )

    act(() => {
      result.current.handleDragEnd({
        active: { id: "item_1" },
        over: null,
      })
    })

    expect(result.current.activeCandidate).toBeNull()
    expect(setColumnData).not.toHaveBeenCalled()
    expect(updateCandidateBackend).not.toHaveBeenCalled()
  })
})
