// src/services/base/AuthStrategy.ts
/**
 * AuthStrategy — Patrón Strategy para la autenticación de peticiones.
 * El HttpServiceBase dependerá de esta INTERFAZ, no de una implementación.
 * Hoy solo existe la de cookies; si mañana se necesita token (ej. app móvil),
 * se agrega otra clase que cumpla la interfaz, SIN tocar el HttpServiceBase (OCP).
 * SOLID: DIP (se depende de la abstracción) · OCP · SRP.
 */
import { sessionStore } from '../storage/StorageService'

// ── Contrato que toda estrategia de auth debe cumplir ──
export interface AuthStrategy {
  /** ¿axios debe enviar cookies con la petición? (withCredentials) */
  readonly useCredentials: boolean
  /** Headers de auth a inyectar en cada request (vacío si usa cookie) */
  getAuthHeaders(): Record<string, string>
  /** ¿El usuario está autenticado, desde la perspectiva del cliente? */
  isAuthenticated(): boolean
  /** Limpia el estado de sesión del lado cliente (logout) */
  clear(): void
}

// Bandera NO sensible que solo indica "hay sesión" (pista para la UI).
// La credencial REAL es la cookie httpOnly; esto es un simple true/false.
const SESSION_FLAG = 'session_active'

export class CookieSessionStrategy implements AuthStrategy {
  readonly useCredentials = true
  // Token CSRF (synchronizer token) de la sesión: se pide en GET /auth/csrf y se
  // reenvía en la cabecera X-CSRF-Token en cada mutación autenticada. Vive solo
  // en memoria (no es secreto persistente).
  private csrf: string | null = null

  // Con cookie httpOnly solo se añade el token CSRF (si lo hay); el backend lo
  // ignora en métodos seguros (GET/HEAD/OPTIONS). Sin sesión → {} (la cookie viaja sola).
  getAuthHeaders(): Record<string, string> {
    return this.csrf ? { 'X-CSRF-Token': this.csrf } : {}
  }

  setCsrf(token: string | null): void {
    this.csrf = token
  }

  // La cookie httpOnly no es legible por JS → nos apoyamos en la bandera.
  isAuthenticated(): boolean {
    return sessionStore.get<boolean>(SESSION_FLAG, false) === true
  }

  // Marca/limpia la bandera. La llamará el flujo de login/logout (Fase 4/5).
  setActive(active: boolean): void {
    if (active) {
      sessionStore.set(SESSION_FLAG, true)
    } else {
      sessionStore.remove(SESSION_FLAG)
      this.csrf = null
    }
  }

  clear(): void {
    sessionStore.remove(SESSION_FLAG)
    this.csrf = null
  }
}

// ── La estrategia activa de la app ──
// Exportamos la instancia concreta (para que el login pueda llamar setActive)
// y un alias tipado como la interfaz (para que el HttpServiceBase solo vea el contrato).
export const cookieSessionStrategy = new CookieSessionStrategy()
export const authStrategy: AuthStrategy = cookieSessionStrategy
