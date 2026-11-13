import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { Heading } from '../../components/ui/Heading'
import { Text } from '../../components/ui/Text'
import { Badge } from '../../components/ui/Badge'
import { Card, type CardChip } from '../../components/ui/Card'
import { Loader } from '../../components/ui/Loader'
import { FotoConCredito } from '../../components/ui/FotoConCredito'
import { DetalleShell, EstadoError } from '../../features/detalle'
import { municipiosService, type RecursoCompletitud } from '../../services'
import { useRecurso } from '../../hooks/useRecurso'
import { useSEO } from '../../hooks/useSEO'
import { completosPrimero, filtrarDestacados, hayCrudos } from './presentacion'
import styles from './MunicipioDetallePage.module.css'

/** Chip "Datos completos" para los recursos curados (completo === true). */
const CHIPS_COMPLETO: CardChip[] = [{ texto: 'Datos completos', icono: '✓', tono: 'verde' }]

/** Devuelve el chip de completitud solo cuando el backend marca el recurso
 *  como completo; si no hay señal (POI crudo o backend viejo), no pinta nada. */
function chipsDe(it: RecursoCompletitud): CardChip[] | undefined {
  return it.completo === true ? CHIPS_COMPLETO : undefined
}

/** Capitaliza un nombre en MAYÚSCULAS del DANE ("GIRÓN" → "Girón"). */
function titulo(nombre: string): string {
  if (!nombre || nombre !== nombre.toUpperCase()) return nombre
  return nombre.toLowerCase().replace(/(^|\s|-)([a-záéíóúñ])/g, (_, s, c) => s + c.toUpperCase())
}

/** "atractivo_turistico" → "Atractivo turístico". */
function legible(texto: string | null | undefined): string | undefined {
  if (!texto) return undefined
  const t = texto.replace(/_/g, ' ').trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/**
 * MunicipioDetallePage — ficha pública de un municipio (/municipios/:id).
 *
 * Consume `GET /municipios/:id/recursos`: contenido editorial (reseña, leyenda,
 * historia, datos importantes, foto con crédito) y sus recursos turísticos
 * (sitios, artesanos y prestadores), cada uno enlazado a su ficha existente.
 *
 * El estado se reinicia con `key={id}` en la ruta (ver App.tsx): useRecurso no se
 * reinicia solo, así que al pasar de un municipio a otro React remonta la página.
 */
export function MunicipioDetallePage() {
  const { id } = useParams<{ id: string }>()

  const cargar = useCallback(() => municipiosService.ficha(id ?? ''), [id])
  const { dato: m, cargando, error } = useRecurso(cargar, 'No se pudo cargar el municipio.')

  // Toggle "Solo destacados": esconde los POIs crudos de OSM (completo:false).
  // Arranca activo para que el ruido no tape los recursos curados; solo se ofrece
  // cuando de verdad hay crudos que esconder (si no, el contenido se ve completo).
  const [soloDestacados, setSoloDestacados] = useState(true)

  const nombre = m ? titulo(m.nombre) : 'Municipio'
  const descripcion = useMemo(() => (m?.resena ?? m?.historia ?? undefined)?.slice(0, 160), [m])

  useSEO({
    title: nombre,
    description: descripcion,
    path: `/municipios/${id ?? ''}`,
    image: m?.imagen?.url,
    type: 'article',
  })

  if (cargando) return <Loader label="Cargando municipio" />

  if (error || !m) {
    return (
      <EstadoError
        titulo="Municipio no encontrado"
        mensaje={error}
        mensajePorDefecto="El municipio que buscas no existe o aún no está publicado."
        volverA="/municipios"
        volverEtiqueta="Volver a los municipios"
      />
    )
  }

  const hayRecursos = m.sitios.length > 0 || m.artesanos.length > 0 || m.prestadores.length > 0

  // Recursos a mostrar: completos primero (red de seguridad sobre el orden del
  // backend) y, con el toggle activo, sin los POIs crudos de OSM.
  const sitios = filtrarDestacados(completosPrimero(m.sitios), soloDestacados)
  const artesanos = filtrarDestacados(completosPrimero(m.artesanos), soloDestacados)
  const prestadores = filtrarDestacados(completosPrimero(m.prestadores), soloDestacados)

  const hayCrudosEnFicha = hayCrudos([...m.sitios, ...m.artesanos, ...m.prestadores])
  const ocultos =
    m.sitios.length +
    m.artesanos.length +
    m.prestadores.length -
    (sitios.length + artesanos.length + prestadores.length)

  return (
    <DetalleShell
      migas={[
        { etiqueta: 'Inicio', a: '/' },
        { etiqueta: 'Municipios', a: '/municipios' },
        { etiqueta: nombre },
      ]}
      volverA="/municipios"
      volverEtiqueta="Volver a los municipios"
    >
      <header className={styles.cabecera}>
        <FotoConCredito imagen={m.imagen} alt={`Foto de ${nombre}`} className={styles.foto} />
        <div className={styles.titulares}>
          <Heading level={1} size={2}>
            {nombre}
          </Heading>
          <ul className={styles.etiquetas} aria-label="Datos del municipio">
            {m.provincia && (
              <li>
                <Badge variant="neutral" aria-label={`Provincia de ${m.provincia.nombre}`}>
                  <span aria-hidden="true">📍</span> Provincia de {m.provincia.nombre}
                </Badge>
              </li>
            )}
            {m.recursos.sitios > 0 && (
              <li>
                <Badge variant="primary">{m.recursos.sitios} sitios</Badge>
              </li>
            )}
            {m.recursos.artesanos > 0 && (
              <li>
                <Badge variant="primary">{m.recursos.artesanos} artesanos</Badge>
              </li>
            )}
            {m.recursos.prestadores > 0 && (
              <li>
                <Badge variant="primary">{m.recursos.prestadores} prestadores</Badge>
              </li>
            )}
          </ul>
        </div>
      </header>

      {m.resena && (
        <section className={styles.bloque} aria-label="Reseña">
          <Text size="lg">{m.resena}</Text>
        </section>
      )}

      {m.leyenda && (
        <section className={styles.bloque} aria-labelledby="leyenda-titulo">
          <Heading level={2} size={4} id="leyenda-titulo">
            <span aria-hidden="true">✨</span> Leyenda
          </Heading>
          <Text>{m.leyenda}</Text>
        </section>
      )}

      {m.historia && (
        <section className={styles.bloque} aria-labelledby="historia-titulo">
          <Heading level={2} size={4} id="historia-titulo">
            Historia
          </Heading>
          <Text>{m.historia}</Text>
        </section>
      )}

      {m.datosImportantes.length > 0 && (
        <section className={styles.bloque} aria-labelledby="datos-titulo">
          <Heading level={2} size={4} id="datos-titulo">
            Datos importantes
          </Heading>
          <dl className={styles.datos}>
            {m.datosImportantes.map((d, i) => (
              <div key={`${d.titulo}-${i}`} className={styles.dato}>
                <dt>{d.titulo}</dt>
                <dd>{d.contenido}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Toggle para esconder los POIs crudos de OSM (solo si hay crudos). */}
      {hayCrudosEnFicha && (
        <div className={styles.controlRecursos}>
          <label className={styles.filtroDestacados}>
            <input
              type="checkbox"
              checked={soloDestacados}
              onChange={(e) => setSoloDestacados(e.target.checked)}
            />
            <span>Mostrar solo lugares con datos completos</span>
          </label>
          <p className={styles.ocultosAviso} aria-live="polite">
            {soloDestacados && ocultos > 0
              ? `Se ocultan ${ocultos} lugar${ocultos === 1 ? '' : 'es'} con datos básicos.`
              : ''}
          </p>
        </div>
      )}

      {/* Recursos del municipio */}
      {sitios.length > 0 && (
        <SeccionRecursos id="sitios" titulo="Sitios turísticos" icono="🗺️">
          {sitios.map((s) => (
            <li key={s.id}>
              <Card
                imagen={s.imagen}
                imageAlt={`Foto de ${s.nombre}`}
                title={s.nombre}
                badge={legible(s.categoria)}
                chips={chipsDe(s)}
                linkTo={`/lugares/${s.slug}`}
                linkLabel="Ver sitio"
              />
            </li>
          ))}
        </SeccionRecursos>
      )}

      {artesanos.length > 0 && (
        <SeccionRecursos id="artesanos" titulo="Artesanos" icono="🧵">
          {artesanos.map((a) => (
            <li key={a.id}>
              <Card
                imagen={a.imagen}
                imageAlt={`Foto de ${a.nombre}`}
                title={a.nombre}
                badge={legible(a.oficio)}
                chips={chipsDe(a)}
                linkTo={`/artesanos/${a.slug}`}
                linkLabel="Ver artesano"
              />
            </li>
          ))}
        </SeccionRecursos>
      )}

      {prestadores.length > 0 && (
        <SeccionRecursos id="prestadores" titulo="Prestadores turísticos" icono="🧳">
          {prestadores.map((p) => (
            <li key={p.id}>
              <Card
                imagen={p.imagen}
                imageAlt={`Foto de ${p.nombre}`}
                title={p.nombre}
                chips={chipsDe(p)}
                linkTo={`/prestadores/${p.slug}`}
                linkLabel="Ver prestador"
              />
            </li>
          ))}
        </SeccionRecursos>
      )}

      {hayRecursos && sitios.length === 0 && artesanos.length === 0 && prestadores.length === 0 && (
        <section className={styles.bloque}>
          <Text muted>
            Los lugares de este municipio provienen de mapas abiertos y aún tienen datos básicos.{' '}
            <button
              type="button"
              className={styles.enlaceAccion}
              onClick={() => setSoloDestacados(false)}
            >
              Mostrar todos los lugares
            </button>
          </Text>
        </section>
      )}

      {!hayRecursos && (
        <section className={styles.bloque}>
          <Text muted>
            Este municipio aún no tiene sitios, artesanos ni prestadores publicados. Pronto iremos
            sumando su oferta turística accesible.
          </Text>
        </section>
      )}
    </DetalleShell>
  )
}

/** Sección de tarjetas de recursos (lista semántica + encabezado accesible). */
function SeccionRecursos({
  id,
  titulo: tit,
  icono,
  children,
}: {
  id: string
  titulo: string
  icono: string
  children: ReactNode
}) {
  return (
    <section className={styles.recursos} aria-labelledby={`${id}-titulo`}>
      <Heading level={2} size={4} id={`${id}-titulo`} className={styles.recursosTitulo}>
        <span aria-hidden="true">{icono}</span> {tit}
      </Heading>
      <ul className={styles.rejilla}>{children}</ul>
    </section>
  )
}
