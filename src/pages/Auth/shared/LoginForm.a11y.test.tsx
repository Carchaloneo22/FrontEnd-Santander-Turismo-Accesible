import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from '../../../test/a11y'
import { LoginForm } from './LoginForm'

describe('LoginForm — accesibilidad (WCAG 2.1 AA)', () => {
  it('no tiene violaciones en el paso de credenciales', async () => {
    const { container } = render(<LoginForm login={vi.fn()} alEntrar={vi.fn()} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('no tiene violaciones con errores de validación visibles', async () => {
    const user = userEvent.setup()
    const { container, getByRole } = render(<LoginForm login={vi.fn()} alEntrar={vi.fn()} />)
    // Enviar vacío fuerza los mensajes de error (aria-invalid + role=alert).
    await user.click(getByRole('button', { name: 'Entrar' }))
    expect(await axe(container)).toHaveNoViolations()
  })
})
