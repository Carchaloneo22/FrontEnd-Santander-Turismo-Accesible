import styles from './ContactoBloque.module.css'

interface Props {
  telefono?: string | null
  whatsapp?: string | null
  email?: string | null
  sitioWeb?: string | null
  direccion?: string | null
  /** Mensaje cuando NO hay ningún dato de contacto. */
  vacioMensaje?: string
}

/** Normaliza un teléfono para `tel:`/`wa.me` (quita espacios y guiones). */
function soloDigitos(tel: string): string {
  return tel.replace(/[^\d+]/g, '')
}

/**
 * ContactoBloque — datos para CONTACTAR (teléfono, WhatsApp, email, sitio web,
 * dirección). Es el corazón de la plataforma: conecta al visitante con el
 * prestador o artesano, no reserva ni cobra.
 *
 * Accesible: lista de descripción `<dl>` (cada dato con su etiqueta leíble);
 * teléfono/WhatsApp/email son enlaces de acción reales (`tel:` / `wa.me` /
 * `mailto:`) que en móvil abren el marcador o el correo; el sitio web abre en
 * pestaña nueva con `rel` seguro. Cada enlace lleva `aria-label` explícito para
 * que el narrador diga "Llamar al 315…", no solo el número suelto. Si no hay
 * ningún dato, se dice en claro (no se finge un contacto que no existe).
 */
export function ContactoBloque({
  telefono,
  whatsapp,
  email,
  sitioWeb,
  direccion,
  vacioMensaje,
}: Props) {
  const hayAlgo = Boolean(telefono || whatsapp || email || sitioWeb || direccion)

  if (!hayAlgo) {
    return (
      <p className={styles.vacio}>
        {vacioMensaje ??
          'Este perfil todavía no publicó datos de contacto. La plataforma conecta visitantes y prestadores: vuelve pronto o consulta el lugar vinculado.'}
      </p>
    )
  }

  return (
    <dl className={styles.lista}>
      {telefono && (
        <div className={styles.fila}>
          <dt className={styles.etiqueta}>
            <span aria-hidden="true">📞</span> Teléfono
          </dt>
          <dd className={styles.valor}>
            <a href={`tel:${soloDigitos(telefono)}`} aria-label={`Llamar al ${telefono}`}>
              {telefono}
            </a>
          </dd>
        </div>
      )}
      {whatsapp && (
        <div className={styles.fila}>
          <dt className={styles.etiqueta}>
            <span aria-hidden="true">💬</span> WhatsApp
          </dt>
          <dd className={styles.valor}>
            <a
              href={`https://wa.me/${soloDigitos(whatsapp).replace(/^\+/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Escribir por WhatsApp al ${whatsapp}`}
            >
              {whatsapp}
            </a>
          </dd>
        </div>
      )}
      {email && (
        <div className={styles.fila}>
          <dt className={styles.etiqueta}>
            <span aria-hidden="true">✉️</span> Correo
          </dt>
          <dd className={styles.valor}>
            <a href={`mailto:${email}`} aria-label={`Enviar correo a ${email}`}>
              {email}
            </a>
          </dd>
        </div>
      )}
      {sitioWeb && (
        <div className={styles.fila}>
          <dt className={styles.etiqueta}>
            <span aria-hidden="true">🌐</span> Sitio web
          </dt>
          <dd className={styles.valor}>
            <a
              href={sitioWeb}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir el sitio web ${sitioWeb} en una pestaña nueva`}
            >
              {sitioWeb.replace(/^https?:\/\//, '')}
            </a>
          </dd>
        </div>
      )}
      {direccion && (
        <div className={styles.fila}>
          <dt className={styles.etiqueta}>
            <span aria-hidden="true">📍</span> Dirección
          </dt>
          <dd className={styles.valor}>{direccion}</dd>
        </div>
      )}
    </dl>
  )
}
