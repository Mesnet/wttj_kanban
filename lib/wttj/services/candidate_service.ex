defmodule Wttj.Candidates.CandidateService do
  alias Wttj.Repo
  alias Wttj.Candidates.Candidate
  alias WttjWeb.ChannelNotifier # New module for broadcasting
  import Ecto.Query

  @doc """
  Updates a candidate's column and/or position while maintaining consistency
  in the ordering and gap filling for other candidates.
  """
  def update_candidate(%Candidate{} = candidate, attrs) when is_map(attrs) do
    attrs = normalize_attrs(attrs)

    old_column_id = candidate.column_id
    old_position = candidate.position
    job_id = candidate.job_id
    candidate_id = candidate.id

    new_column_id = Map.get(attrs, "column_id", old_column_id)
    new_position = Map.get(attrs, "position", old_position)

    if is_nil(new_column_id) or is_nil(new_position) do
      {:error, invalid_attrs_error(candidate)}
    else
      result = Repo.transaction(fn ->
        if candidate_position_has_changed?(old_column_id, old_position, new_column_id, new_position) do
          reorder_other_positions(job_id, candidate_id, old_column_id, old_position, new_column_id, new_position)
        end

        update_candidate_record(candidate_id, attrs)
      end)

      case result do
        {:ok, updated_candidate} ->
          ChannelNotifier.broadcast_candidate_update(updated_candidate)
          {:ok, updated_candidate}

        {:error, _reason} = error ->
          error
      end
    end
  end

  def update_candidate(_, _), do: {:error, "Invalid candidate or attributes"}

  defp normalize_attrs(attrs) do
    Enum.into(attrs, %{}, fn {k, v} -> {to_string(k), v} end)
  end

  defp invalid_attrs_error(candidate) do
    Candidate.changeset(candidate, %{})
    |> Ecto.Changeset.add_error(:base, "Invalid attributes: column_id or position is nil")
  end

  defp update_candidate_record(candidate_id, attrs) do
    Candidate
    |> where([c], c.id == ^candidate_id)
    |> Repo.one()
    |> Candidate.changeset(attrs)
    |> Repo.update!()
  end

  defp candidate_position_has_changed?(old_column_id, old_position, new_column_id, new_position) do
    old_column_id != new_column_id or old_position != new_position
  end

  defp reorder_other_positions(job_id, candidate_id, old_column_id, old_position, new_column_id, new_position) do
    if old_column_id != new_column_id do
      move_candidate_to_placeholder(candidate_id)
      fill_gap_in_old_column(job_id, candidate_id, old_column_id, old_position)
      open_gap_in_new_column(job_id, candidate_id, new_column_id, new_position)
    else
      move_candidate_to_placeholder(candidate_id)
      reorder_in_same_column(job_id, candidate_id, old_column_id, old_position, new_position)
    end
  end

  defp move_candidate_to_placeholder(candidate_id) do
    # This is a unique placeholder to avoid conflicts if multiple candidates are moved at the same time
    unique_placeholder = -(candidate_id)

    Candidate
    |> where([c], c.id == ^candidate_id)
    |> Repo.one()
    |> Candidate.changeset(%{position: unique_placeholder})
    |> Repo.update!()
  end

  defp fill_gap_in_old_column(job_id, candidate_id, old_column_id, old_position) do
    Candidate
    |> where(job_id: ^job_id)
    |> where([c], c.id != ^candidate_id)
    |> where([c], c.column_id == ^old_column_id and c.position > ^old_position)
    |> order_by([c], asc: c.position)
    |> Repo.all()
    |> Enum.each(&decrement_position/1)
  end

  defp decrement_position(candidate) do
    candidate
    |> Candidate.changeset(%{position: candidate.position - 1})
    |> Repo.update!()
  end

  defp open_gap_in_new_column(job_id, candidate_id, new_column_id, new_position) do
    Candidate
    |> where([c], c.job_id == ^job_id and c.column_id == ^new_column_id and c.position >= ^new_position)
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

  defp reorder_in_same_column(job_id, candidate_id, column_id, old_position, new_position) do
    if new_position < old_position do
      reorder_positions(job_id, candidate_id, column_id, new_position, old_position - 1, 1)
    else
      reorder_positions(job_id, candidate_id, column_id, old_position + 1, new_position, -1)
    end
  end

  defp reorder_positions(job_id, candidate_id, column_id, from_position, to_position, shift) do
    order_clause = if shift > 0, do: [desc: :position], else: [asc: :position]

    Candidate
    |> where([c], c.job_id == ^job_id and c.column_id == ^column_id and c.position >= ^from_position and c.position <= ^to_position)
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
