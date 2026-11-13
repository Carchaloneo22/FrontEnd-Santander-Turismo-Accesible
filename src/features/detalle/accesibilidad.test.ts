import { describe, it, expect } from 'vitest'
import { dimensionesLugar, dimensionesOferta, etiquetaAccesible } from './accesibilidad'

describe('accesibilidad — dimensionesLugar', () => {
  it('traduce los 4 niveles de un lugar con etiqueta y tono', () => {
    const dims = dimensionesLugar({
      motriz: 'total',
      visual: 'parcial',
      auditiva: 'nula',
      cognitiva: 'sin_info',
    })
    expect(dims.map((d) => [d.clave, d.etiqueta, d.tono])).toEqual([
      ['motriz', 'Accesible', 'ok'],
      ['visual', 'Parcialmente accesible', 'parcial'],
      ['auditiva', 'No accesible', 'no'],
      ['cognitiva', 'Sin información', 'desconocido'],
    ])
  })
})

describe('accesibilidad — dimensionesOferta', () => {
  it('distingue "declarado" (sin verificar) de "verificado"', () => {
    const dims = dimensionesOferta({
      motriz: 'verificado',
      visual: 'declarado',
      auditiva: 'no',
      cognitiva: 'sin_info',
    })
    expect(dims.map((d) => [d.etiqueta, d.tono])).toEqual([
      ['Verificada', 'ok'],
      ['Declarada (sin verificar)', 'parcial'],
      ['No accesible', 'no'],
      ['Sin información', 'desconocido'],
    ])
  })

  it('un nivel desconocido cae a "Sin información" en vez de romper', () => {
    const dims = dimensionesOferta({
      motriz: 'inventado',
      visual: 'sin_info',
      auditiva: 'sin_info',
      cognitiva: 'sin_info',
    })
    expect(dims[0].etiqueta).toBe('Sin información')
  })
})

describe('etiquetaAccesible', () => {
  it('da un nombre accesible completo para narración', () => {
    const [motriz] = dimensionesLugar({
      motriz: 'total',
      visual: 'sin_info',
      auditiva: 'sin_info',
      cognitiva: 'sin_info',
    })
    expect(etiquetaAccesible(motriz)).toBe('Accesibilidad movilidad: Accesible')
  })
})
