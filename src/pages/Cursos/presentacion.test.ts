import { describe, it, expect } from 'vitest'
import { CATEGORIAS, duracionLegible, etiquetaCategoria, iconoCategoria } from './presentacion'

describe('presentacion de cursos', () => {
  it('ofrece las 5 categorías de la academia', () => {
    expect(CATEGORIAS.map((c) => c.valor)).toEqual([
      'rnt',
      'artesanos',
      'documentos',
      'accesibilidad',
      'general',
    ])
  })

  it('traduce categorías conocidas y cae con gracia en las nuevas', () => {
    expect(etiquetaCategoria('rnt')).toBe('Registro RNT')
    expect(etiquetaCategoria('nueva')).toBe('Nueva')
    expect(etiquetaCategoria(null)).toBe('General')
    expect(iconoCategoria('accesibilidad')).toBe('♿')
  })

  it('formatea la duración en minutos y horas', () => {
    expect(duracionLegible(25)).toBe('25 min')
    expect(duracionLegible(60)).toBe('1 h')
    expect(duracionLegible(70)).toBe('1 h 10 min')
    expect(duracionLegible(0)).toBeUndefined()
    expect(duracionLegible(null)).toBeUndefined()
  })
})
