import { useRef, useId } from 'react'
import styles from '../Auth.module.css'

interface CampoArchivoProps {
  etiqueta: string
  ayuda?: string
  archivo: File | null
  onElegir: (archivo: File | null) => void
  error?: string
  accept?: string
}

/**
 * CampoArchivo — selector de archivo accesible. El `<input type=file>` real
 * queda oculto visualmente (pero enfocable y etiquetado); el botón visible lo
 * dispara. Muestra el nombre del archivo elegido y el error asociado.
 */
export function CampoArchivo({
  etiqueta,
  ayuda,
  archivo,
  onElegir,
  error,
  accept = 'application/pdf,image/*',
}: CampoArchivoProps) {
  const ref = useRef<HTMLInputElement>(null)
  const id = useId()
  const ayudaId = `${id}-ayuda`
  const errId = `${id}-err`

  return (
    <div className={styles.archivo}>
      <label htmlFor={id} className={styles.archivoEtiqueta}>
        {etiqueta}
      </label>
      {ayuda && (
        <span id={ayudaId} className={styles.archivoAyuda}>
          {ayuda}
        </span>
      )}
      <div className={styles.archivoCaja} data-con-archivo={archivo ? 'true' : 'false'}>
        <button type="button" className={styles.archivoBtn} onClick={() => ref.current?.click()}>
          {archivo ? 'Cambiar archivo' : 'Elegir archivo'}
        </button>
        {archivo ? (
          <span className={styles.archivoNombre}>📎 {archivo.name}</span>
        ) : (
          <span className={styles.archivoVacio}>Ningún archivo seleccionado</span>
        )}
        <input
          ref={ref}
          id={id}
          type="file"
          accept={accept}
          className={styles.srOnly}
          aria-describedby={
            [ayuda ? ayudaId : '', error ? errId : ''].filter(Boolean).join(' ') || undefined
          }
          aria-invalid={error ? true : undefined}
          onChange={(e) => onElegir(e.target.files?.[0] ?? null)}
        />
      </div>
      {error && (
        <span id={errId} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
