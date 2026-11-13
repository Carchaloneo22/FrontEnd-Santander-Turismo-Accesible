import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { OfertaPublica } from '../../services/OfertasService'
import type { Lugar } from '../../services/LugaresService'
import { PrestadorDetallePage } from './PrestadorDetallePage'

const hospedajeDetalle = vi.fn()
const lugarDetalle = vi.fn()
vi.mock('../../services', () => ({
  hospedajeService: { detallePublico: (s: string) => hospedajeDetalle(s) },
  transporteService: { detallePublico: vi.fn() },
  planesService: { detallePublico: vi.fn() },
  lugaresService: { detalle: (s: string) => lugarDetalle(s) },
}))

const OFERTA: OfertaPublica = {
  id: 'o1',
  gestor: { id: 'g1', nombreComercial: 'Posada Demo Santander' },
  tipo: 'hospedaje',
  titulo: 'Posada Demo en Barichara',
  slug: 'posada-demo',
  descripcion: 'Alojamiento de ejemplo en Barichara.',
  precioIncluyeImpuestos: true,
  estado: 'publicada',
  accesibilidad: {
    motriz: 'declarado',
    visual: 'sin_info',
    auditiva: 'sin_info',
    cognitiva: 'sin_info',
  },
  destacado: false,
  activo: true,
  lugares: [{ id: 'l1', nombre: 'Camino Real', slug: 'camino-real', orden: 0 }],
  creadoEn: '2026-01-01',
  actualizadoEn: '2026-01-01',
}

const LUGAR_VINCULADO: Partial<Lugar> = {
  id: 'l1',
  nombre: 'Camino Real',
  slug: 'camino-real',
  telefono: '+57 607 700 1122',
  sitioWeb: 'https://barichara.gov.co',
  direccion: 'Barichara centro',
  latitud: null,
  longitud: null,
}

describe('PrestadorDetallePage (hospedaje)', () => {
  beforeEach(() => {
    hospedajeDetalle.mockReset()
    lugarDetalle.mockReset()
  })
  afterEach(async () => {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
  })

  it('muestra la oferta real + prestador + contacto del lugar vinculado', async () => {
    hospedajeDetalle.mockResolvedValue(OFERTA)
    lugarDetalle.mockResolvedValue(LUGAR_VINCULADO as Lugar)

    render(
      <MemoryRouter initialEntries={['/hospedaje/posada-demo']}>
        <Routes>
          <Route path="/hospedaje/:slug" element={<PrestadorDetallePage tipo="hospedaje" />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: /posada demo/i }),
    ).toBeInTheDocument()
    // Prestador visible.
    expect(screen.getByRole('heading', { name: /posada demo santander/i })).toBeInTheDocument()
    // Contacto del lugar vinculado (real), accionable.
    expect(screen.getByRole('link', { name: /llamar al/i })).toHaveAttribute(
      'href',
      'tel:+576077001122',
    )
    // Enlace al lugar vinculado.
    expect(screen.getByRole('link', { name: 'Camino Real' })).toHaveAttribute(
      'href',
      '/lugares/camino-real',
    )
    // Accesibilidad declarada (no verificada) por dimensión.
    expect(
      screen.getByLabelText('Accesibilidad movilidad: Declarada (sin verificar)'),
    ).toBeInTheDocument()
  })

  it('sigue siendo útil aunque falle la carga del lugar vinculado', async () => {
    hospedajeDetalle.mockResolvedValue(OFERTA)
    lugarDetalle.mockImplementation(() => {
      // Rechazo ya "manejado": evita el falso positivo de unhandled rejection.
      const p = Promise.reject(new Error('no disponible'))
      p.catch(() => {})
      return p
    })

    render(
      <MemoryRouter initialEntries={['/hospedaje/posada-demo']}>
        <Routes>
          <Route path="/hospedaje/:slug" element={<PrestadorDetallePage tipo="hospedaje" />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: /posada demo/i }),
    ).toBeInTheDocument()
    // Sin contacto del lugar → mensaje honesto, no inventado.
    expect(screen.getByText(/aún no publicó datos de contacto directo/i)).toBeInTheDocument()
  })
})
