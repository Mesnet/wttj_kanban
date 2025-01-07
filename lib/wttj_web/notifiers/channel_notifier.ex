defmodule WttjWeb.ChannelNotifier do
  alias WttjWeb.Endpoint

  @doc """
  Broadcasts a candidate update to the `job:{job_id}` channel.
  """
  def broadcast_candidate_update(%{id: id, position: position, status: status, job_id: job_id}) do
    Endpoint.broadcast("job:#{job_id}", "candidate_updated", %{
      id: id,
      position: position,
      status: status
    })
  end
end
