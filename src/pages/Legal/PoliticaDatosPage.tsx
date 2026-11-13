import { useEffect } from 'react'
import { Container } from '../../components/ui/Container'
import { Heading } from '../../components/ui/Heading'
import { Link } from '../../components/ui/Link'
import styles from './Legal.module.css'

/**
 * Política de Tratamiento de Datos Personales (Ley 1581 de 2012). Contenido
 * BORRADOR: la redacción y los datos del responsable debe fijarlos la Gobernación.
 */
export function PoliticaDatosPage() {
  useEffect(() => {
    const previo = document.title
    document.title = 'Política de Tratamiento de Datos — Santander Accesible'
    return () => {
      document.title = previo
    }
  }, [])

  return (
    <Container as="article" maxWidth={840} className={styles.wrap}>
      <p className={styles.borrador}>
        Borrador de referencia — el responsable, los canales y la redacción legal definitiva debe
        fijarlos la Gobernación de Santander.
      </p>
      <Heading level={1} size={2}>
        Política de Tratamiento de Datos Personales
      </Heading>
      <p className={styles.updated}>
        En cumplimiento de la Ley 1581 de 2012 y sus decretos reglamentarios · Última actualización:
        por definir.
      </p>

      <Heading level={2} size={4}>
        1. Responsable del tratamiento
      </Heading>
      <p>
        Gobernación de Santander [datos de contacto, dirección, correo y teléfono por definir]. Este
        portal de turismo accesible trata datos personales bajo su responsabilidad.
      </p>

      <Heading level={2} size={4}>
        2. Datos que se recolectan
      </Heading>
      <ul className={styles.lista}>
        <li>Datos de contacto que envíes voluntariamente (p. ej. en formularios).</li>
        <li>Datos de cuenta si te registras o inicias sesión.</li>
        <li>
          Datos técnicos derivados de la navegación (p. ej. dirección IP), según las cookies que
          aceptes.
        </li>
      </ul>

      <Heading level={2} size={4}>
        3. Finalidad
      </Heading>
      <ul className={styles.lista}>
        <li>Prestar y mejorar los servicios de información turística accesible.</li>
        <li>Gestionar cuentas, sesiones y seguridad.</li>
        <li>Atender solicitudes y comunicaciones.</li>
      </ul>
      <p>Los datos no se usan para finalidades distintas sin tu autorización.</p>

      <Heading level={2} size={4}>
        4. Derechos del titular (habeas data)
      </Heading>
      <p>Como titular puedes, de forma gratuita:</p>
      <ul className={styles.lista}>
        <li>Conocer, actualizar y rectificar tus datos.</li>
        <li>Solicitar prueba de la autorización otorgada.</li>
        <li>Ser informado del uso que se da a tus datos.</li>
        <li>Revocar la autorización y/o solicitar la supresión, cuando proceda.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
      </ul>

      <Heading level={2} size={4}>
        5. Cómo ejercer tus derechos
      </Heading>
      <p>
        Mediante el canal de atención que disponga la Gobernación [correo/formulario por definir].
        Las solicitudes se atenderán en los términos y plazos de la Ley 1581 de 2012.
      </p>

      <Heading level={2} size={4}>
        6. Cookies
      </Heading>
      <p>
        El detalle de las tecnologías de seguimiento está en la{' '}
        <Link to="/politica-de-cookies" className={styles.enlace}>
          Política de Cookies
        </Link>
        .
      </p>
    </Container>
  )
}
