import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Lugar } from '../../services/LugaresService'
import { LugarDetallePage } from './LugarDetallePage'

const detalle = vi.fn()
vi.mock('../../services', () => ({
  lugaresService: { detalle: (slug: string) => detalle(slug) },
}))

const LUGAR: Lugar = {
  id: '1',
  nombre: 'Catedral de la Santa Cruz',
  slug: 'catedral-malaga',
  tipo: 'atractivo_turistico',
  descripcion: 'Una catedral imponente en el centro de Málaga.',
  historia: 'Construida en el siglo XIX.',
  latitud: 6.7,
  longitud: -72.7,
  direccion: 'Parque principal, Málaga',
  telefono: '+57 607 660 0000',
  sitioWeb: 'https://malaga.gov.co',
  accesibilidad: { motriz: 'total', visual: 'parcial', auditiva: 'sin_info', cognitiva: 'nula' },
  imagen: null,
  destacado: false,
  orden: 0,
  activo: true,
  municipios: [{ id: 'm1', nombre: 'Málaga', principal: true }],
  modalidades: [{ id: 'mo1', nombre: 'Cultural', clave: 'cultural' }],
  creadoEn: '2026-01-01',
  actualizadoEn: '2026-01-01',
}

describe('LugarDetallePage', () => {
  beforeEach(() => detalle.mockReset())

  // La ruta de ERROR (backend rechaza → EstadoError) se prueba de forma aislada
  // en features/detalle/EstadoError.test.tsx, no a través de la promesa rechazada
  // de useRecurso: así el test queda determinista (ver nota en ese archivo).
  it('muestra la ficha real: nombre, accesibilidad por dimensión y contacto', async () => {
    detalle.mockResolvedValue(LUGAR)
    render(
      <MemoryRouter initialEntries={['/lugares/catedral-malaga']}>
        <Routes>
          <Route path="/lugares/:slug" element={<LugarDetallePage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: /catedral/i })).toBeInTheDocument()
    // Accesibilidad narrable (aria-label completo por dimensión).
    expect(screen.getByLabelText('Accesibilidad movilidad: Accesible')).toBeInTheDocument()
    expect(screen.getByLabelText('Accesibilidad cognitiva: No accesible')).toBeInTheDocument()
    // Contacto accionable.
    expect(screen.getByRole('link', { name: /llamar al/i })).toHaveAttribute(
      'href',
      'tel:+576076600000',
    )
    // Breadcrumb presente.
    expect(screen.getByRole('navigation', { name: /ruta de navegación/i })).toBeInTheDocument()
    // Mini-mapa (hay coordenadas).
    expect(screen.getByTitle(/mapa de la ubicación de catedral/i)).toBeInTheDocument()
  })
})
