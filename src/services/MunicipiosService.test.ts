import { describe, it, expect } from 'vitest'
import type { AxiosAdapter, AxiosResponse } from 'axios'
import { municipiosService } from './MunicipiosService'

type ClientRef = { client: { defaults: { adapter: AxiosAdapter } } }

/** Instala un adapter falso (sin red) que responde con el sobre NestJS y registra la URL. */
function espiar(datos: unknown) {
  const ref = { url: '' }
  const adapter: AxiosAdapter = async (config) => {
    ref.url = config.url ?? ''
    return {
      data: { exito: true, datos },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    } as AxiosResponse
  }
  ;(municipiosService as unknown as ClientRef).client.defaults.adapter = adapter
  return ref
}

/** Instala un adapter que SIEMPRE falla (simula el backend caído / endpoint 404). */
function espiarFallo(status = 404) {
  const adapter: AxiosAdapter = async (config) => {
    throw {
      response: { status, data: { exito: false, mensaje: 'No encontrado' } },
      message: 'Request failed',
      config,
    }
  }
  ;(municipiosService as unknown as ClientRef).client.defaults.adapter = adapter
}

describe('MunicipiosService.recursos', () => {
  it('pide /municipios/recursos y devuelve items + totales', async () => {
    const payload = {
      items: [
        {
          id: 'm1',
          nombre: 'GIRÓN',
          codigo: '307',
          codigoDane: '68307',
          provincia: { id: 'p1', nombre: 'Metropolitana' },
          latitud: 7.07,
          longitud: -73.17,
          imagen: null,
          tieneContenido: true,
          relevancia: 42,
          recursos: { sitios: 3, artesanos: 1, prestadores: 2, total: 6 },
        },
      ],
      totales: { municipios: 1, sitios: 3, artesanos: 1, prestadores: 2 },
    }
    const ref = espiar(payload)
    const r = await municipiosService.recursos()
    expect(ref.url).toBe('/municipios/recursos')
    expect(r.items).toHaveLength(1)
    expect(r.items[0].codigoDane).toBe('68307')
    // Campo ADITIVO del backend nuevo: pasa sin tocarse.
    expect(r.items[0].relevancia).toBe(42)
    expect(r.totales.municipios).toBe(1)
  })

  it('degrada a vacío (no lanza) cuando el backend falla', async () => {
    espiarFallo(404)
    const r = await municipiosService.recursos()
    expect(r.items).toEqual([])
    expect(r.totales).toEqual({ municipios: 0, sitios: 0, artesanos: 0, prestadores: 0 })
  })

  it('tolera un payload sin items/totales (degrada a vacío)', async () => {
    espiar({})
    const r = await municipiosService.recursos()
    expect(r.items).toEqual([])
    expect(r.totales.municipios).toBe(0)
  })
})

describe('MunicipiosService.ficha', () => {
  it('pide /municipios/:id/recursos (id escapado) y desanida datos', async () => {
    const ref = espiar({
      id: 'm1',
      nombre: 'Barichara',
      sitios: [],
      artesanos: [],
      prestadores: [],
    })
    const r = await municipiosService.ficha('m1 raro')
    expect(ref.url).toBe('/municipios/m1%20raro/recursos')
    expect(r).toMatchObject({ id: 'm1', nombre: 'Barichara' })
  })

  it('propaga la señal de completitud (completo) de los recursos sin tocarla', async () => {
    espiar({
      id: 'm1',
      nombre: 'Barichara',
      sitios: [
        {
          id: 's1',
          nombre: 'Curado',
          slug: 'curado',
          categoria: null,
          imagen: null,
          completo: true,
        },
        {
          id: 's2',
          nombre: 'Crudo OSM',
          slug: 'crudo',
          categoria: null,
          imagen: null,
          completo: false,
        },
      ],
      artesanos: [],
      prestadores: [],
    })
    const r = await municipiosService.ficha('m1')
    expect(r.sitios[0].completo).toBe(true)
    expect(r.sitios[1].completo).toBe(false)
  })

  it('propaga el error (sin respaldo) para que la ficha muestre el estado de error', async () => {
    espiarFallo(404)
    await expect(municipiosService.ficha('no-existe')).rejects.toBeTruthy()
  })
})
