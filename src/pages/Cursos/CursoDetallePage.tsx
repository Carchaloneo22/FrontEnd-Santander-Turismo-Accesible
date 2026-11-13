import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Heading } from '../../components/ui/Heading'
import { Text } from '../../components/ui/Text'
import { Badge } from '../../components/ui/Badge'
import { Loader } from '../../components/ui/Loader'
import { FotoConCredito } from '../../components/ui/FotoConCredito'
import { DetalleShell, EstadoError } from '../../features/detalle'
import { academiaService, type PasoCurso } from '../../services'
import { useRecurso } from '../../hooks/useRecurso'
import { useSEO } from '../../hooks/useSEO'
import { duracionLegible, etiquetaCategoria, iconoCategoria } from './presentacion'
import styles from './CursoDetallePage.module.css'

/** Parsea un id de vídeo de YouTube/Vimeo a su URL de incrustación, si aplica. */
function urlEmbed(videoUrl: string): { src: string; proveedor: string } | null {
  try {
    const u = new URL(videoUrl)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1)
      return id
        ? { src: `https://www.youtube-nocookie.com/embed/${id}`, proveedor: 'YouTube' }
        : null
    }
    if (host.endsWith('youtube.com')) {
      const id = u.searchParams.get('v') ?? u.pathname.split('/').pop()
      return id
        ? { src: `https://www.youtube-nocookie.com/embed/${id}`, proveedor: 'YouTube' }
        : null
    }
    if (host.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      return id ? { src: `https://player.vimeo.com/video/${id}`, proveedor: 'Vimeo' } : null
    }
  } catch {
    return null
  }
  return null
}

/** Reproduce el vídeo de un paso: iframe para YouTube/Vimeo, <video> para mp4. */
function VideoPaso({ url, titulo }: { url: string; titulo: string }) {
  const embed = urlEmbed(url)
  if (embed) {
    return (
      <div className={styles.video}>
        <iframe
          src={embed.src}
          title={`Vídeo (${embed.proveedor}): ${titulo}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    )
  }
  // Archivo de vídeo directo (mp4/webm): reproductor nativo accesible.
  return (
    <div className={styles.video}>
      {/* El track de subtítulos lo añade el backend cuando exista; el reproductor
          nativo ya ofrece controles por teclado y descripción accesible. */}
      <video controls preload="metadata" aria-label={`Vídeo de la lección: ${titulo}`}>
        <source src={url} />
        Tu navegador no puede reproducir este vídeo. <a href={url}>Ábrelo en una pestaña nueva</a>.
      </video>
    </div>
  )
}

/** Un paso (lección) del curso: título, vídeo opcional y texto accesible. */
function Paso({ paso, indice }: { paso: PasoCurso; indice: number }) {
  return (
    <li className={styles.paso}>
      <Heading level={2} size={4} id={`paso-${indice}`} className={styles.pasoTitulo}>
        <span className={styles.pasoNum} aria-hidden="true">
          {indice + 1}
        </span>
        {paso.titulo}
      </Heading>
      {paso.videoUrl && <VideoPaso url={paso.videoUrl} titulo={paso.titulo} />}
      {paso.contenido && (
        <div className={styles.pasoContenido}>
          {paso.contenido
            .split(/\n{2,}/)
            .map((parrafo) => parrafo.trim())
            .filter(Boolean)
            .map((parrafo, i) => (
              <Text key={i}>{parrafo}</Text>
            ))}
        </div>
      )}
    </li>
  )
}

/**
 * CursoDetallePage — ficha PÚBLICA de un curso de la academia (/cursos/:slug).
 *
 * Reproduce los `pasos` (vídeo embebido si hay `videoUrl` + texto accesible) y,
 * SI HAY SESIÓN, ofrece marcar el curso como completado. El estado de progreso
 * se consulta aparte (GET /academia/mi-progreso): si no hay sesión o el endpoint
 * no existe, simplemente no se muestra el botón.
 *
 * `key={slug}` en la ruta (App.tsx) remonta la página al cambiar de curso.
 */
export function CursoDetallePage() {
  const { slug } = useParams<{ slug: string }>()

  const cargar = useCallback(() => academiaService.curso(slug ?? ''), [slug])
  const { dato: curso, cargando, error } = useRecurso(cargar, 'No se pudo cargar el curso.')

  // Progreso del prestador. `sesion` arranca en null = "aún no se sabe".
  const [sesion, setSesion] = useState<boolean | null>(null)
  const [completado, setCompletado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [avisoProgreso, setAvisoProgreso] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    academiaService.miProgreso().then((p) => {
      if (!vivo) return
      setSesion(p !== null)
      if (p && curso) {
        setCompletado(p.cursos.some((c) => c.cursoId === curso.id && c.completado))
      }
    })
    return () => {
      vivo = false
    }
  }, [curso])

  useSEO({
    title: curso ? `${curso.titulo} — Academia` : 'Curso',
    description: curso?.descripcion ?? undefined,
    path: `/cursos/${slug ?? ''}`,
    image: curso?.portada?.url,
    type: 'article',
  })

  const marcar = async () => {
    if (!curso) return
    const nuevo = !completado
    setGuardando(true)
    setAvisoProgreso(null)
    try {
      await academiaService.marcarProgreso(curso.id, nuevo)
      setCompletado(nuevo)
      setAvisoProgreso(nuevo ? '¡Curso marcado como completado!' : 'Curso desmarcado.')
    } catch (e: unknown) {
      const msg = e instanceof Error && e.message ? e.message : 'No se pudo guardar tu progreso.'
      setAvisoProgreso(msg)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <Loader label="Cargando curso" />

  if (error || !curso) {
    return (
      <EstadoError
        titulo="Curso no encontrado"
        mensaje={error}
        mensajePorDefecto="El curso que buscas no existe o aún no está publicado."
        volverA="/cursos"
        volverEtiqueta="Volver a la academia"
      />
    )
  }

  const duracion = duracionLegible(curso.duracionMin)

  return (
    <DetalleShell
      migas={[
        { etiqueta: 'Inicio', a: '/' },
        { etiqueta: 'Academia', a: '/cursos' },
        { etiqueta: curso.titulo },
      ]}
      volverA="/cursos"
      volverEtiqueta="Volver a la academia"
    >
      <header className={styles.cabecera}>
        {curso.portada && (
          <FotoConCredito
            imagen={curso.portada}
            alt={`Portada del curso ${curso.titulo}`}
            className={styles.foto}
          />
        )}
        <div className={styles.titulares}>
          <ul className={styles.etiquetas} aria-label="Datos del curso">
            <li>
              <Badge variant="primary">
                <span aria-hidden="true">{iconoCategoria(curso.categoria)}</span>{' '}
                {etiquetaCategoria(curso.categoria)}
              </Badge>
            </li>
            <li>
              <Badge variant="neutral">Gratis</Badge>
            </li>
            {duracion && (
              <li>
                <Badge variant="neutral">
                  <span aria-hidden="true">⏱️</span> {duracion}
                </Badge>
              </li>
            )}
            {curso.pasos.length > 0 && (
              <li>
                <Badge variant="neutral">
                  {curso.pasos.length} {curso.pasos.length === 1 ? 'lección' : 'lecciones'}
                </Badge>
              </li>
            )}
          </ul>
          <Heading level={1} size={2}>
            {curso.titulo}
          </Heading>
          {curso.descripcion && <Text size="lg">{curso.descripcion}</Text>}
        </div>
      </header>

      {/* Acción de progreso: solo con sesión. El aviso es aria-live para lectores. */}
      {sesion && (
        <div className={styles.progreso}>
          <button
            type="button"
            className={styles.botonProgreso}
            data-completado={completado}
            onClick={() => void marcar()}
            disabled={guardando}
            aria-pressed={completado}
          >
            <span aria-hidden="true">{completado ? '✓' : '○'}</span>{' '}
            {completado ? 'Completado' : 'Marcar como completado'}
          </button>
        </div>
      )}
      <p className={styles.avisoProgreso} role="status" aria-live="polite">
        {avisoProgreso ?? ''}
      </p>

      {curso.pasos.length > 0 ? (
        <ol className={styles.pasos}>
          {curso.pasos.map((paso, i) => (
            <Paso key={i} paso={paso} indice={i} />
          ))}
        </ol>
      ) : (
        <section className={styles.bloque}>
          <Text muted>Este curso todavía no tiene lecciones publicadas. Vuelve pronto.</Text>
        </section>
      )}
    </DetalleShell>
  )
}
