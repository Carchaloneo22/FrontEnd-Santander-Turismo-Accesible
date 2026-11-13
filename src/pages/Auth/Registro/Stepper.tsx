import styles from '../Auth.module.css'

interface StepperProps {
  pasos: string[]
  /** Índice (0-based) del paso actual. */
  actual: number
}

/**
 * Stepper — indicador de progreso del wizard. Accesible: es una lista ordenada
 * con `aria-current="step"` en el paso activo y un texto oculto que anuncia
 * "Paso N de M" para lectores de pantalla.
 */
export function Stepper({ pasos, actual }: StepperProps) {
  return (
    <nav aria-label="Progreso del registro">
      <p className={styles.srOnly}>
        Paso {actual + 1} de {pasos.length}: {pasos[actual]}
      </p>
      <ol className={styles.stepper}>
        {pasos.map((p, i) => {
          const estado = i < actual ? styles.pasoHecho : i === actual ? styles.pasoActivo : ''
          return (
            <li
              key={p}
              className={`${styles.paso} ${estado}`}
              aria-current={i === actual ? 'step' : undefined}
            >
              <span className={styles.pasoNum} aria-hidden="true">
                {i < actual ? '✓' : i + 1}
              </span>
              {p}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
