defmodule Wttj.CandidatesFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Wttj.Candidates` context.
  """
alias Wttj.Candidates.Candidate
alias Wttj.Repo

  def unique_user_email, do: "user#{System.unique_integer()}@example.com"

  @doc """
  Generate a candidate.
  """
  def candidate_fixture(attrs \\ %{}) do
    {:ok, candidate} =
      attrs
      |> Enum.into(%{
        email: unique_user_email(),
        position: next_position(),
      })
      |> Wttj.Candidates.create_candidate()

    candidate
  end

  defp next_position do
    Candidate
    |> Repo.aggregate(:max, :position)
    |> case do
      nil -> 1
      max -> max + 1
    end
  end
end
