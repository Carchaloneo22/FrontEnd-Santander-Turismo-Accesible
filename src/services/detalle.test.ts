import { describe, it, expect } from 'vitest'
import type { AxiosAdapter, AxiosResponse } from 'axios'
import { ofertasService } from './OfertasService'
import { artesanosService } from './ArtesanosService'
import { hospedajeService } from './HospedajeService'
import { transporteService } from './TransporteService'
import { planesService } from './PlanesService'

/**
 * Instala un adapter falso en el cliente axios de un servicio (sin red): registra
 * la URL pedida y responde con el sobre NestJS { exito, datos }. `client` es
 * protected en compilación, pero existe en runtime; el cast lo alcanza en test.
 */
function espiar(svc: unknown, datos: unknown) {
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
  ;(svc as { client: { defaults: { adapter: AxiosAdapter } } }).client.defaults.adapter = adapter
  return ref
}

describe('OfertasService.detalle', () => {
  it('pide /ofertas/:slug (slug escapado) y desanida datos', async () => {
    const ref = espiar(ofertasService, { id: 'o1', titulo: 'Posada' })
    const r = await ofertasService.detalle('posada demo')
    expect(ref.url).toBe('/ofertas/posada%20demo')
    expect(r).toMatchObject({ id: 'o1', titulo: 'Posada' })
  })
})

describe('detallePublico delega en ofertasService.detalle', () => {
  it('hospedaje → /ofertas/:slug', async () => {
    const ref = espiar(ofertasService, { id: 'h1' })
    await hospedajeService.detallePublico('posada')
    expect(ref.url).toBe('/ofertas/posada')
  })
  it('transporte → /ofertas/:slug', async () => {
    const ref = espiar(ofertasService, { id: 't1' })
    await transporteService.detallePublico('ruta')
    expect(ref.url).toBe('/ofertas/ruta')
  })
  it('planes → /ofertas/:slug', async () => {
    const ref = espiar(ofertasService, { id: 'p1' })
    await planesService.detallePublico('tour')
    expect(ref.url).toBe('/ofertas/tour')
  })
})

describe('ArtesanosService.detalle', () => {
  it('pide /artesanos/:slug', async () => {
    const ref = espiar(artesanosService, { id: 'a1', nombre: 'María' })
    const r = await artesanosService.detalle('maria')
    expect(ref.url).toBe('/artesanos/maria')
    expect(r).toMatchObject({ nombre: 'María' })
  })
})
