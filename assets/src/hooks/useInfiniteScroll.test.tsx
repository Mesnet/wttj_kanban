import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react-hooks"
import React from "react"
import { useInfiniteScroll } from "./useInfiniteScroll"

describe("useInfiniteScroll", () => {
  let containerRef: React.RefObject<HTMLDivElement>
  let onFetchMore: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onFetchMore = vi.fn()

    // Create a <div> in JSDOM:
    const divEl = document.createElement("div")

    // Mock the scroll properties as writable
    Object.defineProperty(divEl, "scrollHeight", {
      value: 300,
      writable: true,
    })
    Object.defineProperty(divEl, "clientHeight", {
      value: 150,
      writable: true,
    })
    Object.defineProperty(divEl, "scrollTop", {
      value: 0,
      writable: true,
    })

    // Wrap that div in a ref object
    containerRef = {
      current: divEl,
    } as React.RefObject<HTMLDivElement>
  })

  it("does not attach scroll event if hasMore is false", () => {
    const spyAdd = vi.spyOn(containerRef.current!, "addEventListener")

    renderHook(() =>
      useInfiniteScroll({
        containerRef,
        hasMore: false,
        onFetchMore,
      })
    )

    // If hasMore = false, no event listener is attached
    expect(spyAdd).not.toHaveBeenCalled()
  })

  it("attaches a scroll event if hasMore is true", () => {
    const spyAdd = vi.spyOn(containerRef.current!, "addEventListener")

    renderHook(() =>
      useInfiniteScroll({
        containerRef,
        hasMore: true,
        onFetchMore,
      })
    )

    // If hasMore = true, we expect one "scroll" listener
    expect(spyAdd).toHaveBeenCalledWith("scroll", expect.any(Function))
  })

  it("removes the scroll event on unmount", () => {
    const spyRemove = vi.spyOn(containerRef.current!, "removeEventListener")

    const { unmount } = renderHook(() =>
      useInfiniteScroll({
        containerRef,
        hasMore: true,
        onFetchMore,
      })
    )
    unmount()

    expect(spyRemove).toHaveBeenCalledWith("scroll", expect.any(Function))
  })

  it("calls onFetchMore when scrolled exactly to bottom", () => {
    renderHook(() =>
      useInfiniteScroll({
        containerRef,
        hasMore: true,
        onFetchMore,
      })
    )

    // Scroll to the bottom: top + clientHeight = scrollHeight
    act(() => {
      containerRef.current!.scrollTop = 150 // 150 + 150 = 300
      containerRef.current!.dispatchEvent(new Event("scroll"))
    })

    expect(onFetchMore).toHaveBeenCalledTimes(1)
  })

  it("does not call onFetchMore if not at the bottom", () => {
    renderHook(() =>
      useInfiniteScroll({
        containerRef,
        hasMore: true,
        onFetchMore,
      })
    )

    // Partially scroll, top + clientHeight < scrollHeight
    act(() => {
      containerRef.current!.scrollTop = 100 // 100 + 150 = 250 < 300
      containerRef.current!.dispatchEvent(new Event("scroll"))
    })

    expect(onFetchMore).not.toHaveBeenCalled()
  })

  it("does nothing if containerRef.current is null", () => {
    const nullRef = { current: null } as React.RefObject<HTMLDivElement>

    const { unmount } = renderHook(() =>
      useInfiniteScroll({
        containerRef: nullRef,
        hasMore: true,
        onFetchMore,
      })
    )

    // If it didn't crash, success.
    unmount()
    expect(onFetchMore).not.toHaveBeenCalled()
  })
})
