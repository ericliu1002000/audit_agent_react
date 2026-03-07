export type WsConnectionStatus = "idle" | "connecting" | "open" | "closing" | "closed"

export type WsMessage<T = unknown> = {
  type: string
  payload?: T
  timestamp?: number
}

export type WsConfig = {
  url: string
  protocols?: string | string[]
  heartbeatIntervalMs: number
  reconnectIntervalMs: number
  maxReconnectAttempts: number
  heartbeatMessage: string | WsMessage
}

export type WsTypedHandler = (message: WsMessage, event: MessageEvent) => void
export type WsAnyHandler = (params: { raw: MessageEvent["data"]; parsed: WsMessage | null; event: MessageEvent }) => void

const defaultWsConfig = (): WsConfig => ({
  url: import.meta.env.VITE_WS_BASE_URL || "",
  heartbeatIntervalMs: 30000,
  reconnectIntervalMs: 5000,
  maxReconnectAttempts: Infinity,
  heartbeatMessage: { type: "ping", timestamp: Date.now() },
})

export class WebSocketClient {
  private socket: WebSocket | null = null
  private config: WsConfig = defaultWsConfig()
  private status: WsConnectionStatus = "idle"
  private manualClose = false
  private reconnectAttempts = 0
  private heartbeatTimer: ReturnType<typeof window.setInterval> | null = null
  private reconnectTimer: ReturnType<typeof window.setTimeout> | null = null
  private typedHandlers = new Map<string, Set<WsTypedHandler>>()
  private anyHandlers = new Set<WsAnyHandler>()

  configure(config: Partial<WsConfig>) {
    this.config = {
      ...this.config,
      ...config,
    }
  }

  getStatus() {
    return this.status
  }

  connect(config?: Partial<WsConfig>) {
    if (config) {
      this.configure(config)
    }
    if (!this.config.url) {
      return false
    }
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return true
    }
    this.manualClose = false
    this.clearReconnectTimer()
    this.status = "connecting"
    try {
      this.socket = this.config.protocols ? new WebSocket(this.config.url, this.config.protocols) : new WebSocket(this.config.url)
    } catch {
      this.status = "closed"
      this.scheduleReconnect()
      return false
    }
    this.bindSocketEvents()
    return true
  }

  disconnect(code = 1000, reason = "manual close") {
    this.manualClose = true
    this.clearReconnectTimer()
    this.stopHeartbeat()
    if (!this.socket) {
      this.status = "closed"
      return
    }
    if (this.socket.readyState === WebSocket.CLOSING || this.socket.readyState === WebSocket.CLOSED) {
      this.status = "closed"
      return
    }
    this.status = "closing"
    this.socket.close(code, reason)
  }

  send(data: string | Record<string, unknown> | WsMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false
    }
    const message = typeof data === "string" ? data : JSON.stringify(data)
    this.socket.send(message)
    return true
  }

  sendHeartbeat() {
    const heartbeatPayload =
      typeof this.config.heartbeatMessage === "string"
        ? this.config.heartbeatMessage
        : JSON.stringify({
            ...this.config.heartbeatMessage,
            timestamp: Date.now(),
          })
    return this.send(heartbeatPayload)
  }

  subscribe(type: string, handler: WsTypedHandler) {
    const handlers = this.typedHandlers.get(type) || new Set<WsTypedHandler>()
    handlers.add(handler)
    this.typedHandlers.set(type, handlers)
    return () => {
      this.unsubscribe(type, handler)
    }
  }

  unsubscribe(type: string, handler: WsTypedHandler) {
    const handlers = this.typedHandlers.get(type)
    if (!handlers) return
    handlers.delete(handler)
    if (!handlers.size) {
      this.typedHandlers.delete(type)
    }
  }

  subscribeAll(handler: WsAnyHandler) {
    this.anyHandlers.add(handler)
    return () => {
      this.anyHandlers.delete(handler)
    }
  }

  private bindSocketEvents() {
    if (!this.socket) return
    this.socket.onopen = () => {
      this.status = "open"
      this.reconnectAttempts = 0
      this.startHeartbeat()
    }
    this.socket.onmessage = (event) => {
      const parsed = this.parseMessage(event.data)
      const payload = { raw: event.data, parsed, event }
      for (const handler of this.anyHandlers) {
        handler(payload)
      }
      if (!parsed?.type) {
        return
      }
      const handlers = this.typedHandlers.get(parsed.type)
      if (!handlers?.size) {
        return
      }
      for (const handler of handlers) {
        handler(parsed, event)
      }
    }
    this.socket.onclose = () => {
      this.status = "closed"
      this.stopHeartbeat()
      if (!this.manualClose) {
        this.scheduleReconnect()
      }
    }
    this.socket.onerror = () => {
      this.status = "closed"
    }
  }

  private parseMessage(raw: MessageEvent["data"]) {
    if (typeof raw !== "string") return null
    try {
      const parsed = JSON.parse(raw) as WsMessage
      if (!parsed || typeof parsed !== "object") return null
      return parsed
    } catch {
      return null
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    if (this.config.heartbeatIntervalMs <= 0) return
    this.heartbeatTimer = window.setInterval(() => {
      this.sendHeartbeat()
    }, this.config.heartbeatIntervalMs)
  }

  private stopHeartbeat() {
    if (!this.heartbeatTimer) return
    window.clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      return
    }
    this.reconnectAttempts += 1
    this.clearReconnectTimer()
    this.reconnectTimer = window.setTimeout(() => {
      this.connect()
    }, this.config.reconnectIntervalMs)
  }

  private clearReconnectTimer() {
    if (!this.reconnectTimer) return
    window.clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }
}

let wsClientSingleton: WebSocketClient | null = null

export const getWebSocketClient = (config?: Partial<WsConfig>) => {
  if (!wsClientSingleton) {
    wsClientSingleton = new WebSocketClient()
  }
  if (config) {
    wsClientSingleton.configure(config)
  }
  return wsClientSingleton
}
