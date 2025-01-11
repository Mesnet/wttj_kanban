import { Socket, Channel } from "phoenix"

type CandidateUpdatedPayload = {
  id: number
  position: number
  column_id: string
}

type WebSocketConfig = {
  jobId: string
  token: string
  onCandidateUpdated: (payload: CandidateUpdatedPayload) => void
  onError?: (error: any) => void
}

export class JobWebSocket {
  private socket: Socket
  private channel: Channel | null = null

  constructor(private config: WebSocketConfig) {
    this.socket = new Socket("/socket", { params: { token: config.token } })
    this.socket.connect()
  }

  joinChannel() {
    if (this.channel) return

    this.channel = this.socket.channel(`job:${this.config.jobId}`, {})

    this.channel.join()
      .receive("ok", () => console.log(`Joined job:${this.config.jobId} channel successfully`))
      .receive("error", (err: any) => {
        console.error(`Failed to join job:${this.config.jobId} channel`, err)
        if (this.config.onError) this.config.onError(err)
      })

    this.channel.on("candidate_updated", (payload: CandidateUpdatedPayload) => {
      console.log("Real-time update received:", payload)
      this.config.onCandidateUpdated(payload)
    })
  }

  leaveChannel() {
    this.channel?.leave()
    this.channel = null
  }

  disconnect() {
    this.socket.disconnect()
  }
}
