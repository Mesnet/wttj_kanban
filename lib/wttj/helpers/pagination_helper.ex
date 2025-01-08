defmodule Wttj.Helpers.PaginationHelper do
  import Ecto.Query
  alias Wttj.Repo

  def paginate(query, page \\ 1, page_size \\ 10) do
    page = if is_binary(page), do: String.to_integer(page), else: page
    page_size = if is_binary(page_size), do: String.to_integer(page_size), else: page_size

    offset = (page - 1) * page_size
    total_count = Repo.aggregate(query, :count, :id)
    total_pages = Float.ceil(total_count / page_size) |> trunc()

    results =
      query
      |> limit(^page_size)
      |> offset(^offset)
      |> Repo.all()

    %{
      results: results,
      total_pages: total_pages,
      total_count: total_count,
      current_page: page
    }
  end
end
