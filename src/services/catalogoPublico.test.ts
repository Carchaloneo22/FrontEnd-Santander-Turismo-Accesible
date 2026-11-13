import { afterEach, describe, expect, it, vi } from 'vitest'
import { transporteService } from './TransporteService'
import { hospedajeService } from './HospedajeService'
import { planesService } from './PlanesService'
import { ofertasService, type OfertaPublica, type ListadoOfertas } from './OfertasService'

/**
 * Regresión: los catálogos públicos (transporte/hospedaje/planes) deben caer al
 * JSON mock SOLO cuando el backend es INALCANZABLE. Si el backend responde OK con
 * 0 ofertas, la lista queda VACÍA (la página muestra su estado vacío). Antes se
 * caía al mock con 0 items y esas tarjetas falsas llevaban slugs inexistentes, así
 * que la ficha de detalle daba "no encontrada".
 */

function oferta(over: Partial<OfertaPublica> = {}): OfertaPublica {
  return {
    id: 'o1',
    gestor: { id: 'g1', nombreComercial: 'Operador Demo' },
    tipo: 'hospedaje',
    titulo: 'Oferta real',
    slug: 'oferta-real',
    descripcion: null,
    precioIncluyeImpuestos: false,
    estado: 'publicada',
    accesibilidad: {
      motriz: 'declarado',
      visual: 'sin_info',
      auditiva: 'sin_info',
      cognitiva: 'sin_info',
    },
    destacado: false,
    activo: true,
    lugares: [],
    creadoEn: '',
    actualizadoEn: '',
    ...over,
  }
}

const vacio: ListadoOfertas = {
  items: [],
  paginacion: { pagina: 1, tamano: 100, total: 0, paginas: 0 },
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('catálogos públicos: backend vacío ≠ mock', () => {
  it('transporte: backend OK con 0 ofertas → lista vacía (NO mock)', async () => {
    const listar = vi.spyOn(ofertasService, 'listar').mockResolvedValue(vacio)
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const res = await transporteService.listarPublico()
    expect(res).toEqual([])
    expect(listar).toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled() // no recurre al JSON mock
  })

  it('hospedaje: backend OK con ofertas → mapea el slug REAL de la oferta', async () => {
    vi.spyOn(ofertasService, 'listar').mockResolvedValue({
      ...vacio,
      items: [oferta({ tipo: 'hospedaje', slug: 'posada-barichara' })],
    })
    const res = await hospedajeService.listarPublico()
    expect(res).toHaveLength(1)
    expect(res[0].slug).toBe('posada-barichara')
  })

  it('transporte: backend INALCANZABLE → cae al JSON mock', async () => {
    vi.spyOn(ofertasService, 'listar').mockRejectedValue(new Error('network'))
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, origen: 'Mock', destino: 'Mock', precio: 0 }]), {
        status: 200,
      }),
    )
    const res = await transporteService.listarPublico()
    expect(fetchSpy).toHaveBeenCalled()
    expect(res).toHaveLength(1)
  })

  it('planes: backend OK con 0 ofertas (experiencia + guianza) → lista vacía (NO mock)', async () => {
    vi.spyOn(ofertasService, 'listar').mockResolvedValue(vacio)
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const res = await planesService.listarPublico()
    expect(res).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
