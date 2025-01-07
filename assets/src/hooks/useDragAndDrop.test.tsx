import { renderHook, act } from "@testing-library/react-hooks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useDragAndDrop } from "./useDragAndDrop"
import { Candidate } from "../api"

describe("useDragAndDrop", () => {
  let sortedCandidates: Record<string, Candidate[]>
  let setSortedCandidates: ReturnType<typeof vi.fn>
  let updateCandidateBackend: ReturnType<typeof vi.fn>
  let jobId: string

  beforeEach(() => {
    jobId = "1"
    setSortedCandidates = vi.fn()
    updateCandidateBackend = vi.fn()

    sortedCandidates = {
      new: [
        { id: 1, email: "candidate1@test.com", status: "new", position: 0 },
        { id: 2, email: "candidate2@test.com", status: "new", position: 1 },
      ],
      interview: [
        { id: 3, email: "candidate3@test.com", status: "interview", position: 0 },
      ],
      hired: [],
      rejected: [],
    }
  })

  it("sets activeCandidate on drag start", () => {
    const { result } = renderHook(() =>
      useDragAndDrop({
        sortedCandidates,
        setSortedCandidates,
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
      status: "new",
      position: 0,
    })
  })

  it("does not set activeCandidate for invalid drag start", () => {
    const { result } = renderHook(() =>
      useDragAndDrop({
        sortedCandidates,
        setSortedCandidates,
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
        sortedCandidates,
        setSortedCandidates,
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

    expect(setSortedCandidates).toHaveBeenCalledWith({
      ...sortedCandidates,
      new: [
        { id: 2, email: "candidate2@test.com", status: "new", position: 0 },
        { id: 1, email: "candidate1@test.com", status: "new", position: 1 },
      ],
    })

    expect(updateCandidateBackend).toHaveBeenCalledWith("1", 1, {
      position: 1,
      status: "new",
    })
  })

  it("resets activeCandidate after drag end", () => {
    const { result } = renderHook(() =>
      useDragAndDrop({
        sortedCandidates,
        setSortedCandidates,
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
        sortedCandidates,
        setSortedCandidates,
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
    expect(setSortedCandidates).not.toHaveBeenCalled()
    expect(updateCandidateBackend).not.toHaveBeenCalled()
  })
})
