import { etiquetaAccesible, type DimensionAccesibilidad } from './accesibilidad'
import styles from './AccesibilidadPanel.module.css'

interface Props {
  dimensiones: DimensionAccesibilidad[]
  /** Encabezado opcional de la sección (lo pone la página si no). */
  titulo?: string
}

/**
 * AccesibilidadPanel — las 4 dimensiones (movilidad, visual, auditiva,
 * cognitiva) con su nivel.
 *
 * Accesible y NO solo por color: cada tarjeta lleva icono + título + ETIQUETA DE
 * TEXTO del nivel ("Accesible", "Sin información"…), así que se entiende en
 * escala de grises y con alto contraste. El `aria-label` de cada ítem da el
 * nombre completo ("Accesibilidad movilidad: accesible") para que el narrador
 * global lo lea de una pieza al hover/focus. El tono (color) es un refuerzo, no
 * la única señal: el texto del nivel siempre está presente.
 */
export function AccesibilidadPanel({ dimensiones, titulo }: Props) {
  return (
    <section className={styles.seccion} aria-label={titulo ?? 'Accesibilidad'}>
      {titulo && <h2 className={styles.titulo}>{titulo}</h2>}
      <ul className={styles.rejilla}>
        {dimensiones.map((d) => (
          <li
            key={d.clave}
            className={`${styles.item} ${styles[d.tono]}`}
            aria-label={etiquetaAccesible(d)}
          >
            <span className={styles.icono} aria-hidden="true">
              {d.icono}
            </span>
            <span className={styles.texto}>
              <span className={styles.nombre}>{d.titulo}</span>
              <span className={styles.nivel}>
                <span className={styles.punto} aria-hidden="true" />
                {d.etiqueta}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
