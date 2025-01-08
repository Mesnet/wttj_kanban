defmodule Wttj.Repo.Migrations.UpdateCandidateUniqueConstraint do
  use Ecto.Migration

  def change do
    drop_if_exists index(:candidates, [:job_id, :position, :status], name: "candidates_job_id_position_status_index")
    create unique_index(:candidates, [:job_id, :position, :column_id], name: "candidates_job_id_position_column_id_index")
  end
end
