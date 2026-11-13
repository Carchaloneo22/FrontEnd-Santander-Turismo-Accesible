import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('valida correo y longitud de contraseña antes de llamar al backend', async () => {
    const user = userEvent.setup()
    const login = vi.fn()
    const alEntrar = vi.fn()
    render(<LoginForm login={login} alEntrar={alEntrar} />)

    await user.type(screen.getByLabelText('Correo electrónico'), 'no-es-correo')
    await user.type(screen.getByLabelText('Contraseña'), '123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText(/correo electrónico válido/i)).toBeInTheDocument()
    expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('inicia sesión y ejecuta alEntrar cuando no hay 2FA', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockResolvedValue({})
    const alEntrar = vi.fn()
    render(<LoginForm login={login} alEntrar={alEntrar} />)

    await user.type(screen.getByLabelText('Correo electrónico'), 'maria@ejemplo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'claveSegura1')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(login).toHaveBeenCalledWith('maria@ejemplo.com', 'claveSegura1'))
    await waitFor(() => expect(alEntrar).toHaveBeenCalledTimes(1))
  })

  it('muestra el paso 2FA y verifica el código', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockResolvedValue({ requiere2fa: true, desafio: 'desafio-123' })
    const verificar2fa = vi.fn().mockResolvedValue({ id: 'u1' })
    const alEntrar = vi.fn()
    render(<LoginForm login={login} verificar2fa={verificar2fa} alEntrar={alEntrar} />)

    await user.type(screen.getByLabelText('Correo electrónico'), 'maria@ejemplo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'claveSegura1')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    const codigo = await screen.findByLabelText('Código de verificación')
    expect(alEntrar).not.toHaveBeenCalled()

    await user.type(codigo, '654321')
    await user.click(screen.getByRole('button', { name: 'Verificar' }))

    await waitFor(() => expect(verificar2fa).toHaveBeenCalledWith('desafio-123', '654321'))
    await waitFor(() => expect(alEntrar).toHaveBeenCalledTimes(1))
  })

  it('muestra el error del backend si el login falla', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockRejectedValue({ message: 'Credenciales inválidas' })
    const alEntrar = vi.fn()
    render(<LoginForm login={login} alEntrar={alEntrar} />)

    await user.type(screen.getByLabelText('Correo electrónico'), 'maria@ejemplo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'claveSegura1')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas')
    expect(alEntrar).not.toHaveBeenCalled()
  })
})
