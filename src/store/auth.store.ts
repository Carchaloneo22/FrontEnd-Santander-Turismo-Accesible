// src/store/auth.store.ts
/**
 * Store de autenticación (zustand).
 * Mantiene el estado de sesión en el cliente y expone acciones
 * que delegan al AuthService (el que hace las peticiones HTTP reales).
 */
import { create } from 'zustand'
import { authService, type SessionData, type LoginPayload } from '../services/AuthService'

interface AuthState {
  /** Datos de la sesión actual (null si no está autenticado). */
  session: SessionData | null
  /** Indica si se está verificando la sesión al montar la app. */
  loading: boolean
  /** Último error de autenticación. */
  error: string | null

  /** Verifica la sesión con el backend (llamar al montar la app). */
  checkSession: () => Promise<void>
  /** Inicia sesión. */
  login: (payload: LoginPayload) => Promise<void>
  /** Cierra sesión. */
  logout: () => Promise<void>
  /** Limpia el error. */
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  error: null,

  checkSession: async () => {
    set({ loading: true, error: null })
    try {
      const data = await authService.checkSession()
      set({ session: data.authenticated ? data : null, loading: false })
    } catch {
      set({ session: null, loading: false })
    }
  },

  login: async (payload) => {
    set({ loading: true, error: null })
    try {
      const { session } = await authService.login(payload)
      set({ session: { ...session, authenticated: true }, loading: false })
    } catch (err: unknown) {
      const message = (err as { message?: string }).message ?? 'Error de autenticación'
      set({ error: message, loading: false })
      throw err
    }
  },

  logout: async () => {
    try {
      await authService.logout()
    } finally {
      set({ session: null, error: null })
    }
  },

  clearError: () => set({ error: null }),
}))
