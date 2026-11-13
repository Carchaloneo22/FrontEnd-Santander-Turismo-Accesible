import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Hero arrastra GSAP/SplitText (frágiles en jsdom): lo sustituimos por un stub.
vi.mock('../../components/sections/Hero/Hero', () => ({
  Hero: ({ title }: { title: React.ReactNode }) => <div data-testid="hero">{title}</div>,
}))

const cursos = vi.fn()
vi.mock('../../services', () => ({
  academiaService: { cursos: (c?: string) => cursos(c) },
}))

import { CursosPage } from './CursosPage'

const CURSO = {
  id: 'c1',
  slug: 'rnt-paso-a-paso',
  titulo: 'RNT paso a paso',
  categoria: 'rnt',
  descripcion: 'Cómo inscribirte en el RNT',
  totalPasos: 3,
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CursosPage />
    </MemoryRouter>,
  )
}

describe('CursosPage (listado público + filtro)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cursos.mockResolvedValue([CURSO])
  })

  it('lista los cursos recibidos del servicio', async () => {
    renderPage()
    expect(await screen.findByText('RNT paso a paso')).toBeInTheDocument()
    expect(cursos).toHaveBeenCalledWith(undefined)
  })

  it('al elegir una categoría vuelve a pedir el listado filtrado', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('RNT paso a paso')

    await user.click(screen.getByRole('button', { name: /artesanos/i }))
    await waitFor(() => expect(cursos).toHaveBeenCalledWith('artesanos'))
  })

  it('muestra un estado vacío honesto cuando no hay cursos', async () => {
    cursos.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/estamos preparando los cursos/i)).toBeInTheDocument()
  })
})
