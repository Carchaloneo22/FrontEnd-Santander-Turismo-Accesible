// src/services/base/SSEServiceBase.ts
/**
 * SSEServiceBase — Base reutilizable para conexiones SSE (Server-Sent Events).
 * Envuelve EventSource, gestiona el ciclo de vida y publica en el appBus.
 * El mapeo de mensajes concretos (ej. streaming de IA → 'ai:chunk') lo hace
 * el servicio que use esta base.
 *
 * Clave: EventSource NO admite headers custom, pero SÍ envía cookies con
 * { withCredentials: true } → por eso la auth por cookie httpOnly encaja perfecto.
 *
 * Patrones: Adapter (EventSource → appBus) · SOLID: SRP (solo la conexión SSE),
 *           DIP (publica en un bus abstracto, no conoce a los oyentes).
 */
import { API_CONFIG } from '../ApiConfig'
import { appBus } from '../events/appEvents'
import type { AppEvents } from '../events/appEvents'
import type { EventBus } from '../../lib/EventBus'

// Un handler recibe el dato ya parseado y el evento crudo por si se necesita.
export type SSEHandler = (data: unknown, raw: MessageEvent) => void

export interface SSEOptions {
  autoReconnect?: boolean // reconectar si se cae (default true)
  maxReconnect?: number // máx. reintentos (default 5)
  bus?: EventBus<AppEvents> // bus destino (default: appBus)
}

export class SSEServiceBase {
  private source: EventSource | null = null
  private readonly url: string
  private readonly bus: EventBus<AppEvents>
  private readonly autoReconnect: boolean
  private readonly maxReconnect: number
  private handlers = new Map<string, SSEHandler>()
  private reconnectAttempts = 0
  private manualClose = false

  constructor(endpoint: string, options: SSEOptions = {}) {
    // endpoint relativo → lo prefijamos con la base del API (pasa por el proxy /php)
    this.url = API_CONFIG.BASE_URL + endpoint
    this.autoReconnect = options.autoReconnect ?? true
    this.maxReconnect = options.maxReconnect ?? 5
    this.bus = options.bus ?? appBus
  }

  /** Registra un handler para un evento SSE con nombre (ej. 'chunk', 'done'). */
  on(eventName: string, handler: SSEHandler): this {
    this.handlers.set(eventName, handler)
    if (this.source) this.attach(eventName, handler) // engancha en caliente si ya está abierto
    return this // permite encadenar: sse.on(...).on(...).connect()
  }

  /** Abre la conexión SSE. */
  connect(): void {
    if (this.source) return
    this.manualClose = false

    // withCredentials: true → viaja la cookie httpOnly (autentica el stream)
    this.source = new EventSource(this.url, { withCredentials: true })

    this.source.onopen = () => {
      this.reconnectAttempts = 0
      this.bus.emit('sse:open', { url: this.url })
    }

    this.source.onerror = (err) => {
      this.bus.emit('sse:error', { url: this.url, error: err })
      // Si quedó CERRADO de forma fatal, intentamos reconectar con backoff.
      if (this.source?.readyState === EventSource.CLOSED) {
        this.scheduleReconnect()
      }
    }

    // Enganchamos los handlers ya registrados
    this.handlers.forEach((h, name) => this.attach(name, h))
  }

  private attach(eventName: string, handler: SSEHandler): void {
    this.source?.addEventListener(eventName, (ev) => {
      const msg = ev as MessageEvent
      let data: unknown = msg.data
      try {
        data = JSON.parse(msg.data) // el backend suele mandar JSON
      } catch {
        /* si no es JSON, dejamos el texto plano */
      }
      handler(data, msg)
    })
  }

  private scheduleReconnect(): void {
    if (this.manualClose || !this.autoReconnect) return
    if (this.reconnectAttempts >= this.maxReconnect) return
    const delay = 1000 * 2 ** this.reconnectAttempts // 1s, 2s, 4s...
    this.reconnectAttempts++
    this.source = null
    setTimeout(() => this.connect(), delay)
  }

  /** Cierra la conexión y evita reconexión. */
  close(): void {
    this.manualClose = true
    this.source?.close()
    this.source = null
    this.bus.emit('sse:close', { url: this.url })
  }
}