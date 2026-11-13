// src/services/storage/StorageService.ts
/**
 * StorageService — Facade sobre un StorageBackend (Strategy inyectada).
 * Añade: namespace 'sa_', serialización JSON tipada y degradación a memoria.
 * SOLID: SRP (solo orquesta el guardado) · DIP (depende de la INTERFAZ
 *        StorageBackend, no de un almacén concreto) · OCP (cambiar de almacén
 *        = pasarle otro backend, sin tocar esta clase).
 */
import {
  type StorageBackend,
  LocalStorageBackend,
  SessionStorageBackend,
  MemoryStorageBackend,
} from './StorageBackend'

const NAMESPACE = 'sa_' // prefijo Santander Accesible para todas las claves

export class StorageService {
  private backend: StorageBackend

  // El backend llega POR INYECCIÓN (Strategy). Si no funciona, caemos a memoria.
  constructor(backend: StorageBackend) {
    this.backend = StorageService.ensureUsable(backend)
  }

  // Antepone el namespace a la clave (sa_theme, sa_cart, ...)
  private key(name: string): string {
    return NAMESPACE + name
  }

  /** Guarda cualquier valor serializable como JSON. */
  set<T>(name: string, value: T): void {
    try {
      this.backend.setItem(this.key(name), JSON.stringify(value))
    } catch (err) {
      console.warn(`[StorageService] No se pudo guardar '${name}':`, err)
    }
  }

  /** Lee y parsea un valor. Devuelve 'fallback' (o null) si no existe o falla. */
  get<T>(name: string, fallback: T | null = null): T | null {
    try {
      const raw = this.backend.getItem(this.key(name))
      if (raw === null) return fallback
      return JSON.parse(raw) as T
    } catch (err) {
      console.warn(`[StorageService] No se pudo leer '${name}':`, err)
      return fallback
    }
  }

  /** ¿Existe la clave? */
  has(name: string): boolean {
    try {
      return this.backend.getItem(this.key(name)) !== null
    } catch {
      return false
    }
  }

  /** Elimina la clave. */
  remove(name: string): void {
    try {
      this.backend.removeItem(this.key(name))
    } catch (err) {
      console.warn(`[StorageService] No se pudo borrar '${name}':`, err)
    }
  }

  // Prueba el backend con una escritura/borrado; si lanza (ej. incógnito),
  // devuelve un almacén en memoria para que la app nunca se rompa.
  private static ensureUsable(backend: StorageBackend): StorageBackend {
    try {
      const probe = '__sa_probe__'
      backend.setItem(probe, '1')
      backend.removeItem(probe)
      return backend
    } catch {
      console.warn('[StorageService] Almacén no disponible; usando memoria.')
      return new MemoryStorageBackend()
    }
  }
}

// ── Instancias listas para usar (una sola por almacén → conveniencia tipo Singleton) ──
export const localStore = new StorageService(new LocalStorageBackend())   // persiste
export const sessionStore = new StorageService(new SessionStorageBackend()) // por pestaña