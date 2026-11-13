import type { TextareaHTMLAttributes } from 'react'
import styles from '../Auth.module.css'

interface CampoAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  id: string
  error?: string
}

/** Área de texto accesible: label + textarea + mensaje de error (role=alert). */
export function CampoArea({ label, id, error, ...rest }: CampoAreaProps) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        className={styles.textarea}
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
