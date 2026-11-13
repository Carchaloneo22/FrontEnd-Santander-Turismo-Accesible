import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Artesano } from '../../services/ArtesanosService'
import { ArtesanoDetallePage } from './ArtesanoDetallePage'

const detalle = vi.fn()
vi.mock('../../services', () => ({
  artesanosService: { detalle: (s: string) => detalle(s) },
}))

function renderPage(slug = 'maria-tejedora') {
  return render(
    <MemoryRouter initialEntries={[`/artesanos/${slug}`]}>
      <Routes>
        <Route path="/artesanos/:slug" element={<ArtesanoDetallePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ArtesanoDetallePage', () => {
  beforeEach(() => detalle.mockReset())

  // El estado "directorio aún no disponible" (hoy el backend protege /artesanos,
  // así que useRecurso rechaza) se renderiza con EstadoError y el mensaje por
  // defecto de la página; esa pieza se prueba aislada en
  // features/detalle/EstadoError.test.tsx para no depender de la promesa
  // rechazada de useRecurso (ver nota allí).
  it('renderiza el perfil con especialidades y contacto cuando el backend lo expone', async () => {
    const artesano: Artesano = {
      id: 'a1',
      slug: 'maria-tejedora',
      nombre: 'María Tejedora',
      oficio: 'Tejido en fique',
      biografia: 'Artesana de Curití con 30 años de oficio.',
      municipio: 'Curití',
      especialidades: ['Mochilas', 'Hamacas'],
      productos: [{ nombre: 'Mochila de fique', descripcion: 'Tejida a mano', imagen: null }],
      contacto: {
        telefono: '+57 300 111 2233',
        email: 'maria@fique.co',
        sitioWeb: null,
        whatsapp: null,
      },
      imagen: null,
      activo: true,
    }
    detalle.mockResolvedValue(artesano)
    renderPage()

    expect(
      await screen.findByRole('heading', { level: 1, name: /maría tejedora/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Mochilas')).toBeInTheDocument()
    expect(screen.getByText('Mochila de fique')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /llamar al/i })).toHaveAttribute(
      'href',
      'tel:+573001112233',
    )
  })
})
