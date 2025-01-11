defmodule Wttj.ColumnsTest do
  use Wttj.DataCase, async: true

  alias Wttj.Columns
  alias Wttj.Columns.Column

  @valid_attrs %{name: "Some name"}
  @invalid_attrs %{name: nil}

  describe "list_columns/0" do
    test "returns all columns" do
      column = column_fixture()
      assert Columns.list_columns() == [column]
    end
  end

  describe "get_column!/1" do
    test "returns the column with given id" do
      column = column_fixture()
      assert Columns.get_column!(column.id) == column
    end

    test "raises if column does not exist" do
      assert_raise Ecto.NoResultsError, fn ->
        Columns.get_column!(123)
      end
    end
  end

  describe "create_column/1" do
    test "creates a column with valid data" do
      assert {:ok, %Column{} = column} = Columns.create_column(@valid_attrs)
      assert column.name == "Some name"
    end

    test "returns error changeset with invalid data" do
      assert {:error, %Ecto.Changeset{}} = Columns.create_column(@invalid_attrs)
    end
  end

  describe "update_column/2" do
    test "updates the column with valid data" do
      column = column_fixture()
      update_attrs = %{name: "Updated name"}

      assert {:ok, %Column{} = updated_column} = Columns.update_column(column, update_attrs)
      assert updated_column.name == "Updated name"
    end

    test "returns error changeset with invalid data" do
      column = column_fixture()

      assert {:error, %Ecto.Changeset{}} = Columns.update_column(column, @invalid_attrs)
      assert column == Columns.get_column!(column.id)
    end
  end

  describe "delete_column/1" do
    test "deletes the column" do
      column = column_fixture()

      assert {:ok, %Column{}} = Columns.delete_column(column)
      assert_raise Ecto.NoResultsError, fn ->
        Columns.get_column!(column.id)
      end
    end
  end

  # Helper function for creating a column fixture
  defp column_fixture(attrs \\ %{}) do
    {:ok, column} =
      attrs
      |> Enum.into(@valid_attrs)
      |> Columns.create_column()

    column
  end
end
