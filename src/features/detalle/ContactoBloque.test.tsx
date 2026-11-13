import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContactoBloque } from './ContactoBloque'

describe('ContactoBloque', () => {
  it('muestra teléfono, correo y web como enlaces de acción accesibles', () => {
    render(
      <ContactoBloque
        telefono="+57 315 123 4567"
        email="hola@ejemplo.co"
        sitioWeb="https://ejemplo.co"
      />,
    )
    const tel = screen.getByRole('link', { name: /llamar al \+57 315 123 4567/i })
    expect(tel).toHaveAttribute('href', 'tel:+573151234567')

    const mail = screen.getByRole('link', { name: /enviar correo a hola@ejemplo\.co/i })
    expect(mail).toHaveAttribute('href', 'mailto:hola@ejemplo.co')

    const web = screen.getByRole('link', { name: /abrir el sitio web/i })
    expect(web).toHaveAttribute('href', 'https://ejemplo.co')
    expect(web).toHaveAttribute('target', '_blank')
    expect(web).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('dice en claro cuando no hay ningún dato de contacto', () => {
    render(<ContactoBloque vacioMensaje="Sin contacto todavía." />)
    expect(screen.getByText('Sin contacto todavía.')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
