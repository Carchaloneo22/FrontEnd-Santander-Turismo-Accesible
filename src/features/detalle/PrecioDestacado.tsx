import styles from './PrecioDestacado.module.css'

interface Props {
  /** Monto ya formateado («$95.000») o estado («Consultar»). */
  valor: string
  /** Prefijo pequeño antes del monto: «desde», «por noche». */
  prefijo?: string
  /** Aclaración bajo el monto: «de referencia», «COP». */
  nota?: string
  /** Frase explicativa (p. ej. por qué se consulta el precio). */
  ayuda?: string
  /** true → sin monto real: estilo tenue, no finge un precio. */
  tenue?: boolean
}

/**
 * PrecioDestacado — el precio de una ficha, presentado como una caja clara en vez
 * de un texto perdido en la cabecera. Separa prefijo / monto / nota para que se
 * lea «desde $95.000 de referencia» sin que el número compita con las palabras.
 *
 * Cuando no hay precio (la plataforma CONECTA, no cobra), muestra «Consultar» en
 * tono apagado con una frase de ayuda: honesto y sin aparentar una cifra.
 */
export function PrecioDestacado({ valor, prefijo, nota, ayuda, tenue }: Props) {
  return (
    <div className={`${styles.caja} ${tenue ? styles.tenue : ''}`}>
      <div className={styles.montoWrap}>
        {prefijo && <span className={styles.prefijo}>{prefijo}</span>}
        <span className={styles.monto}>{valor}</span>
        {nota && <span className={styles.nota}>{nota}</span>}
      </div>
      {ayuda && <p className={styles.ayuda}>{ayuda}</p>}
    </div>
  )
}
