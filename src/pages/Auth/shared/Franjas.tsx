import styles from './AuthShell.module.css'

/**
 * Franjas — barra tricolor de la bandera de Santander (verde · amarillo · rojo).
 * Es puramente decorativa (el nombre de la marca ya se anuncia en texto), por eso
 * `aria-hidden`. Se usa como remate superior del panel de bienvenida y como
 * cinta fina en la cabecera móvil.
 */
export function Franjas({ className = '' }: { className?: string }) {
  return (
    <span className={`${styles.franjas} ${className}`} aria-hidden="true">
      <span className={styles.franjaVerde} />
      <span className={styles.franjaAmarilla} />
      <span className={styles.franjaRoja} />
    </span>
  )
}
