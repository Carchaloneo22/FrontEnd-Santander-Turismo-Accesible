// src/lib/EventBus.ts
/**
 * EventBus — Pub/Sub (Event Aggregator) reutilizable y TIPADO.
 * Emite y escucha MÚLTIPLES eventos con nombre, con seguridad de tipos.
 * Patrón: Observer / Publish-Subscribe.
 * SOLID: SRP (solo gestiona eventos) · OCP (agregar eventos sin tocar la clase).
 *
 * Se parametriza con un "mapa de eventos": { 'nombre': TipoDelPayload }.
 * Así, emit('x', payload) obliga a que payload sea del tipo correcto para 'x'.
 */

type Handler<T> = (payload: T) => void

export class EventBus<Events extends Record<string, unknown>> {
  // Por cada evento, un conjunto (Set) de manejadores. Set evita duplicados.
  private handlers: { [K in keyof Events]?: Set<Handler<Events[K]>> } = {}

  /** Suscribirse a un evento. Devuelve una función para des-suscribirse. */
  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    ;(this.handlers[event] ??= new Set()).add(handler)
    return () => this.off(event, handler)
  }

  /** Suscribirse una sola vez: se auto-desuscribe tras el primer disparo. */
  once<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    const off = this.on(event, (payload) => {
      off()
      handler(payload)
    })
    return off
  }

  /** Des-suscribir un manejador concreto de un evento. */
  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    this.handlers[event]?.delete(handler)
  }

  /** Emitir un evento: notifica a todos sus suscriptores. */
  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    // Copiamos a array: así un handler puede des-suscribirse durante el disparo
    // sin romper la iteración.
    const hs = this.handlers[event]
    if (hs) [...hs].forEach((h) => h(payload))
  }

  /** Limpiar un evento, o TODOS si no se pasa nombre. */
  clear<K extends keyof Events>(event?: K): void {
    if (event === undefined) this.handlers = {}
    else this.handlers[event]?.clear()
  }
}