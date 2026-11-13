// src/lib/EventBus.test.ts
import { EventBus } from './EventBus'

// Mapa de eventos de prueba (recuerda: 'type', no 'interface')
type TestEvents = {
  greet: string
  count: number
}

describe('EventBus', () => {
  let bus: EventBus<TestEvents>

  // Instancia nueva antes de cada test → ninguno contamina al otro.
  beforeEach(() => {
    bus = new EventBus<TestEvents>()
  })

  it('llama al handler cuando se emite su evento', () => {
    const handler = vi.fn()
    bus.on('greet', handler)
    bus.emit('greet', 'hola')
    expect(handler).toHaveBeenCalledWith('hola')
  })

  it('no llama handlers de otros eventos', () => {
    const greetH = vi.fn()
    const countH = vi.fn()
    bus.on('greet', greetH)
    bus.on('count', countH)
    bus.emit('greet', 'hola')
    expect(greetH).toHaveBeenCalledTimes(1)
    expect(countH).not.toHaveBeenCalled()
  })

  it('llama a múltiples handlers del mismo evento', () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    bus.on('count', h1)
    bus.on('count', h2)
    bus.emit('count', 5)
    expect(h1).toHaveBeenCalledWith(5)
    expect(h2).toHaveBeenCalledWith(5)
  })

  it('la función devuelta por on() des-suscribe', () => {
    const handler = vi.fn()
    const off = bus.on('greet', handler)
    off()
    bus.emit('greet', 'hola')
    expect(handler).not.toHaveBeenCalled()
  })

  it('off() des-suscribe un handler concreto', () => {
    const handler = vi.fn()
    bus.on('greet', handler)
    bus.off('greet', handler)
    bus.emit('greet', 'hola')
    expect(handler).not.toHaveBeenCalled()
  })

  it('once() solo se dispara una vez', () => {
    const handler = vi.fn()
    bus.once('count', handler)
    bus.emit('count', 1)
    bus.emit('count', 2)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(1)
  })

  it('clear(evento) elimina solo ese evento', () => {
    const greetH = vi.fn()
    const countH = vi.fn()
    bus.on('greet', greetH)
    bus.on('count', countH)
    bus.clear('greet')
    bus.emit('greet', 'hola')
    bus.emit('count', 5)
    expect(greetH).not.toHaveBeenCalled()
    expect(countH).toHaveBeenCalledTimes(1)
  })

  it('clear() sin argumentos elimina todos', () => {
    const greetH = vi.fn()
    const countH = vi.fn()
    bus.on('greet', greetH)
    bus.on('count', countH)
    bus.clear()
    bus.emit('greet', 'hola')
    bus.emit('count', 5)
    expect(greetH).not.toHaveBeenCalled()
    expect(countH).not.toHaveBeenCalled()
  })
})