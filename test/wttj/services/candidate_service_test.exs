defmodule Wttj.Candidates.CandidateServiceTest do
  use Wttj.DataCase, async: false

  alias Wttj.Candidates.{CandidateService, Candidate}
  import Wttj.CandidatesFixtures
  import Wttj.JobsFixtures
  import Wttj.ColumnsFixtures

  setup do
    # Create a job
    job = job_fixture()

    # Create columns
    column_new = column_fixture(%{name: "New"})
    column_interview = column_fixture(%{name: "Interview"})
    column_hired = column_fixture(%{name: "Hired"})
    column_rejected = column_fixture(%{name: "Rejected"})

    # Insert candidates in the "new" column
    candidate1 = candidate_fixture(%{job_id: job.id, column_id: column_new.id, position: 0})
    candidate2 = candidate_fixture(%{job_id: job.id, column_id: column_new.id, position: 1})
    candidate3 = candidate_fixture(%{job_id: job.id, column_id: column_new.id, position: 2})

    {:ok, job: job, candidates: [candidate1, candidate2, candidate3], columns: %{new: column_new, interview: column_interview, hired: column_hired, rejected: column_rejected}}
  end

  test "moves a candidate from position 1 to position 2 within the same column", %{candidates: [_, candidate2, _], columns: %{new: column_new}} do
    attrs = %{position: 2, column_id: column_new.id}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate2, attrs)

    assert updated_candidate.position == 2
    assert updated_candidate.column_id == column_new.id

    reordered_positions =
      Candidate
      |> where(job_id: ^candidate2.job_id, column_id: ^column_new.id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert reordered_positions == [0, 1, 2]
  end

  test "moves a candidate from position 2 to position 0 within the same column", %{candidates: [candidate1, _, candidate3], columns: %{new: column_new}} do
    attrs = %{position: 0, column_id: column_new.id}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate3, attrs)

    assert updated_candidate.position == 0
    assert updated_candidate.column_id == column_new.id

    reordered_positions =
      Candidate
      |> where(job_id: ^candidate1.job_id, column_id: ^column_new.id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert reordered_positions == [0, 1, 2]
  end

  test "inserts a candidate between two cards in another column", %{candidates: [candidate1, _candidate2, candidate3], columns: %{new: column_new, interview: column_interview}} do
    attrs = %{position: 0, column_id: column_interview.id}
    {:ok, candidate_in_another_column} = CandidateService.update_candidate(candidate3, attrs)

    attrs = %{position: 1, column_id: column_new.id}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate_in_another_column, attrs)

    assert updated_candidate.position == 1
    assert updated_candidate.column_id == column_new.id

    new_column_positions =
      Candidate
      |> where(job_id: ^candidate1.job_id, column_id: ^column_new.id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert new_column_positions == [0, 1, 2]

    interview_positions =
      Candidate
      |> where(job_id: ^candidate1.job_id, column_id: ^column_interview.id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert interview_positions == []
  end

  test "moves a candidate to a different column and sets it to the first position", %{candidates: [_, candidate2, _], columns: %{new: column_new, interview: column_interview}} do
    attrs = %{position: 0, column_id: column_interview.id}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate2, attrs)

    assert updated_candidate.position == 0
    assert updated_candidate.column_id == column_interview.id

    new_column_positions =
      Candidate
      |> where(job_id: ^candidate2.job_id, column_id: ^column_new.id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert new_column_positions == [0, 1]

    interview_positions =
      Candidate
      |> where(job_id: ^candidate2.job_id, column_id: ^column_interview.id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert interview_positions == [0]
  end

  test "handles moving a candidate with no changes", %{candidates: [_, candidate2, _], columns: %{new: column_new}} do
    attrs = %{position: candidate2.position, column_id: candidate2.column_id}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate2, attrs)

    assert updated_candidate.position == candidate2.position
    assert updated_candidate.column_id == column_new.id

    all_positions =
      Candidate
      |> where(job_id: ^candidate2.job_id, column_id: ^column_new.id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert all_positions == [0, 1, 2]
  end

  test "moves a candidate to a different column", %{candidates: [_, candidate1, _], columns: %{new: column_new, interview: column_interview}} do
    attrs = %{position: 0, column_id: column_interview.id}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate1, attrs)

    assert updated_candidate.position == 0
    assert updated_candidate.column_id == column_interview.id

    new_column_positions =
      Candidate
      |> where(job_id: ^candidate1.job_id, column_id: ^column_new.id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert new_column_positions == [0, 1]

    interview_positions =
      Candidate
      |> where(job_id: ^candidate1.job_id, column_id: ^column_interview.id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert interview_positions == [0]
  end

  test "moves candidate from one column to another and reorders positions", %{candidates: [candidate1, candidate2, candidate3], job: job, columns: %{new: column_new, interview: column_interview}} do
    candidate4 = candidate_fixture(%{job_id: job.id, column_id: column_interview.id, position: 0})

    attrs = %{position: 0, column_id: column_new.id}
    {:ok, updated_candidate} = CandidateService.update_candidate(candidate4, attrs)

    assert updated_candidate.position == 0
    assert updated_candidate.column_id == column_new.id

    new_column_positions =
      Candidate
      |> where(job_id: ^job.id, column_id: ^column_new.id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.id)

    assert new_column_positions == [candidate4.id, candidate1.id, candidate2.id, candidate3.id]

    interview_positions =
      Candidate
      |> where(job_id: ^job.id, column_id: ^column_interview.id)
      |> order_by(:position)
      |> Repo.all()
      |> Enum.map(& &1.position)

    assert interview_positions == []
  end
end
