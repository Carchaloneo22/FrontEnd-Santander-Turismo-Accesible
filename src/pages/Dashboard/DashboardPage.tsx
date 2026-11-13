import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from '../../components/ui/Link'
import { authApiService } from '../../services'
import logo from '../../assets/logo.webp'
import styles from './DashboardPage.module.css'

const TARJETAS = [
  {
    icono: '📋',
    titulo: 'Mis reservas',
    texto: 'Aún no tienes reservas. Explora planes accesibles y reserva tu próxima experiencia.',
    cta: 'Ver planes',
    to: '/planes-turisticos',
  },
  {
    icono: '❤️',
    titulo: 'Favoritos',
    texto: 'Guarda hospedajes, rutas y artesanías para encontrarlos rápido.',
    cta: 'Explorar',
    to: '/hospedaje',
  },
  {
    icono: '🗺️',
    titulo: 'Destinos',
    texto: 'Descubre los municipios accesibles de Santander y sus sitios.',
    cta: 'Ver mapa',
    to: '/',
  },
  {
    icono: '🥽',
    titulo: 'Experiencias 360°',
    texto: 'Recorre los destinos en realidad virtual antes de viajar.',
    cta: 'Abrir metaverso',
    to: '/metaverso',
  },
]

type EstadoSesion = 'verificando' | 'autenticado'

export function DashboardPage() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<EstadoSesion>('verificando')

  useEffect(() => {
    const previo = document.title
    document.title = 'Panel — Santander Accesible'
    return () => {
      document.title = previo
    }
  }, [])

  // Acceso por sesión REAL (FE-03): se verifica contra el backend con GET /auth/yo,
  // que solo responde si la cookie de sesión httpOnly es válida (no falsificable
  // desde devtools). Cerrado por defecto: mientras se verifica no se muestra el
  // panel, y cualquier 401/error de red redirige al login.
  useEffect(() => {
    let activo = true
    authApiService
      .yo()
      .then((sesion) => {
        if (!activo) return
        if (sesion) setEstado('autenticado')
        else navigate('/login', { replace: true })
      })
      .catch(() => {
        if (activo) navigate('/login', { replace: true })
      })
    return () => {
      activo = false
    }
  }, [navigate])

  const salir = async () => {
    try {
      await authApiService.logout()
    } finally {
      navigate('/')
    }
  }

  if (estado !== 'autenticado') {
    return (
      <div className={styles.wrap}>
        <main className={styles.main}>
          <p className={styles.saludoSub} role="status">
            Verificando tu sesión…
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.topbar}>
        <Link to="/" className={styles.marca}>
          <img src={logo} alt="" className={styles.logo} />
          <span>Santander Accesible</span>
        </Link>
        <button type="button" className={styles.salir} onClick={salir}>
          Cerrar sesión
        </button>
      </header>

      <main className={styles.main}>
        <h1 className={styles.saludo}>Hola 👋</h1>
        <p className={styles.saludoSub}>
          Bienvenido a tu panel. Este es un espacio de demostración.
        </p>

        <section className={styles.stats} aria-label="Resumen">
          <div className={styles.stat}>
            <span className={styles.statNum}>0</span>
            <span className={styles.statLbl}>Reservas activas</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>0</span>
            <span className={styles.statLbl}>Favoritos</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>4</span>
            <span className={styles.statLbl}>Municipios accesibles</span>
          </div>
        </section>

        <div className={styles.grid}>
          {TARJETAS.map((t) => (
            <article key={t.titulo} className={styles.card}>
              <span className={styles.cardIcono} aria-hidden="true">
                {t.icono}
              </span>
              <h2 className={styles.cardTitulo}>{t.titulo}</h2>
              <p className={styles.cardText}>{t.texto}</p>
              <Link to={t.to} className={styles.cardCta}>
                {t.cta} →
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
