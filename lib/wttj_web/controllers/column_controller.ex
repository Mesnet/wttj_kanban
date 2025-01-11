defmodule WttjWeb.ColumnController do
  use WttjWeb, :controller

  alias Wttj.Columns
  alias Wttj.Columns.Column

  action_fallback WttjWeb.FallbackController

  def index(conn, _params) do
    columns = Columns.list_columns()
    render(conn, :index, columns: columns)
  end

  def create(conn, %{"column" => column_params}) do
    with {:ok, %Column{} = column} <- Columns.create_column(column_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/columns/#{column}")
      |> render(:show, column: column)
    end
  end

  def show(conn, %{"id" => id}) do
    column = Columns.get_column!(id)
    render(conn, :show, column: column)
  end

  def update(conn, %{"id" => id, "column" => column_params}) do
    column = Columns.get_column!(id)

    with {:ok, %Column{} = column} <- Columns.update_column(column, column_params) do
      render(conn, :show, column: column)
    end
  end

  def delete(conn, %{"id" => id}) do
    column = Columns.get_column!(id)

    with {:ok, %Column{}} <- Columns.delete_column(column) do
      send_resp(conn, :no_content, "")
    end
  end
end
