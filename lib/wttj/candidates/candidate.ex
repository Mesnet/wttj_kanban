defmodule Wttj.Candidates.Candidate do
  use Ecto.Schema
  import Ecto.Changeset

  schema "candidates" do
    field :position, :integer
    field :status, Ecto.Enum, values: [:new, :interview, :rejected, :hired], default: :new
    field :email, :string
    field :job_id, :id

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(candidate, attrs) do
    candidate
    |> cast(attrs, [:email, :status, :position, :job_id])
    |> validate_required([:email, :status, :position, :job_id])
    |> unique_constraint([:job_id, :position, :status],
      name: "candidates_job_id_position_status_index",
      message: "has already been taken"
    )
  end
end
