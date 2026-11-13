// src/services/ServiceDebugger.ts
/**
 * ServiceDebugger — Registro central de llamadas HTTP para depuración.
 * Patrón: Singleton (una sola instancia). El pub/sub NO es su responsabilidad:
 *         lo delega en un EventBus por COMPOSICIÓN.
 * SOLID: SRP (solo registra llamadas; el bus se encarga de notificar).
 */
import { EventBus } from '../lib/EventBus'

export interface ServiceCall {
  id: string
  timestamp: string
  serviceName: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  endpoint: string
  fullUrl: string
  requestData?: unknown
  responseData?: unknown
  error?: unknown
  duration: number
  status: 'pending' | 'success' | 'error'
  statusCode?: number
}

export interface ServiceCallUpdate {
  id: string
  responseData?: unknown
  error?: unknown
  duration: number
  status: 'success' | 'error'
  statusCode?: number
}

// Los eventos que emite ESTE debugger (mapa tipado para su bus interno).
type DebuggerEvents = {
  'calls:changed': ServiceCall[]
}

const ENABLED = import.meta.env.DEV
const MAX_CALLS = 100

class ServiceDebugger {
  // ── Singleton ──
  private static instance: ServiceDebugger
  private constructor() {}
  static getInstance(): ServiceDebugger {
    if (!ServiceDebugger.instance) {
      ServiceDebugger.instance = new ServiceDebugger()
    }
    return ServiceDebugger.instance
  }

  private calls: ServiceCall[] = []
  // COMPOSICIÓN: el debugger TIENE un bus; no ES un bus.
  private bus = new EventBus<DebuggerEvents>()

  /** Suscribirse a los cambios del registro. Devuelve función para des-suscribir. */
  subscribe(listener: (calls: ServiceCall[]) => void): () => void {
    const off = this.bus.on('calls:changed', listener)
    listener([...this.calls]) // entrega el estado actual de inmediato
    return off
  }

  private notify(): void {
    this.bus.emit('calls:changed', [...this.calls])
  }

  logServiceCall(call: ServiceCall): void {
    if (!ENABLED) return
    this.calls.unshift(call)
    if (this.calls.length > MAX_CALLS) this.calls = this.calls.slice(0, MAX_CALLS)
    this.notify()
  }

  updateServiceCall(update: ServiceCallUpdate): void {
    if (!ENABLED) return
    const i = this.calls.findIndex((c) => c.id === update.id)
    if (i !== -1) {
      this.calls[i] = { ...this.calls[i], ...update }
      this.notify()
    }
  }

  clear(): void {
    this.calls = []
    this.notify()
  }
}

export const serviceDebugger = ServiceDebugger.getInstance()