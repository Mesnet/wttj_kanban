defmodule WttjWeb.CandidateControllerTest do
  use WttjWeb.ConnCase

  import Wttj.JobsFixtures
  import Wttj.CandidatesFixtures
  import Wttj.ColumnsFixtures

  alias Wttj.Candidates.Candidate

  setup %{conn: conn} do
    job = job_fixture()
    column = column_fixture()
    {:ok, conn: put_req_header(conn, "accept", "application/json"), job: job, column: column}
  end

  describe "index" do
    test "lists all candidates", %{conn: conn, job: job, column: column} do
      conn = get(conn, ~p"/api/jobs/#{job}/candidates?column_id=#{column.id}&page=1")

      assert json_response(conn, 200) == %{
        "results" => [],
        "pagination" => %{
          "total_pages" => 0,
          "total_count" => 0,
          "current_page" => 1
        }
      }
    end
  end

  describe "update candidate" do
    setup [:create_candidate]

    test "renders candidate when data is valid", %{
      conn: conn,
      job: job,
      column: column,
      candidate: %Candidate{id: id} = candidate
    } do
      email = unique_user_email()
      column_id = column.id
      attrs = %{position: 43, column_id: column_id, email: email}

      conn = put(conn, ~p"/api/jobs/#{job}/candidates/#{candidate}", candidate: attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, ~p"/api/jobs/#{job}/candidates/#{id}")

      assert %{
               "id" => ^id,
               "email" => ^email,
               "position" => 43,
               "column_id" => ^column_id
             } = json_response(conn, 200)["data"]
    end

    test "renders errors when data is invalid", %{conn: conn, candidate: candidate, job: job} do
      conn = put(conn, ~p"/api/jobs/#{job}/candidates/#{candidate}", candidate: %{position: nil, column_id: nil, email: nil})
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  defp create_candidate(%{job: job, column: column}) do
    candidate = candidate_fixture(%{job_id: job.id, column_id: column.id})
    %{candidate: candidate}
  end
end
