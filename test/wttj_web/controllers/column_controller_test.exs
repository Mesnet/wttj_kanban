defmodule WttjWeb.ColumnControllerTest do
  use WttjWeb.ConnCase

  import Wttj.ColumnsFixtures

  alias Wttj.Columns.Column

  @create_attrs %{
    name: "some name"
  }
  @update_attrs %{
    name: "some updated name"
  }
  @invalid_attrs %{name: nil}

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all columns", %{conn: conn} do
      conn = get(conn, ~p"/api/columns")
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create column" do
    test "renders column when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/api/columns", column: @create_attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, ~p"/api/columns/#{id}")

      assert %{
               "id" => ^id,
               "name" => "some name"
             } = json_response(conn, 200)["data"]
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/api/columns", column: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update column" do
    setup [:create_column]

    test "renders column when data is valid", %{conn: conn, column: %Column{id: id} = column} do
      conn = put(conn, ~p"/api/columns/#{column}", column: @update_attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, ~p"/api/columns/#{id}")

      assert %{
               "id" => ^id,
               "name" => "some updated name"
             } = json_response(conn, 200)["data"]
    end

    test "renders errors when data is invalid", %{conn: conn, column: column} do
      conn = put(conn, ~p"/api/columns/#{column}", column: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete column" do
    setup [:create_column]

    test "deletes chosen column", %{conn: conn, column: column} do
      conn = delete(conn, ~p"/api/columns/#{column}")
      assert response(conn, 204)

      assert_error_sent 404, fn ->
        get(conn, ~p"/api/columns/#{column}")
      end
    end
  end

  defp create_column(_) do
    column = column_fixture()
    %{column: column}
  end
end
