import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EstadoError } from './EstadoError'

/**
 * EstadoError es el estado de error/"no encontrado" que muestran TODAS las
 * fichas de detalle cuando el backend rechaza (lugar inexistente, oferta
 * despublicada, directorio de artesanos aún protegido). Se prueba aislado —no a
 * través de la promesa rechazada de useRecurso— porque esa ruta ya está cubierta
 * por el propio useRecurso y en producción (DestinoPage), y así el test queda
 * determinista.
 */
describe('EstadoError', () => {
  it('anuncia el error como alerta accesible con h1 y enlace de vuelta', () => {
    render(
      <MemoryRouter>
        <EstadoError
          titulo="Lugar no encontrado"
          mensaje="Ese lugar no está publicado."
          mensajePorDefecto="El lugar que buscas no existe."
          volverA="/"
          volverEtiqueta="Volver al inicio"
        />
      </MemoryRouter>,
    )
    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('Ese lugar no está publicado.')
    expect(screen.getByRole('heading', { level: 1, name: /no encontrado/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
  })

  it('usa el mensaje por defecto cuando no llega mensaje del backend', () => {
    render(
      <MemoryRouter>
        <EstadoError
          titulo="Perfil no disponible"
          mensajePorDefecto="El directorio público de artesanos se está habilitando."
          volverA="/artesanias"
          volverEtiqueta="Ver artesanías"
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El directorio público de artesanos se está habilitando.',
    )
  })
})
