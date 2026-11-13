import { useState, type FormEvent, type ReactNode } from 'react'
import { Campo } from '../Campo'
import styles from '../Auth.module.css'

/** Forma del resultado del login cuando el backend pide el segundo factor. */
export interface DesafioLogin {
  requiere2fa: true
  desafio: string
}

/**
 * ¿El resultado del paso 1 pide el segundo factor? El tipo es `unknown` a
 * propósito: así el `LoginForm` sirve a los DOS backends de auth del proyecto
 * (el público `authApiService` y el del panel `authService`), que devuelven
 * usuarios con formas distintas. El formulario no necesita leer el usuario; solo
 * decide si hay que mostrar el paso 2FA y, si no, llama a `alEntrar`.
 */
function esPaso2fa(r: unknown): r is DesafioLogin {
  return (
    typeof r === 'object' &&
    r !== null &&
    (r as { requiere2fa?: unknown }).requiere2fa === true &&
    typeof (r as { desafio?: unknown }).desafio === 'string'
  )
}

export interface LoginFormProps {
  /** Paso 1: autentica con correo+contraseña. */
  login: (email: string, contrasena: string) => Promise<unknown>
  /** Paso 2 (solo si el backend pide 2FA): verifica el código. */
  verificar2fa?: (desafio: string, codigo: string) => Promise<unknown>
  /** Post-login: lo decide cada entrada (guardar sesión demo, refrescar contexto, navegar…). */
  alEntrar: () => void | Promise<void>
  /** Título (h1) del paso de credenciales. */
  titulo?: string
  /** Subtítulo del paso de credenciales. */
  subtitulo?: string
  /** Texto del botón primario. */
  etiquetaEntrar?: string
  /** Enlaces del pie (registro, volver…). Se renderizan bajo el botón. */
  pie?: ReactNode
  /** Enlace "¿olvidaste tu contraseña?" (opcional, alineado a la derecha). */
  olvido?: ReactNode
}

const EMAIL_RE = /^\S+@\S+\.\S+$/

/**
 * LoginForm — formulario de inicio de sesión REUTILIZABLE y accesible, con el
 * paso de verificación en dos factores (2FA) incorporado. Es el ÚNICO
 * formulario de login de la app: lo usan tanto `/login` (público) como
 * `/dashboard/login` (panel); solo cambia el adaptador de auth y el destino
 * post-login que recibe por props. Así ambos accesos comparten diseño y lógica.
 */
export function LoginForm({
  login,
  verificar2fa,
  alEntrar,
  titulo = 'Iniciar sesión',
  subtitulo,
  etiquetaEntrar = 'Entrar',
  pie,
  olvido,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState<{ email?: string; password?: string }>({})
  const [enviando, setEnviando] = useState(false)
  const [errorApi, setErrorApi] = useState<string | null>(null)

  // Paso 2FA: cuando el backend pide el 2º factor guardamos el desafío y
  // mostramos el campo del código en lugar de correo/contraseña.
  const [desafio2fa, setDesafio2fa] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErrorApi(null)
    const errs: typeof errores = {}
    if (!EMAIL_RE.test(email)) errs.email = 'Ingresa un correo electrónico válido.'
    if (password.length < 8) errs.password = 'La contraseña debe tener al menos 8 caracteres.'
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    setEnviando(true)
    try {
      const r = await login(email, password)
      if (esPaso2fa(r) && verificar2fa) {
        setDesafio2fa(r.desafio)
      } else {
        await alEntrar()
      }
    } catch (err: unknown) {
      setErrorApi((err as { message?: string }).message ?? 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  const verificar = async (e: FormEvent) => {
    e.preventDefault()
    setErrorApi(null)
    if (!desafio2fa || !verificar2fa) return
    setEnviando(true)
    try {
      await verificar2fa(desafio2fa, codigo.trim())
      await alEntrar()
    } catch (err: unknown) {
      setErrorApi((err as { message?: string }).message ?? 'Código incorrecto.')
    } finally {
      setEnviando(false)
    }
  }

  if (desafio2fa) {
    return (
      <form onSubmit={verificar} noValidate>
        <h1 className={styles.titulo}>Verificación en dos pasos</h1>
        <p className={styles.sub}>Ingresa el código de tu app de autenticación.</p>

        <Campo
          id="codigo"
          label="Código de verificación"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />

        {errorApi && (
          <p className={styles.errorApi} role="alert">
            {errorApi}
          </p>
        )}

        <button type="submit" className={styles.btn} disabled={enviando}>
          {enviando ? 'Verificando…' : 'Verificar'}
        </button>

        <p className={styles.pie}>
          <button
            type="button"
            className={styles.linkPeq}
            onClick={() => {
              setDesafio2fa(null)
              setCodigo('')
              setErrorApi(null)
            }}
          >
            ← Volver
          </button>
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={enviar} noValidate>
      <h1 className={styles.titulo}>{titulo}</h1>
      {subtitulo && <p className={styles.sub}>{subtitulo}</p>}

      <Campo
        id="email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        placeholder="tucorreo@ejemplo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errores.email}
      />
      <Campo
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errores.password}
      />

      {errorApi && (
        <p className={styles.errorApi} role="alert">
          {errorApi}
        </p>
      )}

      {olvido && <div className={styles.entreLinea}>{olvido}</div>}

      <button type="submit" className={styles.btn} disabled={enviando}>
        {enviando ? 'Entrando…' : etiquetaEntrar}
      </button>

      {pie}
    </form>
  )
}
