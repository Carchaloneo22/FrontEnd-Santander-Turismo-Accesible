import type { InputHTMLAttributes } from 'react'
import styles from './Auth.module.css'

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  error?: string
}

/** Campo de formulario accesible: label + input + mensaje de error (role=alert). */
export function Campo({ label, id, error, ...rest }: CampoProps) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${id}-err`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
