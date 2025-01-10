defmodule Wttj.Candidates.CandidateService do
  alias Wttj.Repo
  alias Wttj.Candidates.Candidate
  alias WttjWeb.ChannelNotifier
  import Ecto.Query

  @doc """
  Updates a candidate's column and/or position while maintaining consistency
  in the ordering and gap filling for other candidates. Uses a dynamically
  calculated offset to avoid unique constraint conflicts.
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
      result =
        Repo.transaction(fn ->
          # Dynamically calculate a safe offset
          offset = calculate_dynamic_offset(job_id)

          if candidate_position_has_changed?(old_column_id, old_position, new_column_id, new_position) do
            reorder_other_positions(
              job_id,
              candidate_id,
              old_column_id,
              old_position,
              new_column_id,
              new_position,
              offset
            )
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

  # ----------------------------------------------------------------------------
  # Internal helpers
  # ----------------------------------------------------------------------------

  defp normalize_attrs(attrs) do
    Enum.into(attrs, %{}, fn {k, v} -> {to_string(k), v} end)
  end

  defp invalid_attrs_error(candidate) do
    Candidate.changeset(candidate, %{})
    |> Ecto.Changeset.add_error(:base, "Invalid attributes: column_id or position is nil")
  end

  defp candidate_position_has_changed?(old_column_id, old_position, new_column_id, new_position) do
    old_column_id != new_column_id or old_position != new_position
  end

  defp update_candidate_record(candidate_id, attrs) do
    Candidate
    |> where([c], c.id == ^candidate_id)
    |> Repo.one()
    |> Candidate.changeset(attrs)
    |> Repo.update!()
  end

  # ----------------------------------------------------------------------------
  # Dynamic offset calculation to avoid conflicts
  # ----------------------------------------------------------------------------

  defp calculate_dynamic_offset(job_id) do
    # Check if the offset is already cached in the process
    case Process.get({:dynamic_offset, job_id}) do
      nil ->
        # If not cached, calculate it
        max_position_query =
          from(c in Candidate,
            where: c.job_id == ^job_id,
            select: max(c.position)
          )

        max_position = Repo.one(max_position_query) || 0
        offset = max_position + 1_000_000

        # Cache the result for this process
        Process.put({:dynamic_offset, job_id}, offset)
        offset

      cached_offset ->
        # Return the cached value
        cached_offset
    end
  end
  # ----------------------------------------------------------------------------
  # Reordering logic with dynamic offset
  # ----------------------------------------------------------------------------

  defp reorder_other_positions(job_id, candidate_id, old_column_id, old_position, new_column_id, new_position, offset) do
    move_candidate_to_placeholder(candidate_id)

    if old_column_id != new_column_id do
      fill_gap_in_old_column(job_id, candidate_id, old_column_id, old_position, offset)
      open_gap_in_new_column(job_id, candidate_id, new_column_id, new_position, offset)
    else
      reorder_in_same_column(job_id, candidate_id, old_column_id, old_position, new_position, offset)
    end
  end

  defp move_candidate_to_placeholder(candidate_id) do
    unique_placeholder = -(candidate_id)

    Candidate
    |> where([c], c.id == ^candidate_id)
    |> Repo.one()
    |> Candidate.changeset(%{position: unique_placeholder})
    |> Repo.update!()
  end

  # ----------------------------------------------------------------------------
  # Two-phase offset for "fill gap" in the old column
  # ----------------------------------------------------------------------------
  defp fill_gap_in_old_column(job_id, candidate_id, old_column_id, old_position, offset) do
    # Phase 1: Offset affected rows
    from(c in Candidate,
      where: c.job_id == ^job_id,
      where: c.column_id == ^old_column_id,
      where: c.id != ^candidate_id,
      where: c.position > ^old_position,
      update: [inc: [position: ^offset]]
    )
    |> Repo.update_all([])

    # Phase 2: Shift back to final positions
    from(c in Candidate,
      where: c.job_id == ^job_id,
      where: c.column_id == ^old_column_id,
      where: c.id != ^candidate_id,
      where: c.position > ^(old_position + offset),
      update: [inc: [position: -1 - ^offset]]
    )
    |> Repo.update_all([])
  end

  # ----------------------------------------------------------------------------
  # Two-phase offset for "open gap" in the new column
  # ----------------------------------------------------------------------------
  defp open_gap_in_new_column(job_id, candidate_id, new_column_id, new_position, offset) do
    # Phase 1: Offset affected rows
    from(c in Candidate,
      where: c.job_id == ^job_id,
      where: c.column_id == ^new_column_id,
      where: c.id != ^candidate_id,
      where: c.position >= ^new_position,
      update: [inc: [position: ^offset]]
    )
    |> Repo.update_all([])

    # Phase 2: Shift back to final positions
    from(c in Candidate,
      where: c.job_id == ^job_id,
      where: c.column_id == ^new_column_id,
      where: c.id != ^candidate_id,
      where: c.position >= ^(new_position + offset),
      update: [inc: [position: 1 - ^offset]]
    )
    |> Repo.update_all([])
  end

  # ----------------------------------------------------------------------------
  # Reordering within the same column
  # ----------------------------------------------------------------------------

  defp reorder_in_same_column(job_id, candidate_id, column_id, old_position, new_position, offset) do
    if new_position < old_position do
      reorder_positions(job_id, candidate_id, column_id, new_position, old_position - 1, 1, offset)
    else
      reorder_positions(job_id, candidate_id, column_id, old_position + 1, new_position, -1, offset)
    end
  end

  defp reorder_positions(job_id, candidate_id, column_id, from_position, to_position, shift, offset) do
    # Phase 1: Offset affected rows
    from(c in Candidate,
      where: c.job_id == ^job_id,
      where: c.column_id == ^column_id,
      where: c.id != ^candidate_id,
      where: c.position >= ^from_position and c.position <= ^to_position,
      update: [inc: [position: ^offset]]
    )
    |> Repo.update_all([])

    # Phase 2: Shift back into correct positions
    from(c in Candidate,
      where: c.job_id == ^job_id,
      where: c.column_id == ^column_id,
      where: c.id != ^candidate_id,
      where: c.position >= ^(from_position + offset) and c.position <= ^(to_position + offset),
      update: [inc: [position: ^(shift - offset)]]
    )
    |> Repo.update_all([])
  end
end
