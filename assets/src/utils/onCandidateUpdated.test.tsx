import { describe, it, expect, beforeEach, vi } from "vitest";
import { onCandidateUpdated } from "./onCandidateUpdated";
import { Candidate } from "../api";

type Statuses = "new" | "interview" | "hired" | "rejected";

describe("onCandidateUpdated", () => {
  let setSortedCandidates: ReturnType<typeof vi.fn>;
  let initialCandidates: Record<string, Candidate[]>;

  beforeEach(() => {
    setSortedCandidates = vi.fn();
    initialCandidates = {
      new: [
        { id: 1, email: "candidate1@test.com", status: "new", position: 0 },
        { id: 2, email: "candidate2@test.com", status: "new", position: 1 },
      ],
      interview: [
        { id: 3, email: "candidate3@test.com", status: "interview", position: 0 },
      ],
      hired: [],
      rejected: [],
    };
  });

  it("moves a candidate within the same column", () => {
    const payload = { id: 1, position: 1, status: "new" as Statuses };

    onCandidateUpdated({ payload, setSortedCandidates });

    // Call the function passed to setSortedCandidates
    expect(setSortedCandidates).toHaveBeenCalledWith(expect.any(Function));

    const updatedState = setSortedCandidates.mock.calls[0][0](initialCandidates);

    expect(updatedState.new).toEqual([
      { id: 2, email: "candidate2@test.com", status: "new", position: 0 },
      { id: 1, email: "candidate1@test.com", status: "new", position: 1 },
    ]);
  });

  it("moves a candidate to a different column", () => {
    const payload = { id: 1, position: 0, status: "interview" as Statuses };

    onCandidateUpdated({ payload, setSortedCandidates });

    expect(setSortedCandidates).toHaveBeenCalledWith(expect.any(Function));

    const updatedState = setSortedCandidates.mock.calls[0][0](initialCandidates);

    expect(updatedState.new).toEqual([
      { id: 2, email: "candidate2@test.com", status: "new", position: 0 },
    ]);
    expect(updatedState.interview).toEqual([
      { id: 1, email: "candidate1@test.com", status: "interview", position: 0 },
      { id: 3, email: "candidate3@test.com", status: "interview", position: 1 },
    ]);
  });

  it("updates the 'from' column when it becomes empty", () => {
    const payload = { id: 3, position: 0, status: "hired" as Statuses };

    onCandidateUpdated({ payload, setSortedCandidates });

    expect(setSortedCandidates).toHaveBeenCalledWith(expect.any(Function));

    const updatedState = setSortedCandidates.mock.calls[0][0](initialCandidates);

    expect(updatedState.interview).toEqual([]);
    expect(updatedState.hired).toEqual([
      { id: 3, email: "candidate3@test.com", status: "hired", position: 0 },
    ]);
  });

  it("reindexes positions in the 'from' and 'to' columns", () => {
    const payload = { id: 2, position: 0, status: "interview" as Statuses };

    onCandidateUpdated({ payload, setSortedCandidates });

    expect(setSortedCandidates).toHaveBeenCalledWith(expect.any(Function));

    const updatedState = setSortedCandidates.mock.calls[0][0](initialCandidates);

    expect(updatedState.new).toEqual([
      { id: 1, email: "candidate1@test.com", status: "new", position: 0 },
    ]);
    expect(updatedState.interview).toEqual([
      { id: 2, email: "candidate2@test.com", status: "interview", position: 0 },
      { id: 3, email: "candidate3@test.com", status: "interview", position: 1 },
    ]);
  });

  it("does not modify state if the candidate is not found", () => {
    const payload = { id: 99, position: 0, status: "new" as Statuses };

    onCandidateUpdated({ payload, setSortedCandidates });

    expect(setSortedCandidates).toHaveBeenCalledWith(expect.any(Function));

    const updatedState = setSortedCandidates.mock.calls[0][0](initialCandidates);

    expect(updatedState).toEqual(initialCandidates);
  });
});
