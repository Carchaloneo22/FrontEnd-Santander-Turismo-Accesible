import { useEffect } from 'react'
import { Container } from '../../components/ui/Container'
import { Heading } from '../../components/ui/Heading'
import { Link } from '../../components/ui/Link'
import styles from './MapaSitioPage.module.css'

const SECCIONES: { titulo: string; enlaces: { label: string; to: string }[] }[] = [
  {
    titulo: 'Principal',
    enlaces: [{ label: 'Inicio', to: '/' }],
  },
  {
    titulo: 'Turismo',
    enlaces: [
      { label: 'Municipios', to: '/municipios' },
      { label: 'Planes turísticos', to: '/planes-turisticos' },
      { label: 'Hospedaje', to: '/hospedaje' },
      { label: 'Transporte', to: '/transporte' },
      { label: 'Artesanías', to: '/artesanias' },
    ],
  },
  {
    titulo: 'Experiencias',
    enlaces: [{ label: 'Metaverso 360° / VR', to: '/metaverso' }],
  },
  {
    titulo: 'Legal y transparencia',
    enlaces: [
      { label: 'Política de Tratamiento de Datos', to: '/politica-de-datos' },
      { label: 'Política de Cookies', to: '/politica-de-cookies' },
      { label: 'Declaración de accesibilidad', to: '/declaracion-de-accesibilidad' },
      { label: 'Términos y Condiciones', to: '/terminos' },
    ],
  },
]

/** Mapa del sitio (usabilidad GD + integración GOV.CO): lista navegable de todas las secciones. */
export function MapaSitioPage() {
  useEffect(() => {
    const previo = document.title
    document.title = 'Mapa del sitio — Santander Accesible'
    return () => {
      document.title = previo
    }
  }, [])

  return (
    <Container as="section" maxWidth={840} className={styles.wrap}>
      <Heading level={1} size={2}>
        Mapa del sitio
      </Heading>
      <p className={styles.intro}>
        Todas las secciones del portal, organizadas para encontrarlas rápido.
      </p>

      <div className={styles.grid}>
        {SECCIONES.map((sec) => (
          <nav key={sec.titulo} aria-label={sec.titulo} className={styles.bloque}>
            <Heading level={2} size={5}>
              {sec.titulo}
            </Heading>
            <ul>
              {sec.enlaces.map((e) => (
                <li key={e.to}>
                  <Link to={e.to}>{e.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </Container>
  )
}
