import { useCallback } from 'react'
import { CatalogoPage } from '../../components/sections/CatalogoPage'
import type { CardProps } from '../../components/ui/Card'
import { useListado } from '../../hooks/useListado'
import { ecommerceService, type Producto } from '../../services'
import { imagenUrl } from '../../lib/gcs'
import { precio } from '../../lib/formato'

const BANNER = 'https://picsum.photos/seed/banner-artesanias/1600/600'

function productoToCard(p: Producto): CardProps {
  const hayStock = p.stock > 0
  return {
    image: imagenUrl(p.img_url),
    imageAlt: `Artesanía: ${p.nombre}`,
    badge: p.categoria ?? 'Artesanía',
    title: p.nombre,
    description: p.descripcion ?? undefined,
    chips: [...(p.ciudad ? [{ texto: p.ciudad, icono: '📍' }] : [])],
    meta: p.artesano ? [{ icono: '🧑‍🎨', texto: p.artesano }] : undefined,
    // Sin stock la tarjeta lo dice en el precio: enterarse al pagar es peor.
    precio: hayStock ? { valor: precio(p.precio) } : { valor: 'Agotado', tenue: true },
    textoBusqueda: [p.artesano, p.ciudad, p.categoria].filter(Boolean).join(' '),
    // SIN enlace a detalle: estos productos son catálogo de DEMO (sin backend de
    // e-commerce) y `/artesanos/:slug` es el perfil del ARTESANO, no del producto.
    // Enlazar con un slug derivado del nombre del producto daba siempre ficha 404.
    // Cuando exista un backend real de productos/artesanos, se reconecta aquí.
  }
}

export function EcoPage() {
  const cargar = useCallback(() => ecommerceService.listar(), [])
  const { datos, cargando, error } = useListado<Producto>(
    cargar,
    'No pudimos cargar las artesanías. Inténtalo de nuevo en un momento.',
  )

  return (
    <CatalogoPage
      seo={{
        title: 'Artesanías de Santander — Santander Accesible',
        description:
          'Productos artesanales hechos en Santander, comprados directamente a sus artesanos.',
      }}
      hero={{
        eyebrow: 'Artesanías',
        title: 'Llévate Santander a casa',
        subtitle:
          'Piezas hechas a mano por artesanos de la región, compradas directamente a quien las hizo.',
        banner: BANNER,
      }}
      grid={{
        title: 'Productos disponibles',
        subtitle: 'Cada pieza indica su artesano, su origen y su precio.',
        loadingLabel: 'Cargando artesanías…',
        emptyLabel: 'Todavía no hay artesanías publicadas. Vuelve pronto.',
        sustantivo: 'artesanías',
        singular: 'artesanía',
        etiquetaBusqueda: 'Busca por nombre, artesano o ciudad…',
      }}
      items={datos.map(productoToCard)}
      cargando={cargando}
      error={error}
      etiquetaCarga="Cargando artesanías"
    />
  )
}
