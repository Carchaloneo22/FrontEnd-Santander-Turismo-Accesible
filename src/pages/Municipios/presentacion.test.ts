import { describe, it, expect } from 'vitest'
import type { RecursoMunicipio } from '../../services'
import {
  hayRelevancia,
  ordenarMunicipiosPorRelevancia,
  esDestacado,
  hayCrudos,
  filtrarDestacados,
  completosPrimero,
  FRASES_SANTANDER,
  fraseTipica,
  descripcionMunicipio,
  hayAccesibilidad,
  sitiosTop,
} from './presentacion'

/** Construye un municipio mínimo para las pruebas de orden. */
function muni(
  nombre: string,
  opts: { relevancia?: number; total?: number; tieneContenido?: boolean } = {},
): RecursoMunicipio {
  const total = opts.total ?? 0
  return {
    id: nombre.toLowerCase(),
    nombre,
    codigo: '000',
    codigoDane: '68000',
    provincia: null,
    latitud: null,
    longitud: null,
    imagen: null,
    tieneContenido: opts.tieneContenido ?? false,
    relevancia: opts.relevancia,
    recursos: { sitios: total, artesanos: 0, prestadores: 0, total },
  }
}

describe('hayRelevancia', () => {
  it('detecta cuando al menos un municipio trae relevancia', () => {
    expect(hayRelevancia([muni('A'), muni('B', { relevancia: 3 })])).toBe(true)
  })
  it('es false cuando ninguno la trae (backend viejo)', () => {
    expect(hayRelevancia([muni('A'), muni('B')])).toBe(false)
  })
})

describe('ordenarMunicipiosPorRelevancia', () => {
  it('ordena de mayor a menor relevancia cuando el backend la manda', () => {
    const r = ordenarMunicipiosPorRelevancia([
      muni('Baja', { relevancia: 1 }),
      muni('Alta', { relevancia: 9 }),
      muni('Media', { relevancia: 5 }),
    ])
    expect(r.map((m) => m.nombre)).toEqual(['Alta', 'Media', 'Baja'])
  })

  it('degrada al total de recursos cuando no hay relevancia', () => {
    const r = ordenarMunicipiosPorRelevancia([
      muni('Pocos', { total: 2 }),
      muni('Muchos', { total: 30 }),
      muni('Vacio', { total: 0 }),
    ])
    expect(r.map((m) => m.nombre)).toEqual(['Muchos', 'Pocos', 'Vacio'])
  })

  it('a igual puntaje, prioriza los que tienen contenido y luego alfabético', () => {
    const r = ordenarMunicipiosPorRelevancia([
      muni('Zapatoca', { relevancia: 5, tieneContenido: false }),
      muni('Aratoca', { relevancia: 5, tieneContenido: false }),
      muni('Barichara', { relevancia: 5, tieneContenido: true }),
    ])
    expect(r.map((m) => m.nombre)).toEqual(['Barichara', 'Aratoca', 'Zapatoca'])
  })

  it('no muta el arreglo original', () => {
    const entrada = [muni('B', { relevancia: 1 }), muni('A', { relevancia: 2 })]
    const copia = [...entrada]
    ordenarMunicipiosPorRelevancia(entrada)
    expect(entrada).toEqual(copia)
  })
})

describe('señales de completitud de recursos', () => {
  it('esDestacado trata undefined como destacado (degrada) y false como crudo', () => {
    expect(esDestacado({})).toBe(true)
    expect(esDestacado({ completo: true })).toBe(true)
    expect(esDestacado({ completo: false })).toBe(false)
  })

  it('hayCrudos solo es true si hay algún completo:false explícito', () => {
    expect(hayCrudos([{ completo: true }, {}])).toBe(false)
    expect(hayCrudos([{ completo: true }, { completo: false }])).toBe(true)
  })

  it('filtrarDestacados esconde los crudos solo cuando el toggle está activo', () => {
    const items = [{ completo: true }, { completo: false }, {}]
    expect(filtrarDestacados(items, false)).toHaveLength(3)
    expect(filtrarDestacados(items, true)).toEqual([{ completo: true }, {}])
  })

  it('completosPrimero sube los completos preservando el orden relativo', () => {
    const items = [
      { id: 'a', completo: false },
      { id: 'b', completo: true },
      { id: 'c', completo: false },
      { id: 'd', completo: true },
    ]
    expect(completosPrimero(items).map((i) => i.id)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('completosPrimero respeta el orden recibido si no hay ningún completo marcado', () => {
    const items: { id: string; completo?: boolean }[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(completosPrimero(items)).toBe(items)
  })
})

describe('fraseTipica', () => {
  it('siempre devuelve una frase del set', () => {
    expect(FRASES_SANTANDER).toContain(fraseTipica('Barichara'))
  })
  it('es determinista: misma semilla → misma frase', () => {
    expect(fraseTipica('Girón')).toBe(fraseTipica('Girón'))
  })
})

describe('descripcionMunicipio', () => {
  it('usa el contenido editorial cuando existe (reseña primero)', () => {
    const d = descripcionMunicipio(
      { resena: 'Capital del dulce.', leyenda: 'Otra', historia: null },
      { nombre: 'Floridablanca', provincia: 'Soto' },
    )
    expect(d).toEqual({ texto: 'Capital del dulce.', esEditorial: true })
  })

  it('cae a leyenda e historia si la reseña está vacía', () => {
    const d = descripcionMunicipio(
      { resena: '   ', leyenda: '', historia: 'Fundado en 1750.' },
      { nombre: 'X', provincia: null },
    )
    expect(d).toEqual({ texto: 'Fundado en 1750.', esEditorial: true })
  })

  it('recorta el editorial largo sin cortar palabras', () => {
    const largo = 'palabra '.repeat(60).trim()
    const d = descripcionMunicipio({ resena: largo }, { nombre: 'X' }, 50)
    expect(d.esEditorial).toBe(true)
    expect(d.texto.length).toBeLessThanOrEqual(51)
    expect(d.texto.endsWith('…')).toBe(true)
    expect(d.texto).not.toMatch(/palabr…$/) // no corta a mitad de palabra
  })

  it('da un respaldo digno con provincia y una frase típica si no hay editorial', () => {
    const d = descripcionMunicipio({}, { nombre: 'Aratoca', provincia: 'Guanentá' })
    expect(d.esEditorial).toBe(false)
    expect(d.texto).toContain('Municipio de la provincia de Guanentá, Santander.')
    expect(FRASES_SANTANDER.some((f) => d.texto.includes(f))).toBe(true)
  })

  it('respaldo sin provincia no inventa provincia', () => {
    const d = descripcionMunicipio({}, { nombre: 'Aratoca' })
    expect(d.texto.startsWith('Municipio de Santander.')).toBe(true)
  })
})

describe('accesibilidad de sitios', () => {
  it('hayAccesibilidad detecta la señal aditiva', () => {
    expect(hayAccesibilidad([{}, { accesibilidadCompleta: false }])).toBe(true)
    expect(hayAccesibilidad([{}, {}])).toBe(false)
  })

  it('sitiosTop toma los primeros n respetando el orden si no hay señal', () => {
    const s = [
      { id: 'a', completitud: 0.9 },
      { id: 'b', completitud: 0.5 },
      { id: 'c', completitud: 0.1 },
      { id: 'd', completitud: 0 },
    ]
    expect(sitiosTop(s, 2).map((x) => x.id)).toEqual(['a', 'b'])
  })

  it('sitiosTop sube los de accesibilidad completa (orden estable)', () => {
    const s = [
      { id: 'a', accesibilidadCompleta: false },
      { id: 'b', accesibilidadCompleta: true },
      { id: 'c', accesibilidadCompleta: false },
      { id: 'd', accesibilidadCompleta: true },
    ]
    expect(sitiosTop(s, 3).map((x) => x.id)).toEqual(['b', 'd', 'a'])
  })

  it('sitiosTop combina completosPrimero con accesibilidad', () => {
    const s = [
      { id: 'a', completo: false, accesibilidadCompleta: false },
      { id: 'b', completo: true, accesibilidadCompleta: false },
      { id: 'c', completo: false, accesibilidadCompleta: true },
    ]
    // completosPrimero → [b, c, a]; luego accesibles arriba → [c, b, a]
    expect(sitiosTop(s, 3).map((x) => x.id)).toEqual(['c', 'b', 'a'])
  })
})
