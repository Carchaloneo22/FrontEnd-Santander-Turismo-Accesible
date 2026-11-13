import { useCallback, useEffect, useMemo, useState } from 'react'
import { Container } from '../../components/ui/Container'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { Heading } from '../../components/ui/Heading'
import { Text } from '../../components/ui/Text'
import { Card } from '../../components/ui/Card'
import { Link } from '../../components/ui/Link'
import { Loader } from '../../components/ui/Loader'
import { FotoConCredito } from '../../components/ui/FotoConCredito'
import { ListToolbar } from '../../components/ui/ListToolbar'
import { MapaMunicipios } from '../../components/sections/MapaMunicipios'
import {
  municipiosService,
  type RecursoMunicipio,
  type MunicipioFicha,
  type SitioMunicipio,
} from '../../services'
import { useRecurso } from '../../hooks/useRecurso'
import { useFiltroLista, type Filtrable } from '../../hooks/useFiltroLista'
import { useSEO } from '../../hooks/useSEO'
import { normalizarDane } from '../../components/sections/MapaMunicipios/coropletico'
import { ordenarMunicipiosPorRelevancia, descripcionMunicipio, sitiosTop } from './presentacion'
import styles from './MunicipiosPage.module.css'

/** Capitaliza un nombre que viene en MAYÚSCULAS del DANE ("GIRÓN" → "Girón"). */
function titulo(nombre: string): string {
  if (!nombre) return nombre
  if (nombre !== nombre.toUpperCase()) return nombre // el backend ya lo da bien
  return nombre.toLowerCase().replace(/(^|\s|-)([a-záéíóúñ])/g, (_, s, c) => s + c.toUpperCase())
}

/** Resumen de los recursos de un municipio como texto corto. */
function resumenRecursos(m: RecursoMunicipio): string {
  const r = m.recursos
  const partes: string[] = []
  if (r.sitios) partes.push(`${r.sitios} sitio${r.sitios === 1 ? '' : 's'}`)
  if (r.artesanos) partes.push(`${r.artesanos} artesano${r.artesanos === 1 ? '' : 's'}`)
  if (r.prestadores) partes.push(`${r.prestadores} prestador${r.prestadores === 1 ? '' : 'es'}`)
  return partes.length ? partes.join(' · ') : 'Sin recursos publicados aún'
}

interface ItemMuni extends Filtrable {
  municipio: RecursoMunicipio
}

/**
 * Vistazo de los sitios TOP de un municipio en el preview del mapa: miniatura +
 * nombre + badge "Accesibilidad completa" cuando el backend lo marca, cada uno
 * enlazado a su ficha (/lugares/:slug). Lista semántica, navegable por teclado.
 */
function PreviewSitiosTop({ sitios }: { sitios: SitioMunicipio[] }) {
  return (
    <div className={styles.previewTop}>
      <h3 className={styles.previewTopTitulo}>Lugares destacados</h3>
      <ul className={styles.previewTopLista}>
        {sitios.map((s) => (
          <li key={s.id}>
            <Link to={`/lugares/${s.slug}`} className={styles.previewTopItem}>
              {s.imagen?.url ? (
                <img
                  src={s.imagen.url}
                  alt=""
                  className={styles.previewTopFoto}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className={styles.previewTopFoto} aria-hidden="true">
                  🏞️
                </span>
              )}
              <span className={styles.previewTopInfo}>
                <span className={styles.previewTopNombre}>{s.nombre}</span>
                {s.accesibilidadCompleta && (
                  <span className={styles.previewTopBadge}>
                    <span aria-hidden="true">♿</span> Accesibilidad completa
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * MunicipiosPage — página pública de los municipios de Santander (/municipios).
 *
 * Mapa COROPLÉTICO (los 87 municipios coloreados por cantidad de recursos
 * turísticos) + listado buscable. Al tocar un municipio en el mapa se muestra su
 * resumen con enlace a la ficha; el listado es la vía accesible equivalente.
 *
 * Datos: `GET /municipios/recursos`. Si el backend no responde (endpoint aún no
 * desplegado), el servicio degrada a vacío y la página lo explica en claro, sin
 * inventar municipios.
 */
export function MunicipiosPage() {
  useSEO({
    title: 'Municipios de Santander',
    description:
      'Explora los municipios de Santander en un mapa interactivo: sitios turísticos, artesanos y prestadores por municipio, con su historia y leyendas.',
    path: '/municipios',
  })

  const cargar = useCallback(() => municipiosService.recursos(), [])
  const { dato, cargando } = useRecurso(cargar, 'No se pudieron cargar los municipios.')

  const municipios = useMemo(() => dato?.items ?? [], [dato])
  const totales = dato?.totales ?? { municipios: 0, sitios: 0, artesanos: 0, prestadores: 0 }

  const [seleccionadoDane, setSeleccionadoDane] = useState<string | null>(null)
  // Filtro rápido: ocultar los municipios sin contenido editorial (los que, tras
  // poblar con lugares crudos de OSM, siguen sin reseña/leyenda/historia).
  const [soloConContenido, setSoloConContenido] = useState(false)

  const conContenido = useMemo(
    () => municipios.filter((m) => m.tieneContenido).length,
    [municipios],
  )

  const porDane = useMemo(() => {
    const idx = new Map<string, RecursoMunicipio>()
    for (const m of municipios) idx.set(normalizarDane(m.codigoDane || m.codigo), m)
    return idx
  }, [municipios])

  const seleccionado = seleccionadoDane ? (porDane.get(seleccionadoDane) ?? null) : null
  const seleccionadoId = seleccionado?.id ?? null

  // Ficha del municipio seleccionado: trae el contenido editorial (reseña/leyenda/
  // historia) y los sitios YA ORDENADOS por el backend, para enriquecer el
  // preview con una descripción y un vistazo de los sitios top. Se guarda junto al
  // id para no mostrar la ficha de un municipio bajo el nombre de otro: mientras
  // carga (id distinto) el preview usa el respaldo digno, y al llegar se enriquece.
  // Solo se asigna estado en los callbacks async (no de forma síncrona en el
  // efecto), como en useRecurso, para no disparar renders en cascada.
  const [ficha, setFicha] = useState<{ id: string; dato: MunicipioFicha | null }>({
    id: '',
    dato: null,
  })
  useEffect(() => {
    if (!seleccionadoId) return
    let vivo = true
    municipiosService
      .ficha(seleccionadoId)
      .then((d) => {
        if (vivo) setFicha({ id: seleccionadoId, dato: d })
      })
      .catch(() => {
        if (vivo) setFicha({ id: seleccionadoId, dato: null })
      })
    return () => {
      vivo = false
    }
  }, [seleccionadoId])

  // Solo usamos la ficha si corresponde al municipio seleccionado ahora mismo.
  const fichaActual = seleccionadoId && ficha.id === seleccionadoId ? ficha.dato : null
  const sitiosDestacados = useMemo(
    () => (fichaActual ? sitiosTop(fichaActual.sitios, 3) : []),
    [fichaActual],
  )

  // Lista ordenada por RELEVANCIA por defecto (municipios con contenido y más
  // recursos arriba; vacíos al final). El orden "Relevancia" del toolbar conserva
  // este orden; "A–Z"/"Z–A" reordenan por nombre. Con el filtro "solo con
  // contenido" activo se dejan únicamente los municipios con contenido editorial.
  const items = useMemo<ItemMuni[]>(
    () =>
      ordenarMunicipiosPorRelevancia(municipios)
        .filter((m) => !soloConContenido || m.tieneContenido)
        .map((m) => ({
          municipio: m,
          title: titulo(m.nombre),
          textoBusqueda: m.provincia?.nombre ?? '',
        })),
    [municipios, soloConContenido],
  )

  const filtro = useFiltroLista<ItemMuni>(items, { porPagina: 12 })

  if (cargando) return <Loader label="Cargando municipios" />

  const sinDatos = municipios.length === 0

  return (
    <Container as="main" maxWidth={1200} className={styles.pagina}>
      <SectionHeader
        title="Municipios de Santander"
        subtitle="Un recorrido por los 87 municipios del departamento. Toca uno en el mapa o búscalo en la lista para ver sus sitios turísticos, artesanos y prestadores, con su historia y sus leyendas."
      />

      {/* Totales del departamento */}
      {!sinDatos && (
        <ul className={styles.totales} aria-label="Resumen del departamento">
          <li>
            <strong>{totales.municipios}</strong> municipios
          </li>
          <li>
            <strong>{totales.sitios}</strong> sitios
          </li>
          <li>
            <strong>{totales.artesanos}</strong> artesanos
          </li>
          <li>
            <strong>{totales.prestadores}</strong> prestadores
          </li>
        </ul>
      )}

      {sinDatos && (
        <div className={styles.aviso} role="status">
          <Heading level={2} size={4}>
            Aún no podemos mostrar los municipios
          </Heading>
          <Text muted>
            No se pudo cargar la información de recursos por municipio. Es posible que el servicio
            no esté disponible por ahora. Vuelve a intentarlo más tarde; mientras tanto, puedes
            explorar los <Link to="/">sitios turísticos desde el inicio</Link>.
          </Text>
        </div>
      )}

      {/* Mapa coroplético + panel de selección */}
      <section className={styles.mapaSeccion} aria-label="Mapa de municipios">
        <div className={styles.mapaCol}>
          <MapaMunicipios
            municipios={municipios}
            seleccionadoDane={seleccionadoDane}
            onSeleccionar={setSeleccionadoDane}
          />
        </div>
        <aside className={styles.panel} aria-live="polite">
          {seleccionado ? (
            <div className={styles.preview}>
              <FotoConCredito
                imagen={seleccionado.imagen}
                alt={`Foto de ${titulo(seleccionado.nombre)}`}
                className={styles.previewFoto}
              />
              <Heading level={2} size={4} className={styles.previewNombre}>
                {titulo(seleccionado.nombre)}
              </Heading>
              {seleccionado.provincia && (
                <p className={styles.previewProv}>
                  <span aria-hidden="true">📍</span> Provincia de {seleccionado.provincia.nombre}
                </p>
              )}
              <p className={styles.previewDesc}>
                {
                  descripcionMunicipio(
                    {
                      resena: fichaActual?.resena,
                      leyenda: fichaActual?.leyenda,
                      historia: fichaActual?.historia,
                    },
                    {
                      nombre: seleccionado.nombre,
                      provincia: seleccionado.provincia?.nombre,
                    },
                  ).texto
                }
              </p>
              <p className={styles.previewRec}>{resumenRecursos(seleccionado)}</p>

              {sitiosDestacados.length > 0 && <PreviewSitiosTop sitios={sitiosDestacados} />}

              <Link to={`/municipios/${seleccionado.id}`} className={styles.previewLink}>
                Ver el municipio →
              </Link>
            </div>
          ) : (
            <div className={styles.hint}>
              <p>
                <span aria-hidden="true">🗺️</span> Toca un municipio en el mapa para ver su resumen,
                o búscalo en la lista de abajo.
              </p>
              <p className={styles.hintMuted}>
                El color indica cuántos recursos turísticos tiene publicados cada municipio: a más
                intenso, más recursos.
              </p>
            </div>
          )}
        </aside>
      </section>

      {/* Listado buscable */}
      {!sinDatos && (
        <section className={styles.listaSeccion} aria-labelledby="lista-titulo">
          <Heading level={2} size={3} id="lista-titulo" className={styles.listaTitulo}>
            Todos los municipios
          </Heading>
          {conContenido > 0 && (
            <label className={styles.filtroContenido}>
              <input
                type="checkbox"
                checked={soloConContenido}
                onChange={(e) => setSoloConContenido(e.target.checked)}
              />
              <span>
                Solo municipios con guía{' '}
                <span className={styles.filtroCuenta}>({conContenido})</span>
              </span>
            </label>
          )}
          <ListToolbar
            q={filtro.q}
            onQ={filtro.setQ}
            orden={filtro.orden}
            onOrden={filtro.setOrden}
            etiquetaBusqueda="Buscar municipio o provincia"
            total={filtro.total}
            mostrados={filtro.mostrados}
            sustantivo="municipios"
            singular="municipio"
            controla="rejilla-municipios"
          />
          <ul id="rejilla-municipios" className={styles.rejilla}>
            {filtro.visibles.map(({ municipio: m }) => (
              <li key={m.id}>
                <Card
                  imagen={m.imagen}
                  imageAlt={`Foto de ${titulo(m.nombre)}`}
                  title={titulo(m.nombre)}
                  badge={m.tieneContenido ? 'Con guía' : undefined}
                  chips={
                    m.provincia
                      ? [{ texto: m.provincia.nombre, icono: '📍', tono: 'neutral' }]
                      : undefined
                  }
                  meta={[
                    { icono: '🗺️', texto: `${m.recursos.sitios} sitios` },
                    { icono: '🧵', texto: `${m.recursos.artesanos} artesanos` },
                    { icono: '🧳', texto: `${m.recursos.prestadores} prestadores` },
                  ]}
                  linkTo={`/municipios/${m.id}`}
                  linkLabel="Ver municipio"
                />
              </li>
            ))}
          </ul>
          {filtro.total === 0 && (
            <Text muted className={styles.vacio}>
              No hay municipios que coincidan con tu búsqueda.
            </Text>
          )}
          {filtro.hayMas && (
            <div className={styles.verMas}>
              <button type="button" className={styles.verMasBtn} onClick={filtro.verMas}>
                Ver más municipios
              </button>
            </div>
          )}
        </section>
      )}
    </Container>
  )
}
