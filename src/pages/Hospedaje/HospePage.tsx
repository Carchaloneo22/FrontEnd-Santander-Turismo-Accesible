import { useCallback } from 'react'
import { CatalogoPage } from '../../components/sections/CatalogoPage'
import type { CardProps } from '../../components/ui/Card'
import { useListado } from '../../hooks/useListado'
import { hospedajeService, type Hospedaje } from '../../services'
import { imagenUrl } from '../../lib/gcs'
import { precio } from '../../lib/formato'
import { accesibilidadChip } from '../../lib/accesibilidad'
import { slugDe } from '../../features/destinos'

const BANNER = 'https://picsum.photos/seed/banner-hospedaje/1600/600'

function hospedajeToCard(h: Hospedaje): CardProps {
  const conPrecio = h.precio_noche > 0
  // La oferta no trae imagen propia todavía: si el prestador tiene foto (con su
  // atribución), se usa esa en vez del placeholder. `imagen` (con crédito) tiene
  // prioridad en la tarjeta sobre `image`; si no hay ninguna, cae al placeholder.
  const fotoPrestador = h.imagen ?? undefined
  return {
    image: imagenUrl(h.img_url),
    imagen: fotoPrestador,
    imageAlt: `Hospedaje: ${h.nombre}`,
    badge: h.tipo || 'Hospedaje',
    title: h.nombre,
    description: h.descripcion ?? undefined,
    chips: [{ texto: h.ciudad, icono: '📍' }],
    meta: [
      ...(h.empresa ? [{ icono: '🏢', texto: h.empresa }] : []),
      ...(h.capacidad_max > 0 ? [{ icono: '👥', texto: `Hasta ${h.capacidad_max} personas` }] : []),
    ],
    // La accesibilidad es el motivo de la plataforma: va destacada, no escondida.
    accesibilidad: accesibilidadChip(h.accesibilidad),
    // Las ofertas reales aún no traen precio (la plataforma conecta, no cobra):
    // sin precio → "Consultar". El mock sí trae precio por noche.
    precio: conPrecio
      ? { valor: precio(h.precio_noche), prefijo: 'desde', nota: 'por noche' }
      : { valor: 'Consultar', tenue: true },
    // Texto oculto para que el buscador siga encontrando por ciudad/operador.
    textoBusqueda: [h.ciudad, h.empresa, h.accesibilidad].filter(Boolean).join(' '),
    // La ficha de detalle la crea otra sección; aquí solo se enlaza.
    linkTo: `/hospedaje/${h.slug ?? slugDe(h.nombre)}`,
    linkLabel: 'Ver alojamiento',
  }
}

export function HospePage() {
  const cargar = useCallback(() => hospedajeService.listarPublico(), [])
  const { datos, cargando, error } = useListado<Hospedaje>(
    cargar,
    'No pudimos cargar los hospedajes. Inténtalo de nuevo en un momento.',
  )

  return (
    <CatalogoPage
      seo={{
        title: 'Hospedaje accesible en Santander — Santander Accesible',
        description:
          'Alojamientos en Santander con accesibilidad verificada: habitaciones adaptadas, rampas y personal capacitado.',
      }}
      hero={{
        eyebrow: 'Hospedaje',
        title: 'Dormir tranquilo también es accesibilidad',
        subtitle:
          'Alojamientos que declaran qué tienen adaptado, para que nadie llegue a averiguarlo en la recepción.',
        banner: BANNER,
      }}
      grid={{
        title: 'Alojamientos disponibles',
        subtitle: 'Cada ficha indica su accesibilidad, capacidad y precio por noche.',
        loadingLabel: 'Cargando hospedajes…',
        emptyLabel: 'Todavía no hay hospedajes publicados. Vuelve pronto.',
        sustantivo: 'hospedajes',
        singular: 'hospedaje',
        etiquetaBusqueda: 'Busca por nombre, ciudad o accesibilidad…',
      }}
      items={datos.map(hospedajeToCard)}
      cargando={cargando}
      error={error}
      etiquetaCarga="Cargando hospedajes"
    />
  )
}
