import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { RegistroPage } from './RegistroPage'

function montar(ruta = '/registro') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <RegistroPage />
    </MemoryRouter>,
  )
}

describe('RegistroPage (wizard)', () => {
  it('no avanza sin elegir tipo y muestra el error', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/elige qué tipo/i)
    // Sigue en el paso de tipo.
    expect(screen.getByRole('radiogroup', { name: /tipo de perfil/i })).toBeInTheDocument()
  })

  it('elige artesano y avanza al paso de cuenta', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(screen.getByRole('radio', { name: /artesano/i }))
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByRole('heading', { name: /datos de acceso/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
  })

  it('preselecciona el tipo desde ?tipo=agente', () => {
    montar('/registro?tipo=agente')
    expect(screen.getByRole('radio', { name: /agente u operador/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('bloquea el avance de cuenta con datos inválidos', async () => {
    const user = userEvent.setup()
    montar('/registro?tipo=agente')
    await user.click(screen.getByRole('button', { name: /siguiente/i })) // tipo → cuenta
    await user.click(screen.getByRole('button', { name: /siguiente/i })) // intenta cuenta → datos
    expect(screen.getByText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByText(/correo electrónico válido/i)).toBeInTheDocument()
  })
})
