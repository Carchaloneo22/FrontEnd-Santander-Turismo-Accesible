// src/services/base/HttpServiceBase.test.ts
import type { AxiosAdapter, AxiosResponse } from 'axios'
import { HttpServiceBase } from './HttpServiceBase'

// Subclase de prueba: expone los métodos protected y permite inyectar el adapter.
class TestService extends HttpServiceBase {
  callGet<T>(endpoint: string) {
    return this.get<T>(endpoint)
  }
  callGetRetry<T>(endpoint: string, maxRetries: number) {
    return this.get<T>(endpoint, {}, { retry: true, maxRetries, retryDelay: 0 })
  }
  useAdapter(fn: AxiosAdapter) {
    this.client.defaults.adapter = fn
  }
}

// Helper: adapter falso que responde SIEMPRE con el cuerpo dado (sin red).
function respondWith(body: unknown, status = 200): AxiosAdapter {
  return async (config) =>
    ({ data: body, status, statusText: 'OK', headers: {}, config }) as AxiosResponse
}

describe('HttpServiceBase', () => {
  let svc: TestService

  beforeEach(() => {
    svc = new TestService()
  })

  it('desanida la data del sobre { ok: true, data }', async () => {
    svc.useAdapter(respondWith({ ok: true, data: { id: 1, nombre: 'Ruta' } }))
    const result = await svc.callGet<{ id: number; nombre: string }>('/transporte/listar.php')
    expect(result).toEqual({ id: 1, nombre: 'Ruta' }) // recibe SOLO la data, ya desanidada
  })

  it('rechaza con el error del sobre { ok: false, error }', async () => {
    svc.useAdapter(respondWith({ ok: false, error: 'No autorizado' }))
    await expect(svc.callGet('/x')).rejects.toMatchObject({ message: 'No autorizado' })
  })

  it('normaliza un error HTTP (status + message)', async () => {
    const failing: AxiosAdapter = async () =>
      Promise.reject({
        response: { status: 500, data: { error: 'Boom' } },
        message: 'Request failed',
      })
    svc.useAdapter(failing)
    await expect(svc.callGet('/x')).rejects.toMatchObject({ status: 500, message: 'Boom' })
  })

  it('reintenta en error 5xx y termina exitoso', async () => {
    let attempts = 0
    const flaky: AxiosAdapter = async (config) => {
      attempts++
      if (attempts < 3) {
        return Promise.reject({
          response: { status: 500, data: { error: 'fail' } },
          message: 'fail',
        })
      }
      return {
        data: { ok: true, data: 'listo' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      } as AxiosResponse
    }
    svc.useAdapter(flaky)
    const result = await svc.callGetRetry<string>('/x', 3)
    expect(result).toBe('listo')
    expect(attempts).toBe(3) // falló 2 veces, éxito a la 3ª
  })

  it('NO reintenta en error 4xx (salvo 429)', async () => {
    let attempts = 0
    const clientError: AxiosAdapter = async () => {
      attempts++
      return Promise.reject({ response: { status: 400, data: { error: 'malo' } }, message: 'bad' })
    }
    svc.useAdapter(clientError)
    await expect(svc.callGetRetry('/x', 3)).rejects.toMatchObject({ status: 400 })
    expect(attempts).toBe(1) // no reintentó: 4xx es error del cliente
  })
})
