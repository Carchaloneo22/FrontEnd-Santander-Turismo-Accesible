import { useEffect } from 'react'
import { Container } from '../../components/ui/Container'
import { Heading } from '../../components/ui/Heading'
import { Link } from '../../components/ui/Link'
import styles from './Legal.module.css'

/**
 * Términos y Condiciones de uso del portal. Contenido BORRADOR: la redacción
 * definitiva debe validarla la oficina jurídica de la Gobernación de Santander.
 */
export function TerminosPage() {
  useEffect(() => {
    const previo = document.title
    document.title = 'Términos y Condiciones — Santander Accesible'
    return () => {
      document.title = previo
    }
  }, [])

  return (
    <Container as="article" maxWidth={840} className={styles.wrap}>
      <p className={styles.borrador}>
        Borrador de referencia — el texto legal definitivo debe validarlo la oficina jurídica de la
        Gobernación de Santander.
      </p>
      <Heading level={1} size={2}>
        Términos y Condiciones de Uso
      </Heading>
      <p className={styles.updated}>Última actualización: por definir.</p>

      <Heading level={2} size={4}>
        1. Objeto y aceptación
      </Heading>
      <p>
        Este portal es un servicio de información turística accesible del departamento de Santander.
        Al navegar o utilizar sus servicios, la persona usuaria acepta estos Términos y Condiciones.
        Si no está de acuerdo, debe abstenerse de usar el portal.
      </p>

      <Heading level={2} size={4}>
        2. Responsable
      </Heading>
      <p>
        Gobernación de Santander [datos de contacto por definir]. El portal se rige por la
        normatividad colombiana aplicable, en especial la Ley 1712 de 2014 (transparencia), la Ley
        1581 de 2012 (protección de datos personales) y la Resolución MinTIC 1519 de 2020.
      </p>

      <Heading level={2} size={4}>
        3. Uso del portal
      </Heading>
      <ul className={styles.lista}>
        <li>El acceso a la información publicada es libre y gratuito.</li>
        <li>
          La persona usuaria se compromete a hacer un uso lícito del portal y a no realizar
          actividades que afecten su disponibilidad, seguridad o integridad.
        </li>
        <li>
          No está permitido intentar acceder a áreas restringidas, alterar contenidos ni suplantar
          la identidad de terceros.
        </li>
      </ul>

      <Heading level={2} size={4}>
        4. Cuentas de usuario
      </Heading>
      <p>
        Algunos servicios requieren registro. La persona usuaria es responsable de la veracidad de
        los datos suministrados y de la custodia de sus credenciales. La Gobernación podrá suspender
        cuentas ante usos indebidos.
      </p>

      <Heading level={2} size={4}>
        5. Contenidos de terceros y aliados
      </Heading>
      <p>
        El portal difunde información de prestadores de servicios turísticos, casas de cultura y
        aliados. Esa información es suministrada por dichos terceros, quienes responden por su
        veracidad, vigencia y por las condiciones de accesibilidad que declaran. El portal puede
        enlazar a sitios externos sobre cuyo contenido no ejerce control.
      </p>

      <Heading level={2} size={4}>
        6. Contenidos enviados por las casas de cultura
      </Heading>
      <p>
        Quien cargue fotografías u otros materiales declara contar con los derechos necesarios y
        autoriza su publicación en el portal con fines de promoción turística del departamento, sin
        contraprestación económica. La Gobernación podrá retirar contenidos que incumplan la ley o
        estos términos.
      </p>

      <Heading level={2} size={4}>
        7. Propiedad intelectual
      </Heading>
      <p>
        Los contenidos propios del portal se publican conforme a la política de derechos de autor de
        la entidad. Las marcas, logotipos e imágenes de terceros pertenecen a sus titulares.
      </p>

      <Heading level={2} size={4}>
        8. Disponibilidad del servicio
      </Heading>
      <p>
        La Gobernación procura la disponibilidad continua del portal, pero puede suspenderlo
        temporalmente por mantenimiento, actualizaciones o causas de fuerza mayor, procurando avisar
        cuando sea posible.
      </p>

      <Heading level={2} size={4}>
        9. Protección de datos personales y cookies
      </Heading>
      <p>
        El tratamiento de datos personales se rige por la{' '}
        <Link to="/politica-de-datos" className={styles.enlace}>
          Política de Tratamiento de Datos Personales
        </Link>
        . El uso de cookies y tecnologías similares se detalla en la{' '}
        <Link to="/politica-de-cookies" className={styles.enlace}>
          Política de Cookies
        </Link>
        .
      </p>

      <Heading level={2} size={4}>
        10. Accesibilidad
      </Heading>
      <p>
        El portal se diseña siguiendo las directrices WCAG 2.1 nivel AA. Si encuentras una barrera
        de accesibilidad, puedes reportarla por los canales de atención para que sea corregida.
      </p>

      <Heading level={2} size={4}>
        11. Modificaciones
      </Heading>
      <p>
        La Gobernación puede actualizar estos Términos. La versión vigente será siempre la publicada
        en esta página, con su fecha de actualización.
      </p>

      <Heading level={2} size={4}>
        12. Ley aplicable
      </Heading>
      <p>
        Estos Términos se rigen por la legislación colombiana. Cualquier controversia se someterá a
        los jueces y tribunales competentes de Colombia.
      </p>
    </Container>
  )
}
