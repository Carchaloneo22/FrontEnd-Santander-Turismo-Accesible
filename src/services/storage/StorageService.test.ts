// src/services/storage/StorageService.test.ts
import { StorageService } from './StorageService'
import { MemoryStorageBackend, type StorageBackend } from './StorageBackend'

describe('StorageService', () => {
  let store: StorageService

  beforeEach(() => {
    // Inyectamos un backend EN MEMORIA (real, aislado) → sin tocar el navegador.
    store = new StorageService(new MemoryStorageBackend())
  })

  it('guarda y recupera un valor (round-trip)', () => {
    store.set('nombre', 'Ana')
    expect(store.get<string>('nombre')).toBe('Ana')
  })

  it('serializa y deserializa objetos', () => {
    const cart = [{ id: 1, qty: 2 }]
    store.set('cart', cart)
    expect(store.get('cart')).toEqual(cart) // igualdad profunda
  })

  it('devuelve el fallback si la clave no existe', () => {
    expect(store.get('noexiste', 'default')).toBe('default')
    expect(store.get('noexiste')).toBeNull()
  })

  it('has() indica si existe la clave', () => {
    store.set('x', 1)
    expect(store.has('x')).toBe(true)
    expect(store.has('y')).toBe(false)
  })

  it('remove() elimina la clave', () => {
    store.set('x', 1)
    store.remove('x')
    expect(store.has('x')).toBe(false)
  })

  it('devuelve el fallback si el JSON está corrupto', () => {
    // test double que devuelve texto NO-JSON
    const corrupto: StorageBackend = {
      getItem: () => '{no es json',
      setItem: () => {},
      removeItem: () => {},
    }
    const s = new StorageService(corrupto)
    expect(s.get('x', 'fallback')).toBe('fallback')
  })

  it('aplica el prefijo sa_ a las claves', () => {
    const escritas: string[] = []
    const spyBackend: StorageBackend = {
      getItem: () => null,
      setItem: (key) => escritas.push(key),
      removeItem: () => {},
    }
    const s = new StorageService(spyBackend)
    s.set('tema', 'dark')
    expect(escritas).toContain('sa_tema') // la clave real lleva el prefijo
  })

  it('cae a memoria si el backend falla (degradación elegante)', () => {
    // test double que SIEMPRE lanza → el constructor debe detectarlo y usar memoria
    const roto: StorageBackend = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
      removeItem: () => {
        throw new Error('bloqueado')
      },
    }
    const s = new StorageService(roto)
    s.set('x', 1)
    expect(s.get('x')).toBe(1) // funciona igual, gracias al fallback a memoria
  })
})