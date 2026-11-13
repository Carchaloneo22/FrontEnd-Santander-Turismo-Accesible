import { describe, it, expect, beforeEach } from 'vitest'
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios'
import { academiaService } from './AcademiaService'

type ClientRef = { client: { defaults: { adapter: AxiosAdapter } } }

/** Adapter falso: responde con el sobre NestJS y registra cada petición. */
function instalar(
  responder: (config: AxiosRequestConfig) => { status?: number; datos?: unknown; exito?: boolean },
) {
  const peticiones: AxiosRequestConfig[] = []
  const adapter: AxiosAdapter = async (config) => {
    peticiones.push(config)
    const r = responder(config)
    const exito = r.exito ?? true
    if (!exito) {
      throw {
        response: { status: r.status ?? 400, data: { exito: false, mensaje: 'Error' } },
        message: 'Request failed',
        config,
      }
    }
    return {
      data: { exito: true, datos: r.datos },
      status: r.status ?? 200,
      statusText: 'OK',
      headers: {},
      config,
    } as AxiosResponse
  }
  ;(academiaService as unknown as ClientRef).client.defaults.adapter = adapter
  return peticiones
}

describe('AcademiaService.cursos', () => {
  it('pide /cursos con la categoría y devuelve la lista (portada normalizada)', async () => {
    const peticiones = instalar(() => ({
      datos: [
        {
          id: 'c1',
          slug: 'rnt-paso-a-paso',
          titulo: 'RNT',
          categoria: 'rnt',
          portada: 'https://img/x.jpg',
        },
      ],
    }))
    const r = await academiaService.cursos('rnt')
    expect(peticiones[0].url).toBe('/cursos')
    expect(peticiones[0].params).toEqual({ categoria: 'rnt' })
    expect(r).toHaveLength(1)
    // Portada cadena → objeto {url} para FotoConCredito.
    expect(r[0].portada).toEqual({ url: 'https://img/x.jpg' })
  })

  it('acepta un listado envuelto en { items }', async () => {
    instalar(() => ({
      datos: { items: [{ id: 'c1', slug: 's', titulo: 'T', categoria: 'general' }] },
    }))
    const r = await academiaService.cursos()
    expect(r).toHaveLength(1)
  })

  it('degrada a lista vacía cuando el backend falla', async () => {
    instalar(() => ({ exito: false, status: 404 }))
    const r = await academiaService.cursos()
    expect(r).toEqual([])
  })
})

describe('AcademiaService.curso', () => {
  it('pide /cursos/:slug (escapado) y asegura un array de pasos', async () => {
    const peticiones = instalar(() => ({
      datos: { id: 'c1', slug: 'mi curso', titulo: 'Mi curso', categoria: 'documentos' },
    }))
    const r = await academiaService.curso('mi curso')
    expect(peticiones[0].url).toBe('/cursos/mi%20curso')
    expect(r.pasos).toEqual([])
  })

  it('propaga el error (sin respaldo) para el estado de error de la ficha', async () => {
    instalar(() => ({ exito: false, status: 404 }))
    await expect(academiaService.curso('no-existe')).rejects.toBeTruthy()
  })
})

describe('AcademiaService.miProgreso', () => {
  it('devuelve el progreso con sesión', async () => {
    instalar(() => ({ datos: { cursos: [{ cursoId: 'c1', completado: true }] } }))
    const r = await academiaService.miProgreso()
    expect(r?.cursos[0].completado).toBe(true)
  })

  it('devuelve null (sin lanzar) cuando no hay sesión (401)', async () => {
    instalar(() => ({ exito: false, status: 401 }))
    const r = await academiaService.miProgreso()
    expect(r).toBeNull()
  })
})

describe('AcademiaService.marcarProgreso', () => {
  beforeEach(() => {
    // Reinicia el token CSRF cacheado entre pruebas.
    ;(academiaService as unknown as { csrf: string | null }).csrf = null
  })

  it('pide el CSRF y hace POST con la cabecera X-CSRF-Token', async () => {
    const peticiones = instalar((config) => {
      if (config.url === '/auth/csrf') return { datos: { csrfToken: 'tok-123' } }
      return { datos: null }
    })
    await academiaService.marcarProgreso('c1', true)
    const post = peticiones.find((p) => p.url === '/cursos/c1/progreso')
    expect(post).toBeTruthy()
    expect(post?.method?.toLowerCase()).toBe('post')
    expect(post?.data).toBe(JSON.stringify({ completado: true }))
    // La cabecera CSRF viaja en la petición.
    const headers = post?.headers as Record<string, unknown> | undefined
    expect(headers?.['X-CSRF-Token']).toBe('tok-123')
  })
})
