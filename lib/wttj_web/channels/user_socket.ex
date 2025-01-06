defmodule WttjWeb.UserSocket do
  use Phoenix.Socket

  ## Channels
  channel "job:*", WttjWeb.JobChannel

  def connect(params, socket, _connect_info) do
    if authorized?(params) do
      {:ok, socket}
    else
      {:error, "unauthorized"}
    end

    {:ok, socket}
  end

  def id(_socket), do: nil

  defp authorized?(params) do
    params["token"] == "your-secret-token"
  end
end
