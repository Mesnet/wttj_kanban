defmodule Wttj.ColumnsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Wttj.Columns` context.
  """

  @doc """
  Generate a Column.
  """
  def column_fixture(attrs \\ %{}) do
    {:ok, column} =
      attrs
      |> Enum.into(%{
        name: "New"
      })
      |> Wttj.Columns.create_column()

    column
  end
end
