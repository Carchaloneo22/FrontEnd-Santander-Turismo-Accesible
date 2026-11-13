import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Lugar } from '../../services/LugaresService'
import { axe } from '../../test/a11y'
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

describe('LugarDetallePage (ficha de detalle) — accesibilidad (WCAG 2.1 AA)', () => {
  beforeEach(() => detalle.mockReset())

  it('no tiene violaciones en la ficha real', async () => {
    detalle.mockResolvedValue(LUGAR)
    const { container } = render(
      <MemoryRouter initialEntries={['/lugares/catedral-malaga']}>
        <Routes>
          <Route path="/lugares/:slug" element={<LugarDetallePage />} />
        </Routes>
      </MemoryRouter>,
    )
    // Esperar a que la ficha esté montada antes de auditar.
    await screen.findByRole('heading', { level: 1, name: /catedral/i })
    expect(await axe(container)).toHaveNoViolations()
  })
})
