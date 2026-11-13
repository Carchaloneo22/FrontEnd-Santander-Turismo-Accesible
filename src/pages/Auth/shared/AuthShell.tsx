import type { ReactNode } from 'react'
import { Link } from '../../../components/ui/Link'
import { BanderaSantander } from '../../../components/ui/BanderaSantander'
import { Franjas } from './Franjas'
import styles from './AuthShell.module.css'

interface AuthShellProps {
  /** Contenido de la tarjeta (formulario, wizard, confirmación…). */
  children: ReactNode
  /** Frase bajo la marca en el panel de bienvenida. */
  lema?: string
  /** Ancho máximo de la tarjeta (el wizard necesita más que el login). */
  ancho?: 'sm' | 'md' | 'lg'
}

/**
 * AuthShell — marco visual compartido por TODAS las pantallas de autenticación
 * (login público, login del panel, registro, recuperación). Replica el estilo
 * del banner del Home: un panel de bienvenida con foto de naturaleza de
 * Santander, degradado verde de marca, la bandera del departamento y las franjas
 * tricolor; junto a una tarjeta clara con el contenido.
 *
 * Accesible y responsive:
 * - Marca por página única: el `<h1>` lo pone cada pantalla DENTRO de `children`.
 * - El panel de bienvenida es decorativo (la foto lleva alt vacío y el bloque va
 *   tras el contenido en el orden del DOM en móvil); la información esencial vive
 *   siempre en la tarjeta.
 * - En móvil el panel se reduce a una cinta con la marca + franjas; la tarjeta
 *   ocupa el ancho.
 */
export function AuthShell({ children, lema, ancho = 'sm' }: AuthShellProps) {
  return (
    <div className={styles.wrap}>
      {/* Panel de bienvenida (estilo banner del Home). Decorativo. */}
      <aside className={styles.hero} aria-hidden="true">
        <Franjas className={styles.heroFranjas} />
        <div className={styles.heroBody}>
          <div className={styles.marca}>
            <BanderaSantander size={44} className={styles.bandera} />
            <span className={styles.marcaTexto}>
              <strong>SANTANDER</strong>
              <span className={styles.marcaSep}>·</span>
              <span className={styles.marcaAccesible}>ACCESIBLE</span>
            </span>
          </div>
          {lema && <p className={styles.lema}>{lema}</p>}
        </div>
      </aside>

      {/* Columna de contenido. */}
      <main className={styles.panel}>
        <div className={`${styles.card} ${styles[ancho]}`}>
          {/* Marca compacta visible en móvil (el hero se colapsa). */}
          <Link
            to="/"
            className={styles.marcaMovil}
            aria-label="Santander Accesible — ir al inicio"
          >
            <BanderaSantander size={30} />
            <span>
              <strong>SANTANDER</strong> · ACCESIBLE
            </span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}
