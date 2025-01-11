defmodule WttjWeb.ColumnJSON do
  alias Wttj.Columns.Column

  @doc """
  Renders a list of columns.
  """
  def index(%{columns: columns}) do
    %{data: for(column <- columns, do: data(column))}
  end

  @doc """
  Renders a single column.
  """
  def show(%{column: column}) do
    %{data: data(column)}
  end

  defp data(%Column{} = column) do
    %{
      id: column.id,
      name: column.name
    }
  end
end
