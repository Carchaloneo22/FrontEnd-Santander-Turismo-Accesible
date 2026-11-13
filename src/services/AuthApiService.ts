// src/services/AuthApiService.ts
/**
 * AuthApiService — autenticación REAL contra el backend NestJS de turismo
 * (http://localhost:3004, prefijo /api/v1). Usa la cookie de sesión httpOnly
 * que fija el backend y el sobre { exito, datos, mensaje } (ya desanidado por
 * HttpServiceBase → aquí llega `datos`; los errores llegan como ApiError.message).
 *
 * Reemplaza al antiguo AuthService (que apuntaba a endpoints .php). El flujo:
 *   POST /auth/registro · POST /auth/login · POST /auth/2fa/verificar
 *   POST /auth/recuperar · POST /auth/restablecer · GET /auth/yo
 *   POST /auth/logout · GET /auth/csrf
 *
 * Patrón portado de ../santander-accesible/frontend (mismo backend, mismo sobre
 * + CSRF), adaptado al contrato de registro de este backend: { email, nombre,
 * contrasena } (sin perfil/nombreComercial).
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import { cookieSessionStrategy } from './base/AuthStrategy'

export interface RegistroPayload {
  email: string
  nombre: string
  /** Mínimo 8 caracteres (regla del backend). */
  contrasena: string
}

export interface LoginPayload {
  email: string
  contrasena: string
}

/** Usuario público que devuelve el backend (sin datos sensibles). */
export interface Usuario {
  id: string
  email: string
  nombre: string
  emailVerificado: boolean
  activo: boolean
  creadoEn: string
  actualizadoEn: string
  /** Presentes en `GET /auth/yo`: permisos y si es administrador. */
  permisos?: string[]
  esAdministrador?: boolean
}

/** `GET /auth/yo` devuelve una forma reducida: id + permisos (no nombre/email). */
export interface SesionYo {
  id: string
  permisos: string[]
  esAdministrador?: boolean
}

/** Login: o pide el 2º factor, o ya trae la sesión (usuario). */
export type ResultadoLogin = { requiere2fa: true; desafio: string } | Usuario

/** Type guard: ¿el login pide el segundo factor? */
export function requiere2fa(r: ResultadoLogin): r is { requiere2fa: true; desafio: string } {
  return (r as { requiere2fa?: boolean }).requiere2fa === true
}

class AuthApiService extends HttpServiceBase {
  /** Registro público de un usuario. No crea sesión por sí mismo. */
  registro(payload: RegistroPayload): Promise<Usuario> {
    return this.post<Usuario>('/auth/registro', payload)
  }

  /** Paso 1 del login. Si el usuario tiene 2FA, devuelve `{ requiere2fa, desafio }`. */
  async login(payload: LoginPayload): Promise<ResultadoLogin> {
    const r = await this.post<ResultadoLogin>('/auth/login', payload)
    if (!requiere2fa(r)) {
      cookieSessionStrategy.setActive(true)
      await this.refrescarCsrf()
    }
    return r
  }

  /** Paso 2 del login (2FA): verifica el código y crea la sesión. */
  async verificar2fa(desafio: string, codigo: string): Promise<Usuario> {
    const u = await this.post<Usuario>('/auth/2fa/verificar', { desafio, codigo })
    cookieSessionStrategy.setActive(true)
    await this.refrescarCsrf()
    return u
  }

  /** Pide un token CSRF para la sesión y lo guarda para las mutaciones. */
  private async refrescarCsrf(): Promise<void> {
    try {
      const { csrfToken } = await this.csrf()
      cookieSessionStrategy.setCsrf(csrfToken ?? null)
    } catch {
      // best-effort: si falla, las mutaciones pedirán reintentar
    }
  }

  /** Pide el enlace de recuperación (respuesta uniforme: no revela si existe). */
  recuperar(email: string): Promise<{ enviado: boolean }> {
    return this.post<{ enviado: boolean }>('/auth/recuperar', { email })
  }

  /** Restablece la contraseña con el token del enlace. */
  restablecer(token: string, contrasena: string): Promise<{ restablecido: boolean }> {
    return this.post<{ restablecido: boolean }>('/auth/restablecer', { token, contrasena })
  }

  /** Sesión actual (requiere cookie). Refresca el CSRF si hay sesión. */
  async yo(): Promise<SesionYo | undefined> {
    const u = await this.get<SesionYo | undefined>('/auth/yo')
    if (u) {
      cookieSessionStrategy.setActive(true)
      await this.refrescarCsrf()
    }
    return u
  }

  /** Cierra la sesión (la revoca en el backend). */
  async logout(): Promise<void> {
    try {
      await this.post<{ cerrada: boolean }>('/auth/logout')
    } finally {
      cookieSessionStrategy.setActive(false)
    }
  }

  /** Token CSRF para mutaciones autenticadas (enviar luego en X-CSRF-Token). */
  csrf(): Promise<{ csrfToken: string | null }> {
    return this.get<{ csrfToken: string | null }>('/auth/csrf')
  }
}

export const authApiService = new AuthApiService()
