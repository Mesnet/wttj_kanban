defmodule Wttj.Candidates.CandidateService do
  alias Wttj.Repo
  alias Wttj.Candidates.Candidate
  import Ecto.Query

  @doc """
  Updates a candidate's status and/or position while maintaining consistency
  in the ordering and gap filling for other candidates.
  """
  def update_candidate(%Candidate{} = candidate, attrs) when is_map(attrs) do
    attrs = Enum.into(attrs, %{}, fn {k, v} -> {to_string(k), v} end)

    old_status = candidate.status |> to_string()
    old_position = candidate.position
    job_id = candidate.job_id
    candidate_id = candidate.id

    new_status = Map.get(attrs, "status", old_status) |> to_string()
    new_position = Map.get(attrs, "position", old_position)

    if new_status == "" or is_nil(new_position) do
      {:error, Candidate.changeset(candidate, %{})
      |> Ecto.Changeset.add_error(:base, "Invalid attributes: status or position is nil")}
    else
      Repo.transaction(fn ->
        if candidate_position_has_changed?(old_status, old_position, new_status, new_position) do
          reorder_other_positions(job_id, candidate_id, old_status, old_position, new_status, new_position)
        end

        Candidate
        |> where([c], c.id == ^candidate_id)
        |> Repo.one()
        |> Candidate.changeset(attrs)
        |> Repo.update!()
      end)
    end
  end
  def update_candidate(_, _), do: {:error, "Invalid candidate or attributes"}

  defp candidate_position_has_changed?(old_status, old_position, new_status, new_position) do
    old_status != new_status or old_position != new_position
  end

  defp reorder_other_positions(job_id, candidate_id, old_status, old_position, new_status, new_position) do
    if old_status != new_status do
      move_candidate_to_placeholder(candidate_id)
      fill_gap_in_old_status(job_id, candidate_id, old_status, old_position)
      open_gap_in_new_status(job_id, candidate_id, new_status, new_position)
    else
      move_candidate_to_placeholder(candidate_id)
      reorder_in_same_status(job_id, candidate_id, old_status, old_position, new_position)
    end
  end

  defp move_candidate_to_placeholder(candidate_id) do
    # This is an uniq placeholder to avoid conflicts if multiple candidates are moved at the same time
    unique_placeholder = -(candidate_id)

    Candidate
    |> where([c], c.id == ^candidate_id)
    |> Repo.one()
    |> Candidate.changeset(%{position: unique_placeholder})
    |> Repo.update!()
  end

  defp fill_gap_in_old_status(job_id, candidate_id, old_status, old_position) do
    Candidate
    |> where(job_id: ^job_id)
    |> where([c], c.id != ^candidate_id)
    |> where([c], c.status == ^old_status and c.position > ^old_position)
    |> order_by([c], asc: c.position)
    |> Repo.all()
    |> Enum.each(&decrement_position/1)
  end

  defp decrement_position(candidate) do
    candidate
    |> Candidate.changeset(%{position: candidate.position - 1})
    |> Repo.update!()
  end

  defp open_gap_in_new_status(job_id, candidate_id, new_status, new_position) do
    Candidate
    |> where([c], c.job_id == ^job_id and c.status == ^new_status and c.position >= ^new_position)
    |> where([c], c.id != ^candidate_id)
    |> order_by([c], desc: c.position)
    |> Repo.all()
    |> Enum.each(&increment_position/1)
  end

  defp increment_position(candidate) do
    candidate
    |> Candidate.changeset(%{position: candidate.position + 1})
    |> Repo.update!()
  end

  defp reorder_in_same_status(job_id, candidate_id, status, old_position, new_position) do
    if new_position < old_position do
      reorder_positions(job_id, candidate_id, status, new_position, old_position - 1, 1)
    else
      reorder_positions(job_id, candidate_id, status, old_position + 1, new_position, -1)
    end
  end

  defp reorder_positions(job_id, candidate_id, status, from_position, to_position, shift) do
    order_clause = if shift > 0, do: [desc: :position], else: [asc: :position]

    Candidate
    |> where([c], c.job_id == ^job_id and c.status == ^status and c.position >= ^from_position and c.position <= ^to_position)
    |> where([c], c.id != ^candidate_id)
    |> order_by([c], ^order_clause)
    |> Repo.all()
    |> Enum.each(fn candidate ->
      candidate
      |> Candidate.changeset(%{position: candidate.position + shift})
      |> Repo.update!()
    end)
  end
end
