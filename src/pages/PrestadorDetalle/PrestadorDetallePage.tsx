import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Heading } from '../../components/ui/Heading'
import { Text } from '../../components/ui/Text'
import { Badge } from '../../components/ui/Badge'
import { Link } from '../../components/ui/Link'
import { Loader } from '../../components/ui/Loader'
import { MiniMapa } from '../../components/ui/MiniMapa'
import {
  DetalleShell,
  EstadoError,
  AccesibilidadPanel,
  ContactoBloque,
  PrecioDestacado,
  dimensionesOferta,
} from '../../features/detalle'
import {
  hospedajeService,
  transporteService,
  planesService,
  lugaresService,
  type OfertaPublica,
  type Lugar,
} from '../../services'
import { resumenAccesibilidad } from '../../services/ofertaAVista'
import { useRecurso } from '../../hooks/useRecurso'
import { useSEO } from '../../hooks/useSEO'
import styles from './PrestadorDetallePage.module.css'

export type TipoPrestador = 'hospedaje' | 'transporte' | 'plan'

interface Config {
  cargar: (slug: string) => Promise<OfertaPublica>
  /** Palabra para el rol de quien ofrece (prestador / operador). */
  rol: string
  /** Icono del tipo, para el hero. */
  icono: string
  /** Breadcrumb y "volver" apuntan al listado correspondiente. */
  listadoRuta: string
  listadoEtiqueta: string
  breadcrumb: string
  /** Texto de ruta en la URL de la ficha (para SEO/canonical). */
  rutaBase: string
  noEncontrado: string
}

const CONFIG: Record<TipoPrestador, Config> = {
  hospedaje: {
    cargar: (s) => hospedajeService.detallePublico(s),
    rol: 'Prestador',
    icono: '🛏️',
    listadoRuta: '/hospedaje',
    listadoEtiqueta: 'Ver todos los hospedajes',
    breadcrumb: 'Hospedaje',
    rutaBase: '/hospedaje',
    noEncontrado: 'Este hospedaje no existe o aún no está publicado.',
  },
  transporte: {
    cargar: (s) => transporteService.detallePublico(s),
    rol: 'Operador',
    icono: '🚐',
    listadoRuta: '/transporte',
    listadoEtiqueta: 'Ver todo el transporte',
    breadcrumb: 'Transporte',
    rutaBase: '/transporte',
    noEncontrado: 'Esta oferta de transporte no existe o aún no está publicada.',
  },
  plan: {
    cargar: (s) => planesService.detallePublico(s),
    rol: 'Operador',
    icono: '🧭',
    listadoRuta: '/planes-turisticos',
    listadoEtiqueta: 'Ver todos los planes',
    breadcrumb: 'Planes turísticos',
    rutaBase: '/planes',
    noEncontrado: 'Este plan turístico no existe o aún no está publicado.',
  },
}

interface Props {
  tipo: TipoPrestador
}

interface Datos {
  oferta: OfertaPublica
  /** Lugar vinculado (para contacto y mapa). Best-effort: null si no carga. */
  lugar: Lugar | null
}

/**
 * PrestadorDetallePage — ficha de una oferta de prestador: hospedaje, transporte
 * o plan turístico (/hospedaje/:slug, /transporte/:slug, /planes/:slug).
 *
 * Los tres consumen la MISMA ficha pública del backend (`GET /ofertas/:slug`),
 * así que comparten página parametrizada por `tipo`. La oferta pública es
 * DELGADA: trae prestador (solo nombre comercial), accesibilidad por dimensión y
 * lugares vinculados, pero NO precio-valor ni contacto directo del gestor (el
 * backend aún no lo expone). Por eso:
 *   - el precio se muestra como "Consultar" (la plataforma conecta, no cobra);
 *   - el CONTACTO se toma del LUGAR vinculado (que sí trae teléfono/web/dirección
 *     reales), etiquetado como el punto de referencia de la oferta;
 *   - nunca se inventan datos: si no hay contacto, se dice en claro.
 */
export function PrestadorDetallePage({ tipo }: Props) {
  const { slug } = useParams<{ slug: string }>()
  const cfg = CONFIG[tipo]

  const cargar = useCallback(async (): Promise<Datos> => {
    const oferta = await cfg.cargar(slug ?? '')
    let lugar: Lugar | null = null
    const slugLugar = oferta.lugares[0]?.slug
    if (slugLugar) {
      try {
        lugar = await lugaresService.detalle(slugLugar)
      } catch {
        // El contacto del lugar es un extra; si no carga, la ficha de la oferta
        // sigue siendo útil.
      }
    }
    return { oferta, lugar }
  }, [cfg, slug])

  const { dato, cargando, error } = useRecurso(cargar, 'No se pudo cargar la ficha.')

  const dimensiones = useMemo(
    () => (dato ? dimensionesOferta(dato.oferta.accesibilidad) : []),
    [dato],
  )

  useSEO({
    title: dato ? dato.oferta.titulo : cfg.breadcrumb,
    description: dato?.oferta.descripcion ?? undefined,
    path: `${cfg.rutaBase}/${slug ?? ''}`,
    type: 'article',
  })

  if (cargando) return <Loader label="Cargando ficha" />

  if (error || !dato) {
    return (
      <EstadoError
        titulo="Ficha no encontrada"
        mensaje={error}
        mensajePorDefecto={cfg.noEncontrado}
        volverA={cfg.listadoRuta}
        volverEtiqueta={cfg.listadoEtiqueta}
      />
    )
  }

  const { oferta, lugar } = dato
  const resumen = resumenAccesibilidad(oferta.accesibilidad)

  return (
    <DetalleShell
      migas={[
        { etiqueta: 'Inicio', a: '/' },
        { etiqueta: cfg.breadcrumb, a: cfg.listadoRuta },
        { etiqueta: oferta.titulo },
      ]}
      volverA={cfg.listadoRuta}
      volverEtiqueta={cfg.listadoEtiqueta}
    >
      <header className={styles.hero}>
        <span className={styles.heroIcono} aria-hidden="true">
          {cfg.icono}
        </span>
        <div className={styles.heroTexto}>
          <span className={styles.eyebrow}>{cfg.breadcrumb}</span>
          <Heading level={1} size={2}>
            {oferta.titulo}
          </Heading>
          <ul className={styles.etiquetas} aria-label="Clasificación de la oferta">
            {oferta.destacado && (
              <li>
                <Badge variant="success">★ Destacado</Badge>
              </li>
            )}
            {oferta.lugares[0] && (
              <li>
                <Badge variant="neutral" aria-label={`Ubicación: ${oferta.lugares[0].nombre}`}>
                  <span aria-hidden="true">📍</span> {oferta.lugares[0].nombre}
                </Badge>
              </li>
            )}
            <li>
              <Badge variant="neutral">
                <span aria-hidden="true">🧑‍💼</span> {oferta.gestor.nombreComercial}
              </Badge>
            </li>
          </ul>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.principal}>
          {oferta.descripcion && (
            <section className={styles.bloque} aria-label="Descripción">
              <Text size="lg">{oferta.descripcion}</Text>
            </section>
          )}

          {tipo === 'plan' && (
            <section className={styles.bloque} aria-labelledby="incluye-titulo">
              <Heading level={2} size={4} id="incluye-titulo">
                Qué incluye
              </Heading>
              <dl className={styles.ficha}>
                <div className={styles.fichaFila}>
                  <dt>
                    <span aria-hidden="true">⏱️</span> Duración
                  </dt>
                  <dd>Consulta con el operador</dd>
                </div>
                <div className={styles.fichaFila}>
                  <dt>
                    <span aria-hidden="true">🧭</span> Modalidad
                  </dt>
                  <dd>{oferta.tipo === 'guianza' ? 'Guianza' : 'Experiencia'}</dd>
                </div>
                <div className={styles.fichaFila}>
                  <dt>
                    <span aria-hidden="true">♿</span> Accesibilidad
                  </dt>
                  <dd>{resumen}</dd>
                </div>
              </dl>
            </section>
          )}

          <AccesibilidadPanel dimensiones={dimensiones} titulo="Accesibilidad" />

          {oferta.lugares.length > 0 && (
            <section className={styles.bloque} aria-labelledby="lugares-titulo">
              <Heading level={2} size={4} id="lugares-titulo">
                {tipo === 'plan' ? 'Lugares del recorrido' : 'Dónde está'}
              </Heading>
              <ul className={styles.lugares}>
                {oferta.lugares.map((l) => (
                  <li key={l.id}>
                    <Link to={`/lugares/${l.slug}`}>{l.nombre}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className={styles.aside} aria-label="Precio y contacto">
          {/* La plataforma conecta, no cobra: sin precio-valor → "Consultar". */}
          <PrecioDestacado
            valor="Consultar"
            tenue
            ayuda={`La plataforma conecta visitantes y prestadores. El precio lo acuerdas directamente con ${oferta.gestor.nombreComercial}.`}
          />

          <section className={styles.contacto} aria-labelledby="contacto-titulo">
            <Heading level={2} size={4} id="contacto-titulo">
              {cfg.rol}: {oferta.gestor.nombreComercial}
            </Heading>
            <Text muted size="sm">
              Para reservar o resolver dudas, contacta directamente a{' '}
              {oferta.gestor.nombreComercial}
              {lugar ? ` o al punto de referencia (${lugar.nombre}):` : '.'}
            </Text>
            <ContactoBloque
              telefono={lugar?.telefono}
              sitioWeb={lugar?.sitioWeb}
              direccion={lugar?.direccion}
              vacioMensaje={`${oferta.gestor.nombreComercial} aún no publicó datos de contacto directo. Puedes escribir a través de la Gobernación de Santander o consultar el lugar vinculado.`}
            />
            {lugar?.latitud != null && lugar?.longitud != null && (
              <MiniMapa
                lat={lugar.latitud}
                lng={lugar.longitud}
                nombre={lugar.nombre}
                direccion={lugar.direccion}
              />
            )}
          </section>
        </aside>
      </div>
    </DetalleShell>
  )
}
