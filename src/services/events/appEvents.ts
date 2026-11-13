// src/services/events/appEvents.ts
/**
 * Registro central de eventos de la app (mapa tipado para el EventBus compartido).
 * Aquí se declaran TODOS los eventos que circulan por 'appBus', incluidos los
 * que llegarán por SSE desde el backend (agentes de IA).
 * Agregar un evento nuevo = agregar una línea aquí (OCP).
 */
import { EventBus } from '../../lib/EventBus'

// ── Payloads de streaming SSE de los agentes de IA ──
export interface AiChunk {
  conversationId: string
  content: string // fragmento de texto que llega en streaming
}
export interface AiError {
  conversationId: string
  message: string
}

// ── Mapa de TODOS los eventos de la app (nombre → tipo del payload) ──
export type AppEvents = {
  // Ciclo de vida de la conexión SSE
  'sse:open': { url: string }
  'sse:close': { url: string }
  'sse:error': { url: string; error: unknown }
  // Streaming de los agentes de IA
  'ai:chunk': AiChunk
  'ai:done': { conversationId: string }
  'ai:error': AiError
  // (aquí irán 'cart:changed', 'auth:logout', etc. cuando se necesiten)
}

// Bus COMPARTIDO de la app, tipado con AppEvents.
// Al ser una constante de módulo, todos los que lo importen usan la MISMA
// instancia (Singleton por módulo). Es donde el SSEServiceBase publicará.
export const appBus = new EventBus<AppEvents>()