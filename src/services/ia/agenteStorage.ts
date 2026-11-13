// src/services/ia/agenteStorage.ts
/**
 * Persistencia de la sesión del agente de chat IA.
 *
 * El backend del agente entrega un TOKEN por usuario tras activar su correo;
 * con él se conecta el SSE POR USUARIO y se consultan sus conversaciones. Lo
 * guardamos para que, al volver, no haya que repetir el mini-login.
 *
 * Reutiliza `localStore` (StorageService → namespace `sa_`), que ya degrada a
 * memoria con try/catch si localStorage no está disponible (modo privado,
 * bloqueado, etc.). Así cumplimos "persiste el token con try/catch" sin volver
 * a implementar el guardado.
 */
import { localStore } from '../storage/StorageService'

/** Datos mínimos de la sesión del agente que persistimos. */
export interface SesionAgente {
  /** Token de sesión del agente (lo exige el SSE por usuario y el historial). */
  token: string
  /** Identificador de la sesión creada en el login (para reintentar activación). */
  sesionId?: string
  /** Nombre que dio el usuario, para saludarlo al reabrir. */
  nombre?: string
  /** Correo del usuario (se muestra, nunca se envía a terceros). */
  correo?: string
}

const CLAVE = 'ia_agente_sesion'

/** Lee la sesión persistida del agente (o null si no hay / falló la lectura). */
export function leerSesionAgente(): SesionAgente | null {
  const s = localStore.get<SesionAgente>(CLAVE, null)
  if (s && typeof s.token === 'string' && s.token.length > 0) return s
  return null
}

/** Guarda (o reemplaza) la sesión del agente. Silencioso si falla el almacén. */
export function guardarSesionAgente(sesion: SesionAgente): void {
  localStore.set(CLAVE, sesion)
}

/** Borra la sesión persistida (cerrar sesión / token expirado). */
export function borrarSesionAgente(): void {
  localStore.remove(CLAVE)
}
