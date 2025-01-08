{:ok, job} = Wttj.Jobs.create_job(%{name: "Full Stack Developer"})

# Create columns
columns = [
  %{name: "New", job_id: job.id},
  %{name: "Interview", job_id: job.id},
  %{name: "Hired", job_id: job.id},
  %{name: "Rejected", job_id: job.id}
]

# Insert columns and create candidates for each
Enum.each(columns, fn column_attrs ->
  {:ok, column} = Wttj.Columns.create_column(column_attrs)

  # Create 25 candidates for the column
  Enum.each(0..24, fn position ->
    Wttj.Candidates.create_candidate(%{
      job_id: job.id,
      column_id: column.id,
      email: "user#{column.name}_#{position + 1}@wttj.co",
      position: position
    })
  end)
end)
