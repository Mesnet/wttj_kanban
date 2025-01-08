defmodule Wttj.Repo.Migrations.AddColumnIdToCandidates do
  use Ecto.Migration

  def change do
    alter table(:candidates) do
      add :column_id, references(:columns, on_delete: :delete_all), null: false
      remove :status
    end

    create index(:candidates, [:column_id])
  end
end
