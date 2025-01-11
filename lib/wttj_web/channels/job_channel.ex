defmodule WttjWeb.JobChannel do
  use Phoenix.Channel

  def join("job:" <> job_id, _params, socket) do
    {:ok, %{message: "Connected to job #{job_id}"}, assign(socket, :job_id, job_id)}
  end

  def handle_in("update_candidate", %{"id" => id, "position" => position, "column_id" => column_id}, socket) do
    broadcast!(socket, "candidate_updated", %{
      id: id,
      position: position,
      column_id: column_id
    })

    {:noreply, socket}
  end
end
