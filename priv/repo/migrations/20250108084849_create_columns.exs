defmodule Wttj.Repo.Migrations.CreateColumns do
  use Ecto.Migration

  def change do
    create table(:columns) do
      add :name, :string, null: false
      timestamps()
    end
  end
end
