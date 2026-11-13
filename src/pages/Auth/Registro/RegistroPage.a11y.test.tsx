import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { axe } from '../../../test/a11y'
import { RegistroPage } from './RegistroPage'

describe('RegistroPage (wizard) — accesibilidad (WCAG 2.1 AA)', () => {
  it('no tiene violaciones en el paso de tipo de perfil', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/registro']}>
        <RegistroPage />
      </MemoryRouter>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('no tiene violaciones en el paso de datos de acceso', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter initialEntries={['/registro?tipo=artesano']}>
        <RegistroPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await screen.findByLabelText('Correo electrónico')
    expect(await axe(container)).toHaveNoViolations()
  })
})
