defmodule Wttj.CandidatesTest do
  use Wttj.DataCase

  alias Wttj.Candidates
  import Wttj.JobsFixtures
  import Wttj.CandidatesFixtures
  import Wttj.ColumnsFixtures

  setup do
    # Create jobs
    job1 = job_fixture()
    job2 = job_fixture()

    # Create columns using fixtures
    columns = Enum.map(["new", "interview", "rejected", "hired"], fn name ->
      column_fixture(%{name: name})
    end)

    {:ok, job1: job1, job2: job2, columns: columns}
  end

  describe "candidates" do
    alias Wttj.Candidates.Candidate

    @invalid_attrs %{position: nil, column_id: nil, email: nil}

    test "list_candidates/1 returns all candidates for a given job", %{job1: job1, job2: job2, columns: [new_column | _]} do
      candidate1 = candidate_fixture(%{job_id: job1.id, column_id: new_column.id})
      _ = candidate_fixture(%{job_id: job2.id, column_id: new_column.id})

      assert Candidates.list_candidates(job1.id, new_column.id, 1).results == [candidate1]
    end

    test "create_candidate/1 with valid data creates a candidate", %{job1: job1, columns: [new_column | _]} do
      email = unique_user_email()
      valid_attrs = %{email: email, position: 3, job_id: job1.id, column_id: new_column.id}

      assert {:ok, %Candidate{} = candidate} = Candidates.create_candidate(valid_attrs)
      assert candidate.email == email
      assert candidate.column_id == new_column.id
    end

    test "create_candidate/1 with duplicate column_id and position returns error changeset", %{job1: job1, columns: [new_column | _]} do
      candidate_fixture(%{job_id: job1.id, position: 1, column_id: new_column.id})
      duplicate_attrs = %{email: "duplicate@example.com", job_id: job1.id, position: 1, column_id: new_column.id}

      assert {:error, changeset} = Candidates.create_candidate(duplicate_attrs)

      assert changeset.errors[:job_id] ==
               {"has already been taken",
                [constraint: :unique, constraint_name: "candidates_job_id_position_column_id_index"]}
    end

    test "create_candidate/1 allows duplicate positions across different columns", %{job1: job1, columns: [new_column, interview_column | _]} do
      candidate_fixture(%{job_id: job1.id, position: 1, column_id: new_column.id})
      valid_attrs = %{email: "unique@example.com", job_id: job1.id, position: 1, column_id: interview_column.id}

      assert {:ok, %Candidate{}} = Candidates.create_candidate(valid_attrs)
    end

    test "update_candidate/2 with valid data updates the candidate", %{job1: job1, columns: [new_column | _]} do
      candidate = candidate_fixture(%{job_id: job1.id, column_id: new_column.id})
      email = unique_user_email()
      update_attrs = %{position: 43, email: email}

      assert {:ok, %Candidate{} = candidate} =
               Candidates.update_candidate(candidate, update_attrs)

      assert candidate.position == 43
      assert candidate.email == email
    end

    test "update_candidate/2 with duplicate position resolves conflict by reordering", %{job1: job1, columns: [new_column | _]} do
      # Create two candidates in the same column with different positions
      candidate1 = candidate_fixture(%{job_id: job1.id, position: 1, column_id: new_column.id})
      candidate2 = candidate_fixture(%{job_id: job1.id, position: 2, column_id: new_column.id})

      # Attempt to update candidate2 to take candidate1's position
      update_attrs = %{position: 1, column_id: new_column.id} # Conflicts with candidate1's position
      assert {:ok, updated_candidate2} = Candidates.update_candidate(candidate2, update_attrs)

      # Reload both candidates to verify the reordering logic
      reloaded_candidate1 = Candidates.get_candidate!(job1.id, candidate1.id)
      reloaded_candidate2 = Candidates.get_candidate!(job1.id, candidate2.id)

      # Assert that candidate2 successfully moved to position 1
      assert updated_candidate2.position == 1

      # Assert that candidate1 was shifted to avoid a conflict
      assert reloaded_candidate1.position == 2

      # Ensure that the column_id remains unchanged
      assert reloaded_candidate1.column_id == new_column.id
      assert reloaded_candidate2.column_id == new_column.id
    end

    test "update_candidate/2 with invalid data returns error changeset", %{job1: job1, columns: [new_column | _]} do
      candidate = candidate_fixture(%{job_id: job1.id, column_id: new_column.id})
      assert {:error, %Ecto.Changeset{}} = Candidates.update_candidate(candidate, @invalid_attrs)
      assert candidate == Candidates.get_candidate!(job1.id, candidate.id)
    end

    test "change_candidate/1 returns a candidate changeset", %{job1: job1, columns: [new_column | _]} do
      candidate = candidate_fixture(%{job_id: job1.id, column_id: new_column.id})
      assert %Ecto.Changeset{} = Candidates.change_candidate(candidate)
    end
  end
end
