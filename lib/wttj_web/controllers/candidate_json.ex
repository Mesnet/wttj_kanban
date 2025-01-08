defmodule WttjWeb.CandidateJSON do
  alias Wttj.Candidates.Candidate

  @doc """
  Renders a list of candidates.
  """
  def index(%{candidates: %{results: results, total_pages: total_pages, total_count: total_count, current_page: current_page}}) do
    %{
      results: for(candidate <- results, do: data(candidate)),
      pagination: %{
        total_pages: total_pages,
        total_count: total_count,
        current_page: current_page
      }
    }
  end

  @doc """
  Renders a single candidate.
  """
  def show(%{candidate: candidate}) do
    %{data: data(candidate)}
  end

  defp data(%Candidate{} = candidate) do
    %{
      id: candidate.id,
      email: candidate.email,
      column_id: candidate.column_id,
      position: candidate.position
    }
  end
end
