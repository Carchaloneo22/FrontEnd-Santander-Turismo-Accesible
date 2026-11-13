// src/services/ServiceDebugger.test.ts
import { serviceDebugger, type ServiceCall } from './ServicesDebugger'

// Helper para fabricar una llamada de prueba rápida.
function makeCall(id: string): ServiceCall {
  return {
    id,
    timestamp: new Date().toISOString(),
    serviceName: 'Test',
    method: 'GET',
    endpoint: '/x',
    fullUrl: '/php/x',
    duration: 0,
    status: 'pending',
  }
}

describe('ServiceDebugger', () => {
  // Es un Singleton: su estado persiste. Limpiamos antes de cada test.
  beforeEach(() => {
    serviceDebugger.clear()
  })

  it('registra una llamada nueva y notifica', () => {
    const listener = vi.fn()
    serviceDebugger.subscribe(listener)
    serviceDebugger.logServiceCall(makeCall('a'))
    const ultimaLista = listener.mock.calls.at(-1)?.[0]
    expect(ultimaLista).toHaveLength(1)
    expect(ultimaLista[0].id).toBe('a')
  })

  it('al suscribirse, entrega el estado actual de inmediato', () => {
    serviceDebugger.logServiceCall(makeCall('a'))
    const listener = vi.fn()
    serviceDebugger.subscribe(listener)
    expect(listener).toHaveBeenCalledWith([expect.objectContaining({ id: 'a' })])
  })

  it('updateServiceCall completa una llamada existente', () => {
    serviceDebugger.logServiceCall(makeCall('a'))
    serviceDebugger.updateServiceCall({ id: 'a', duration: 50, status: 'success', statusCode: 200 })
    const listener = vi.fn()
    serviceDebugger.subscribe(listener)
    const calls = listener.mock.calls.at(-1)?.[0]
    expect(calls[0].status).toBe('success')
    expect(calls[0].duration).toBe(50)
  })

  it('la llamada más reciente queda de primera', () => {
    serviceDebugger.logServiceCall(makeCall('a'))
    serviceDebugger.logServiceCall(makeCall('b'))
    const listener = vi.fn()
    serviceDebugger.subscribe(listener)
    const calls = listener.mock.calls.at(-1)?.[0]
    expect(calls[0].id).toBe('b') // unshift → la nueva primero
    expect(calls[1].id).toBe('a')
  })

  it('des-suscribirse detiene las notificaciones', () => {
    const listener = vi.fn()
    const off = serviceDebugger.subscribe(listener)
    off()
    listener.mockClear() // olvidamos la notificación inicial de la suscripción
    serviceDebugger.logServiceCall(makeCall('a'))
    expect(listener).not.toHaveBeenCalled()
  })

  it('clear() vacía el registro', () => {
    serviceDebugger.logServiceCall(makeCall('a'))
    const listener = vi.fn()
    serviceDebugger.subscribe(listener)
    serviceDebugger.clear()
    const calls = listener.mock.calls.at(-1)?.[0]
    expect(calls).toHaveLength(0)
  })
})