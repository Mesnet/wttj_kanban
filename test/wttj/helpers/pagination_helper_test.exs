defmodule Wttj.PaginationHelperTest do
  use Wttj.DataCase, async: true

  alias Wttj.Helpers.PaginationHelper
  alias Wttj.Candidates.Candidate
  import Wttj.JobsFixtures
  import Wttj.ColumnsFixtures
  import Wttj.CandidatesFixtures

  describe "paginate/3" do
    setup do
      job = job_fixture()
      column = column_fixture()

      # Create 25 candidates for the test
      for i <- 1..25 do
        candidate_fixture(%{job_id: job.id, column_id: column.id, position: i - 1})
      end

      {:ok, job: job, column: column}
    end

    test "paginates results correctly for page 1", %{job: job, column: column} do
      query =
        Candidate
        |> where([c], c.job_id == ^job.id and c.column_id == ^column.id)
        |> order_by([c], asc: c.position)

      result = PaginationHelper.paginate(query, 1, 10)

      assert length(result.results) == 10
      assert result.current_page == 1
      assert result.total_pages == 3
      assert result.total_count == 25

      # Validate first page results
      assert Enum.map(result.results, & &1.position) == Enum.to_list(0..9)
    end

    test "paginates results correctly for page 2", %{job: job, column: column} do
      query =
        Candidate
        |> where([c], c.job_id == ^job.id and c.column_id == ^column.id)
        |> order_by([c], asc: c.position)

      result = PaginationHelper.paginate(query, 2, 10)

      assert length(result.results) == 10
      assert result.current_page == 2
      assert result.total_pages == 3
      assert result.total_count == 25

      # Validate second page results
      assert Enum.map(result.results, & &1.position) == Enum.to_list(10..19)
    end

    test "paginates results correctly for last page", %{job: job, column: column} do
      query =
        Candidate
        |> where([c], c.job_id == ^job.id and c.column_id == ^column.id)
        |> order_by([c], asc: c.position)

      result = PaginationHelper.paginate(query, 3, 10)

      assert length(result.results) == 5
      assert result.current_page == 3
      assert result.total_pages == 3
      assert result.total_count == 25

      # Validate last page results
      assert Enum.map(result.results, & &1.position) == Enum.to_list(20..24)
    end
  end
end
