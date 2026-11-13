import type { ReactNode } from 'react'
import { Container } from '../../components/ui/Container'
import { Link } from '../../components/ui/Link'
import { Breadcrumb, type Miga } from '../../components/ui/Breadcrumb'
import styles from './DetalleShell.module.css'

interface Props {
  migas: Miga[]
  /** Ruta del enlace "volver" del pie. */
  volverA: string
  volverEtiqueta: string
  children: ReactNode
}

/**
 * DetalleShell — marco común de las fichas de detalle: breadcrumb arriba,
 * contenido en el medio y un enlace "volver" al final.
 *
 * Va en un `<article>` (es una pieza de contenido autónoma) dentro del `<main>`
 * que ya provee el Layout — por eso aquí NO se repite el landmark `main`. El
 * breadcrumb es su propio `<nav>` y el "volver" es un enlace normal navegable
 * por teclado; ambos redundan con el breadcrumb para quien prefiera uno u otro.
 */
export function DetalleShell({ migas, volverA, volverEtiqueta, children }: Props) {
  return (
    <Container as="article" maxWidth={1000} className={styles.shell}>
      <Breadcrumb migas={migas} className={styles.migas} />
      {children}
      <div className={styles.volver}>
        <Link to={volverA} className={styles.volverEnlace}>
          ← {volverEtiqueta}
        </Link>
      </div>
    </Container>
  )
}
