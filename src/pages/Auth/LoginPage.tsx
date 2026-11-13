import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Link } from '../../components/ui/Link'
import { authApiService } from '../../services'
import { AuthShell } from './shared/AuthShell'
import { LoginForm } from './shared/LoginForm'
import styles from './Auth.module.css'

/**
 * LoginPage — acceso PÚBLICO (viajeros y prestadores). Comparte marco (AuthShell)
 * y formulario (LoginForm) con el acceso del panel `/dashboard/login`: misma
 * experiencia y misma lógica de auth; solo cambia el destino post-login.
 *
 * Tras un login correcto, el backend ya dejó la cookie de sesión httpOnly; se
 * navega a `/dashboard`, que decide por rol qué paneles mostrar (o pide volver a
 * entrar si no hay sesión). Se respeta `?redirect=` / `location.state.from`.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const previo = document.title
    document.title = 'Iniciar sesión — Santander Accesible'
    return () => {
      document.title = previo
    }
  }, [])

  // Allowlist de redirección (FE-04): solo rutas internas que empiezan por un
  // único '/'. Rechaza '//host' y '/\host' (redirección a otro origen que algunos
  // navegadores interpretan como protocol-relative) y cualquier esquema
  // (`http:`, `javascript:`…, que no empiezan por '/'). Si no cumple → ruta segura.
  const esRutaInternaSegura = (ruta: string | null | undefined): ruta is string =>
    typeof ruta === 'string' &&
    ruta.startsWith('/') &&
    !ruta.startsWith('//') &&
    !ruta.startsWith('/\\')

  const destino = () => {
    const params = new URLSearchParams(location.search)
    const redirect = params.get('redirect')
    const from = (location.state as { from?: string } | null)?.from
    if (esRutaInternaSegura(redirect)) return redirect
    if (esRutaInternaSegura(from)) return from
    return '/dashboard'
  }

  // La sesión real la deja el backend en la cookie httpOnly tras el login/2FA; el
  // front no guarda identidad en localStorage (eso era la `sesionDemo` falsificable,
  // ya retirada — FE-03). Solo navegamos al destino validado.
  const login = (email: string, contrasena: string) => authApiService.login({ email, contrasena })

  const verificar2fa = (desafio: string, codigo: string) =>
    authApiService.verificar2fa(desafio, codigo)

  const alEntrar = () => {
    navigate(destino())
  }

  return (
    <AuthShell lema="Turismo inclusivo en Santander: ojos, oídos y pasos libres para todos.">
      <LoginForm
        login={login}
        verificar2fa={verificar2fa}
        alEntrar={alEntrar}
        titulo="Iniciar sesión"
        subtitulo="Entra para gestionar tus reservas, favoritos y tu perfil de prestador o artesano."
        olvido={
          <Link to="/recuperar-contrasena" className={styles.linkPeq}>
            ¿Olvidaste tu contraseña?
          </Link>
        }
        pie={
          <>
            <p className={styles.pie}>
              ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
            </p>
            <p className={styles.volver}>
              <Link to="/">← Volver al inicio</Link>
            </p>
          </>
        }
      />
    </AuthShell>
  )
}
