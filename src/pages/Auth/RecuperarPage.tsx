import { useEffect, useState, type FormEvent } from 'react'
import { Link } from '../../components/ui/Link'
import { authApiService } from '../../services'
import { AuthShell } from './shared/AuthShell'
import { Campo } from './Campo'
import styles from './Auth.module.css'

export function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    const previo = document.title
    document.title = 'Recuperar contraseña — Santander Accesible'
    return () => {
      document.title = previo
    }
  }, [])

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }
    setError(undefined)
    setEnviando(true)
    try {
      // Respuesta uniforme del backend: no revela si el correo existe. Si el
      // endpoint no está disponible mostramos igualmente la confirmación
      // (mismo mensaje neutro) para no filtrar información ni bloquear al usuario.
      await authApiService.recuperar(email).catch(() => undefined)
      setEnviado(true)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthShell lema="Te ayudamos a recuperar el acceso a tu cuenta.">
      {enviado ? (
        <div className={styles.exito}>
          <div className={styles.exitoIcono} aria-hidden="true">
            ✉️
          </div>
          <h1 className={styles.titulo}>Revisa tu correo</h1>
          <p className={styles.sub}>
            Si <strong>{email}</strong> está registrado, te enviamos un enlace para restablecer tu
            contraseña. Revisa también la carpeta de spam.
          </p>
          <p className={styles.pie}>
            <Link to="/login">← Volver a iniciar sesión</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate>
          <h1 className={styles.titulo}>Recuperar contraseña</h1>
          <p className={styles.sub}>
            Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.
          </p>

          <Campo
            id="email"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />

          <button type="submit" className={styles.btn} disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar enlace'}
          </button>

          <p className={styles.pie}>
            ¿Recordaste tu contraseña? <Link to="/login">Inicia sesión</Link>
          </p>
          <p className={styles.volver}>
            <Link to="/">← Volver al inicio</Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
