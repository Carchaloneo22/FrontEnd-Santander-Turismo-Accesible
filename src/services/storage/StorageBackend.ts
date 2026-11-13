// src/services/storage/StorageBackend.ts
/**
 * StorageBackend — Patrón Strategy para el ALMACÉN físico.
 * Abstrae DÓNDE se guardan los datos: localStorage, sessionStorage o memoria.
 * SOLID: OCP (un almacén nuevo = una clase nueva, sin tocar a los que lo usan)
 *        DIP (StorageService dependerá de esta interfaz, no de un almacén concreto)
 *        SRP (cada backend solo sabe leer/escribir/borrar en SU almacén)
 *
 * Ojo: estos backends son "delgados" y pueden lanzar si el navegador bloquea
 * el storage. El try/catch y la degradación viven en StorageService (Paso 2),
 * no aquí — así cada clase tiene una sola responsabilidad.
 */

// Contrato mínimo (idéntico a la Web Storage API: getItem/setItem/removeItem).
export interface StorageBackend {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

// Backend 1 — localStorage: persiste aunque cierres el navegador.
export class LocalStorageBackend implements StorageBackend {
  getItem(key: string): string | null {
    return window.localStorage.getItem(key)
  }
  setItem(key: string, value: string): void {
    window.localStorage.setItem(key, value)
  }
  removeItem(key: string): void {
    window.localStorage.removeItem(key)
  }
}

// Backend 2 — sessionStorage: se borra al cerrar la pestaña.
export class SessionStorageBackend implements StorageBackend {
  getItem(key: string): string | null {
    return window.sessionStorage.getItem(key)
  }
  setItem(key: string, value: string): void {
    window.sessionStorage.setItem(key, value)
  }
  removeItem(key: string): void {
    window.sessionStorage.removeItem(key)
  }
}

// Backend 3 — memoria: fallback si el navegador bloquea el storage (ej. incógnito).
// No persiste; vive solo mientras la página esté abierta. Garantiza que la app
// nunca se rompa por falta de almacenamiento.
export class MemoryStorageBackend implements StorageBackend {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
}