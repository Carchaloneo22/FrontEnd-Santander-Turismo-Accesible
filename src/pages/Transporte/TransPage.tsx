import { useCallback } from 'react'
import { CatalogoPage } from '../../components/sections/CatalogoPage'
import type { CardProps } from '../../components/ui/Card'
import { useListado } from '../../hooks/useListado'
import { transporteService, type Ruta } from '../../services'
import { imagenUrl } from '../../lib/gcs'
import { precio, fechaHora } from '../../lib/formato'
import { slugDe } from '../../features/destinos'

const BANNER = 'https://picsum.photos/seed/banner-transporte/1600/600'

function rutaToCard(r: Ruta): CardProps {
  // La ficha de detalle la crea otra sección; aquí solo se enlaza con el slug
  // real de la oferta, o uno derivado del trayecto cuando el mock no lo trae.
  const slug = r.slug ?? slugDe([r.origen, r.destino].filter(Boolean).join('-'))
  const conPrecio = r.precio > 0
  const salida = r.fecha_salida ? fechaHora(r.fecha_salida, r.hora_salida) : ''
  return {
    image: imagenUrl(r.img_url),
    // Sin imagen propia en la oferta → foto del prestador (con atribución).
    imagen: r.imagen ?? undefined,
    imageAlt: `Ruta de ${r.origen} a ${r.destino}`,
    badge: 'Transporte',
    title: r.destino ? `${r.origen} → ${r.destino}` : r.origen,
    description: r.descripcion ?? undefined,
    meta: [
      ...(salida ? [{ icono: '🗓️', texto: salida }] : []),
      ...(r.empresa ? [{ icono: '🏢', texto: r.empresa }] : []),
    ],
    // Oferta real sin precio → "Consultar" (ver HospePage).
    precio: conPrecio
      ? { valor: precio(r.precio), prefijo: 'desde', nota: 'por trayecto' }
      : { valor: 'Consultar', tenue: true },
    textoBusqueda: [r.origen, r.destino, r.empresa, salida].filter(Boolean).join(' '),
    linkTo: `/transporte/${slug}`,
    linkLabel: 'Ver ruta',
  }
}

export function TransPage() {
  const cargar = useCallback(() => transporteService.listarPublico(), [])
  const { datos, cargando, error } = useListado<Ruta>(
    cargar,
    'No pudimos cargar las rutas de transporte. Inténtalo de nuevo en un momento.',
  )

  return (
    <CatalogoPage
      seo={{
        title: 'Transporte adaptado en Santander — Santander Accesible',
        description:
          'Rutas de transporte por Santander con vehículos adaptados para personas con movilidad reducida.',
      }}
      hero={{
        eyebrow: 'Transporte',
        title: 'Llegar no debería ser la parte difícil',
        subtitle:
          'Rutas por Santander en vehículos adaptados, con horarios y precios claros desde el principio.',
        banner: BANNER,
      }}
      grid={{
        title: 'Rutas disponibles',
        subtitle: 'Salidas programadas con su fecha, hora y empresa operadora.',
        loadingLabel: 'Cargando rutas…',
        emptyLabel: 'Todavía no hay rutas publicadas. Vuelve pronto.',
        sustantivo: 'rutas',
        singular: 'ruta',
        etiquetaBusqueda: 'Busca por origen, destino o empresa…',
      }}
      items={datos.map(rutaToCard)}
      cargando={cargando}
      error={error}
      etiquetaCarga="Cargando rutas"
    />
  )
}
