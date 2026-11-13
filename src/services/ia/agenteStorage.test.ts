import { describe, it, expect, beforeEach } from 'vitest'
import { leerSesionAgente, guardarSesionAgente, borrarSesionAgente } from './agenteStorage'

describe('agenteStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('devuelve null cuando no hay sesión guardada', () => {
    expect(leerSesionAgente()).toBeNull()
  })

  it('guarda y recupera la sesión con su token', () => {
    guardarSesionAgente({ token: 'tok-123', sesionId: 's1', nombre: 'Ana', correo: 'a@b.co' })
    const s = leerSesionAgente()
    expect(s).not.toBeNull()
    expect(s?.token).toBe('tok-123')
    expect(s?.nombre).toBe('Ana')
  })

  it('ignora una sesión persistida sin token (no sirve para el SSE por usuario)', () => {
    guardarSesionAgente({ token: '', sesionId: 's1', nombre: 'Ana', correo: 'a@b.co' })
    expect(leerSesionAgente()).toBeNull()
  })

  it('borra la sesión', () => {
    guardarSesionAgente({ token: 'tok-123' })
    borrarSesionAgente()
    expect(leerSesionAgente()).toBeNull()
  })
})
