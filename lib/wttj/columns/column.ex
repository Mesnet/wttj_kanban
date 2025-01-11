defmodule Wttj.Columns.Column do
  use Ecto.Schema
  import Ecto.Changeset

  schema "columns" do
    field :name, :string
    has_many :candidates, Wttj.Candidates.Candidate

    timestamps()
  end

  def changeset(column, attrs) do
    column
    |> cast(attrs, [:name])
    |> validate_required([:name])
  end
end
