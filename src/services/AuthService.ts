// src/services/AuthService.ts
/**
 * AuthService — Servicio de autenticación contra el backend PHP.
 * Usa la cookie httpOnly que el backend establece al hacer login.
 * Extiende HttpServiceBase → hereda reintentos, debugger y sobre {ok, data}.
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import { cookieSessionStrategy } from './base/AuthStrategy'

export interface LoginPayload {
  email: string
  password: string
  tipo: 'viajero' | 'admin' | 'casa_cultura' | 'empresa'
}

export interface SessionData {
  authenticated: boolean
  tipo?: 'viajero' | 'admin' | 'casa_cultura' | 'empresa'
  id?: number
  email?: string
  nombre?: string
  avatar?: string
  tipoServicio?: string
}

export interface LoginResponse {
  session: SessionData
}

class AuthService extends HttpServiceBase {
  /** Inicia sesión. El backend devuelve la cookie httpOnly. */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const result = await this.post<LoginResponse>('/login/login.php', payload)
    cookieSessionStrategy.setActive(true)
    return result
  }

  /** Cierra sesión. El backend destruye la cookie. */
  async logout(): Promise<void> {
    await this.post<null>('/login/logout.php')
    cookieSessionStrategy.setActive(false)
  }

  /** Verifica si hay sesión activa (la cookie httpOnly viaja sola). */
  async checkSession(): Promise<SessionData> {
    const data = await this.get<SessionData>('/login/session_check.php')
    cookieSessionStrategy.setActive(data.authenticated)
    return data
  }
}

export const authService = new AuthService()
