defmodule Wttj.Candidates.Candidate do
  use Ecto.Schema
  import Ecto.Changeset

  schema "candidates" do
    field :position, :integer
    field :email, :string
    field :job_id, :id
    belongs_to :column, Wttj.Columns.Column

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(candidate, attrs) do
    candidate
    |> cast(attrs, [:email, :position, :job_id, :column_id])
    |> validate_required([:email, :position, :job_id, :column_id])
    |> unique_constraint([:job_id, :position, :column_id],
      name: "candidates_job_id_position_column_id_index",
      message: "has already been taken"
    )
  end
end
