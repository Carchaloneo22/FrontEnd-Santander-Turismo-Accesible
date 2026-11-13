import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { axe } from '@/test/a11y'

vi.mock('../../services', () => ({
  academiaService: {
    curso: () =>
      Promise.resolve({
        id: 'c1',
        slug: 'rnt-paso-a-paso',
        titulo: 'RNT paso a paso',
        categoria: 'rnt',
        descripcion: 'Cómo inscribirte en el RNT',
        portada: null,
        duracionMin: 25,
        pasos: [
          {
            titulo: 'Qué es el RNT',
            contenido: 'Es un registro gratuito.',
            videoUrl: 'https://youtu.be/abc',
          },
          { titulo: 'Cómo inscribirte', contenido: 'Entra a rnt.confecamaras.co.' },
        ],
      }),
    miProgreso: () => Promise.resolve({ cursos: [] }),
    marcarProgreso: () => Promise.resolve(),
  },
}))

import { CursoDetallePage } from './CursoDetallePage'

describe('CursoDetallePage — accesibilidad (WCAG 2.1 AA)', () => {
  it('no tiene violaciones en la ficha de un curso (con sesión)', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/cursos/rnt-paso-a-paso']}>
        <Routes>
          <Route path="/cursos/:slug" element={<CursoDetallePage />} />
        </Routes>
      </MemoryRouter>,
    )
    // Espera a que la ficha pinte (y el botón de progreso, que depende de sesión).
    await screen.findByRole('button', { name: /marcar como completado/i })
    expect(await axe(container)).toHaveNoViolations()
  })
})
