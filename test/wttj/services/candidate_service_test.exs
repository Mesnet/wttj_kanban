defmodule Wttj.Candidates.CandidateServiceTest do
  use Wttj.DataCase, async: false

  alias Wttj.Candidates.{CandidateService, Candidate}
  import Wttj.CandidatesFixtures
  import Wttj.JobsFixtures

  setup do
    # Create a job
    job = job_fixture()

    # Insert candidates with positions 0, 1, and 2
    candidate1 = candidate_fixture(%{job_id: job.id, position: 0, status: :new})
    candidate2 = candidate_fixture(%{job_id: job.id, position: 1, status: :new})
    candidate3 = candidate_fixture(%{job_id: job.id, position: 2, status: :new})

    {:ok, job: job, candidates: [candidate1, candidate2, candidate3]}
  end

  test "moves a candidate from position 1 to position 2", %{candidates: [_, candidate2, _]} do
    attrs = %{position: 2, status: :new}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate2, attrs)

    assert updated_candidate.position == 2
    assert updated_candidate.status == :new

    reordered_positions =
      Candidate
      |> where(job_id: ^candidate2.job_id, status: ^:new)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert reordered_positions == [0, 1, 2]
  end

  test "moves a candidate from position 2 to position 0", %{candidates: [candidate1, _, candidate3]} do
    attrs = %{position: 0, status: :new}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate3, attrs)

    assert updated_candidate.position == 0
    assert updated_candidate.status == :new

    reordered_positions =
      Candidate
      |> where(job_id: ^candidate1.job_id, status: ^:new)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert reordered_positions == [0, 1, 2]
  end

  test "inserts a candidate between two cards in another column", %{candidates: [candidate1, _candidate2, candidate3]} do
    attrs = %{position: 0, status: :interview}
    {:ok, candidate_in_another_column} = CandidateService.update_candidate(candidate3, attrs)

    attrs = %{position: 1, status: :new}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate_in_another_column, attrs)

    assert updated_candidate.position == 1
    assert updated_candidate.status == :new

    new_status_positions =
      Candidate
      |> where(job_id: ^candidate1.job_id, status: ^:new)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert new_status_positions == [0, 1, 2]

    interview_positions =
      Candidate
      |> where(job_id: ^candidate1.job_id, status: ^:interview)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert interview_positions == []
  end

  test "moves a candidate to a different column and sets it to the first position", %{candidates: [_, candidate2, _]} do
    attrs = %{position: 0, status: :interview}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate2, attrs)

    assert updated_candidate.position == 0
    assert updated_candidate.status == :interview

    new_status_positions =
      Candidate
      |> where(job_id: ^candidate2.job_id, status: ^:new)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert new_status_positions == [0, 1]

    interview_positions =
      Candidate
      |> where(job_id: ^candidate2.job_id, status: ^:interview)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert interview_positions == [0]
  end

  test "handles moving a candidate with no changes", %{candidates: [_, candidate2, _]} do
    attrs = %{position: candidate2.position, status: candidate2.status}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate2, attrs)

    assert updated_candidate.position == candidate2.position
    assert updated_candidate.status == candidate2.status

    all_positions =
      Candidate
      |> where(job_id: ^candidate2.job_id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert all_positions == [0, 1, 2]
  end

  test "moves a candidate to a different status column", %{candidates: [_, candidate2, _]} do
    attrs = %{position: 0, status: :interview}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate2, attrs)

    assert updated_candidate.position == 0
    assert updated_candidate.status == :interview

    new_status_positions =
      Candidate
      |> where(job_id: ^candidate2.job_id, status: ^:new)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert new_status_positions == [0, 1]

    interview_positions =
      Candidate
      |> where(job_id: ^candidate2.job_id, status: ^:interview)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert interview_positions == [0]
  end
end
