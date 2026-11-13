import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from '../../test/a11y'
import { DeclaracionAccesibilidadPage } from './DeclaracionAccesibilidadPage'
import { PoliticaCookiesPage } from './PoliticaCookiesPage'
import { PoliticaDatosPage } from './PoliticaDatosPage'
import { TerminosPage } from './TerminosPage'

const paginas = [
  ['Declaración de accesibilidad', DeclaracionAccesibilidadPage],
  ['Política de Cookies', PoliticaCookiesPage],
  ['Política de Datos', PoliticaDatosPage],
  ['Términos y Condiciones', TerminosPage],
] as const

describe('Páginas legales — accesibilidad (WCAG 2.1 AA)', () => {
  it.each(paginas)('«%s» no tiene violaciones', async (_nombre, Pagina) => {
    const { container } = render(
      <MemoryRouter>
        <Pagina />
      </MemoryRouter>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
