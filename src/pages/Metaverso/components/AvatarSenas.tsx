import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import type { NarracionActual } from '../hooks/useVrNarrator'
import { proveedorPlaceholder, type ProveedorSenas } from '../lib/senas'
import styles from './AvatarSenas.module.css'

interface AvatarSenasProps {
  /** El panel del intérprete está abierto (su toggle en el HUD). */
  visible: boolean
  /** Hay una audio-descripción de lugar sonando: el avatar interpreta en sync. */
  narrando: boolean
  /** Qué se describe ahora, para que el proveedor resuelva su clip. */
  narracion: NarracionActual | null
  /** De dónde sale el avatar. Pluggable; por defecto, placeholder. */
  proveedor?: ProveedorSenas
  onCerrar: () => void
}

/**
 * AvatarSenas — slot para un intérprete de Lengua de Señas Colombiana (LSC),
 * sincronizado con la audio-descripción: arranca y para con la voz (`narrando`).
 *
 * La fuente del avatar es PLUGGABLE (`ProveedorSenas`): hoy no hay intérprete y
 * el panel muestra un placeholder, pero el espacio, su toggle y la sincronía
 * quedan listos para cuando llegue el contenido real (video, stream o avatar 3D).
 *
 * Accesible: es una región etiquetada, con su botón de cerrar, y respeta
 * `prefers-reduced-motion` (sin pulso decorativo cuando el usuario lo pide).
 */
export function AvatarSenas({
  visible,
  narrando,
  narracion,
  proveedor = proveedorPlaceholder,
  onCerrar,
}: AvatarSenasProps) {
  const reduce = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const fuente = visible ? proveedor.resolver(narracion) : null

  // El video del intérprete sigue a la voz: reproduce mientras se narra, pausa
  // cuando calla. Así las señas y la audio-descripción cuentan lo mismo a la vez.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (narrando) void v.play().catch(() => {})
    else v.pause()
  }, [narrando, fuente])

  if (!visible) return null

  return (
    <aside
      className={styles.panel}
      role="region"
      aria-label="Intérprete de lengua de señas colombiana (LSC)"
    >
      <div className={styles.barra}>
        <span className={styles.titulo}>
          <span className={styles.glifo} aria-hidden="true">
            🧏
          </span>
          Señas (LSC)
        </span>
        <button
          type="button"
          className={styles.cerrar}
          onClick={onCerrar}
          aria-label="Cerrar intérprete de lengua de señas"
        >
          ✕
        </button>
      </div>

      <div className={styles.lienzo}>
        {fuente ? (
          <video
            ref={videoRef}
            className={styles.video}
            src={fuente.src}
            poster={fuente.poster}
            muted
            playsInline
            loop
            // Las señas son contenido, no adorno: no se desactivan por
            // reduced-motion; solo las sigue la voz (ver efecto).
          />
        ) : (
          <div className={styles.placeholder}>
            <span
              className={`${styles.figura} ${narrando && !reduce ? styles.interpretando : ''}`}
              aria-hidden="true"
            >
              🧏
            </span>
            <p className={styles.estado}>{narrando ? 'Interpretando…' : 'En pausa'}</p>
            <p className={styles.nota}>Intérprete de LSC en preparación</p>
          </div>
        )}
      </div>
    </aside>
  )
}
