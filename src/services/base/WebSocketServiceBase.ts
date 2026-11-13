// src/services/base/WebSocketServiceBase.ts
/**
 * WebSocketServiceBase — Scaffolding para conexiones WebSocket (bidireccional).
 * A diferencia del SSE (solo servidor→cliente), WS permite ENVIAR y RECIBIR.
 * Aún sin uso confirmado (YAGNI): queda listo y desacoplado. Cuando se necesite,
 * se conecta al appBus igual que el SSE.
 * Patrones: base reutilizable · SOLID: SRP (solo la conexión WS).
 */

export type WSMessageHandler = (data: unknown, raw: MessageEvent) => void

export interface WSOptions {
  autoReconnect?: boolean // default true
  maxReconnect?: number // default 5
  protocols?: string | string[]
}

export class WebSocketServiceBase {
  private socket: WebSocket | null = null
  private readonly url: string
  private readonly autoReconnect: boolean
  private readonly maxReconnect: number
  private readonly protocols?: string | string[]
  private messageHandlers = new Set<WSMessageHandler>()
  private reconnectAttempts = 0
  private manualClose = false
  private queue: string[] = [] // mensajes pendientes si aún no está abierto

  constructor(url: string, options: WSOptions = {}) {
    this.url = url // ej. wss://tu-servidor/ws
    this.autoReconnect = options.autoReconnect ?? true
    this.maxReconnect = options.maxReconnect ?? 5
    this.protocols = options.protocols
  }

  connect(): void {
    if (this.socket) return
    this.manualClose = false
    this.socket = new WebSocket(this.url, this.protocols)

    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      this.queue.forEach((m) => this.socket?.send(m)) // vacía la cola pendiente
      this.queue = []
    }

    this.socket.onmessage = (ev) => {
      let data: unknown = ev.data
      try {
        data = JSON.parse(ev.data)
      } catch {
        /* texto plano */
      }
      this.messageHandlers.forEach((h) => h(data, ev))
    }

    this.socket.onclose = () => {
      this.socket = null
      this.scheduleReconnect()
    }

    this.socket.onerror = () => {
      this.socket?.close() // dispara onclose → reconexión
    }
  }

  /** Envía un mensaje (lo serializa a JSON). Si no está abierto, lo encola. */
  send(payload: unknown): void {
    const msg = JSON.stringify(payload)
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(msg)
    else this.queue.push(msg) // se enviará al abrir
  }

  /** Registra un handler de mensajes entrantes. Devuelve función para quitarlo. */
  onMessage(handler: WSMessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  private scheduleReconnect(): void {
    if (this.manualClose || !this.autoReconnect) return
    if (this.reconnectAttempts >= this.maxReconnect) return
    const delay = 1000 * 2 ** this.reconnectAttempts
    this.reconnectAttempts++
    setTimeout(() => this.connect(), delay)
  }

  close(): void {
    this.manualClose = true
    this.socket?.close()
    this.socket = null
  }
}