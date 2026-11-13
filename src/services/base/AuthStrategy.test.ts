// src/services/base/AuthStrategy.test.ts
import { CookieSessionStrategy } from './AuthStrategy'

describe('CookieSessionStrategy', () => {
  let strategy: CookieSessionStrategy

  beforeEach(() => {
    strategy = new CookieSessionStrategy()
    strategy.clear() // sessionStore es compartido → aseguramos estado limpio
  })

  it('usa credenciales (envía cookies)', () => {
    expect(strategy.useCredentials).toBe(true)
  })

  it('no añade headers de auth (la cookie viaja sola)', () => {
    expect(strategy.getAuthHeaders()).toEqual({})
  })

  it('no está autenticado por defecto', () => {
    expect(strategy.isAuthenticated()).toBe(false)
  })

  it('setActive(true) marca la sesión como activa', () => {
    strategy.setActive(true)
    expect(strategy.isAuthenticated()).toBe(true)
  })

  it('setActive(false) desmarca la sesión', () => {
    strategy.setActive(true)
    strategy.setActive(false)
    expect(strategy.isAuthenticated()).toBe(false)
  })

  it('clear() limpia la sesión', () => {
    strategy.setActive(true)
    strategy.clear()
    expect(strategy.isAuthenticated()).toBe(false)
  })
})