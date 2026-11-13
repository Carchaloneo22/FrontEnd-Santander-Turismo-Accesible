import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const curso = vi.fn()
const miProgreso = vi.fn()
const marcarProgreso = vi.fn()
vi.mock('../../services', () => ({
  academiaService: {
    curso: (slug: string) => curso(slug),
    miProgreso: () => miProgreso(),
    marcarProgreso: (id: string, c: boolean) => marcarProgreso(id, c),
  },
}))

import { CursoDetallePage } from './CursoDetallePage'

const CURSO = {
  id: 'c1',
  slug: 'rnt-paso-a-paso',
  titulo: 'RNT paso a paso',
  categoria: 'rnt',
  descripcion: 'Cómo inscribirte en el RNT',
  portada: null,
  pasos: [
    {
      titulo: 'Qué es el RNT',
      contenido: 'Es un registro gratuito.',
      videoUrl: 'https://youtu.be/abc123',
    },
    { titulo: 'Cómo inscribirte', contenido: 'Entra a rnt.confecamaras.co.' },
  ],
}

function renderFicha() {
  return render(
    <MemoryRouter initialEntries={['/cursos/rnt-paso-a-paso']}>
      <Routes>
        <Route path="/cursos/:slug" element={<CursoDetallePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CursoDetallePage (ficha pública)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    curso.mockResolvedValue(CURSO)
    miProgreso.mockResolvedValue(null)
    marcarProgreso.mockResolvedValue(undefined)
  })

  it('reproduce el título y los pasos del curso', async () => {
    renderFicha()
    expect(
      await screen.findByRole('heading', { name: 'RNT paso a paso', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Qué es el RNT')).toBeInTheDocument()
    expect(screen.getByText('Cómo inscribirte')).toBeInTheDocument()
    // El vídeo de YouTube se embebe en un iframe accesible.
    expect(screen.getByTitle(/youtube.*qué es el rnt/i)).toBeInTheDocument()
  })

  it('sin sesión NO ofrece el botón de completar', async () => {
    renderFicha()
    await screen.findByText('Qué es el RNT')
    expect(screen.queryByRole('button', { name: /completado/i })).not.toBeInTheDocument()
  })

  it('con sesión permite marcar el curso como completado', async () => {
    miProgreso.mockResolvedValue({ cursos: [] })
    const user = userEvent.setup()
    renderFicha()
    const boton = await screen.findByRole('button', { name: /marcar como completado/i })
    await user.click(boton)
    await waitFor(() => expect(marcarProgreso).toHaveBeenCalledWith('c1', true))
  })

  it('muestra el estado de error cuando el curso no existe', async () => {
    curso.mockRejectedValue(new Error('No publicado'))
    renderFicha()
    expect(await screen.findByText(/curso no encontrado/i)).toBeInTheDocument()
  })
})
