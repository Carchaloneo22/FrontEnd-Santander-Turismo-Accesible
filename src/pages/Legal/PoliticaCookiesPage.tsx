import { useEffect } from 'react'
import { Container } from '../../components/ui/Container'
import { Heading } from '../../components/ui/Heading'
import { Link } from '../../components/ui/Link'
import { useConsentStore } from '../../store/consent.store'
import styles from './Legal.module.css'

/**
 * Política de Cookies (Ley 1581 + guías de Gobierno Digital). Contenido BORRADOR:
 * la redacción legal final debe validarla la Gobernación / su oficina jurídica.
 */
export function PoliticaCookiesPage() {
  const reabrir = useConsentStore((s) => s.reabrir)

  useEffect(() => {
    const previo = document.title
    document.title = 'Política de Cookies — Santander Accesible'
    return () => {
      document.title = previo
    }
  }, [])

  return (
    <Container as="article" maxWidth={840} className={styles.wrap}>
      <p className={styles.borrador}>
        Borrador de referencia — el texto legal definitivo debe validarlo la Gobernación.
      </p>
      <Heading level={1} size={2}>
        Política de uso de cookies y tecnologías similares
      </Heading>
      <p className={styles.updated}>Última actualización: por definir.</p>

      <Heading level={2} size={4}>
        1. Qué son
      </Heading>
      <p>
        Las cookies, el almacenamiento local y otras tecnologías similares permiten guardar y leer
        información en tu dispositivo. Algunas son imprescindibles para que el sitio funcione y sea
        seguro; otras son opcionales y solo se activan con tu consentimiento.
      </p>

      <Heading level={2} size={4}>
        2. Qué usamos en este portal
      </Heading>
      <div className={styles.tablaWrap}>
        <table className={styles.tabla}>
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Qué es</th>
              <th>Finalidad</th>
              <th>Quién la gestiona</th>
              <th>Conservación</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Estrictamente necesarias</td>
              <td>Cookie de sesión e indicadores de seguridad.</td>
              <td>Mantener la sesión iniciada y proteger el sitio (p. ej. anti-CSRF).</td>
              <td>Santander Accesible (propia).</td>
              <td>Hasta cerrar sesión / fin de la sesión.</td>
            </tr>
            <tr>
              <td>Preferencias (funcionales)</td>
              <td>Almacenamiento local del navegador.</td>
              <td>Recordar tus ajustes: tema, tamaño de texto, alto contraste, lengua de señas.</td>
              <td>Santander Accesible (propia).</td>
              <td>Hasta que las borres desde tu navegador.</td>
            </tr>
            <tr>
              <td>Mapas interactivos (opcional)</td>
              <td>Peticiones a proveedores de mapas (Esri, Carto).</td>
              <td>Mostrar el mapa de sitios turísticos.</td>
              <td>Terceros (Esri, CartoDB).</td>
              <td>Solo mientras usas el mapa.</td>
            </tr>
            <tr>
              <td>Experiencias 360° / VR (opcional)</td>
              <td>Contenido embebido desde CDN de terceros (A-Frame).</td>
              <td>Cargar recorridos inmersivos.</td>
              <td>Terceros (CDN de A-Frame).</td>
              <td>Solo mientras usas la experiencia.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading level={2} size={4}>
        3. Consentimiento: aceptar, denegar o revocar
      </Heading>
      <p>
        Al entrar por primera vez verás un aviso. Las categorías opcionales están{' '}
        <strong>desactivadas por defecto</strong>: solo se activan si las aceptas. Puedes cambiar tu
        elección o revocarla en cualquier momento:
      </p>
      <p>
        <button type="button" className={styles.btn} onClick={reabrir}>
          Configurar mis cookies
        </button>
      </p>

      <Heading level={2} size={4}>
        4. Datos personales
      </Heading>
      <p>
        El uso de estas tecnologías puede implicar el tratamiento de datos personales (como la
        dirección IP). Ese tratamiento se rige por la{' '}
        <Link to="/politica-de-datos" className={styles.enlace}>
          Política de Tratamiento de Datos Personales
        </Link>{' '}
        y por la Ley 1581 de 2012.
      </p>
    </Container>
  )
}
