import { useCallback } from 'react'
import { CatalogoPage } from '../../components/sections/CatalogoPage'
import type { CardProps } from '../../components/ui/Card'
import { useListado } from '../../hooks/useListado'
import { planesService, type Plan } from '../../services'
import { imagenUrl } from '../../lib/gcs'
import { precio } from '../../lib/formato'
import { accesibilidadChip } from '../../lib/accesibilidad'
import { slugDe } from '../../features/destinos'

const BANNER = 'https://picsum.photos/seed/banner-planes/1600/600'

function planToCard(plan: Plan): CardProps {
  const conPrecio = plan.precio > 0
  return {
    image: imagenUrl(plan.img_url),
    // Sin imagen propia en la oferta → foto del prestador (con atribución).
    imagen: plan.imagen ?? undefined,
    imageAlt: `Plan turístico: ${plan.nombre}`,
    badge: plan.tipo_plan || 'Plan',
    title: plan.nombre,
    description: plan.descripcion ?? plan.incluye,
    chips: [...(plan.ciudad ? [{ texto: plan.ciudad, icono: '📍' }] : [])],
    meta: [
      ...(plan.duracion ? [{ icono: '⏱️', texto: plan.duracion }] : []),
      ...(plan.empresa ? [{ icono: '🏢', texto: plan.empresa }] : []),
    ],
    accesibilidad: accesibilidadChip(plan.accesibilidad),
    // Las ofertas reales aún no traen precio ni duración → "Consultar".
    precio: conPrecio
      ? { valor: precio(plan.precio), prefijo: 'desde', nota: 'por persona' }
      : { valor: 'Consultar', tenue: true },
    textoBusqueda: [plan.ciudad, plan.empresa, plan.tipo_plan, plan.accesibilidad]
      .filter(Boolean)
      .join(' '),
    // La ficha de detalle la crea otra sección; aquí solo se enlaza.
    linkTo: `/planes/${plan.slug ?? slugDe(plan.nombre)}`,
    linkLabel: 'Ver plan',
  }
}

export function PlanesPage() {
  // useCallback: `useListado` lo tiene como dependencia de su efecto, así que una
  // función nueva en cada render lo dispararía sin parar.
  const cargar = useCallback(() => planesService.listarPublico(), [])
  const { datos, cargando, error } = useListado<Plan>(
    cargar,
    'No pudimos cargar los planes turísticos. Inténtalo de nuevo en un momento.',
  )

  return (
    <CatalogoPage
      seo={{
        title: 'Planes turísticos accesibles en Santander — Santander Accesible',
        description:
          'Planes turísticos por Santander con accesibilidad real para personas con discapacidad visual, auditiva y motriz.',
      }}
      hero={{
        eyebrow: 'Planes turísticos',
        title: 'Viaja por Santander sin barreras',
        subtitle:
          'Planes armados con accesibilidad real: transporte adaptado, guianza en lengua de señas y alojamientos verificados.',
        banner: BANNER,
      }}
      grid={{
        title: 'Planes disponibles',
        subtitle: 'Cada plan indica su accesibilidad, duración y qué incluye.',
        loadingLabel: 'Cargando planes…',
        emptyLabel: 'Todavía no hay planes publicados. Vuelve pronto.',
        sustantivo: 'planes',
        singular: 'plan',
        etiquetaBusqueda: 'Busca por nombre, ciudad o palabra clave…',
      }}
      items={datos.map(planToCard)}
      cargando={cargando}
      error={error}
      etiquetaCarga="Cargando planes"
    />
  )
}
