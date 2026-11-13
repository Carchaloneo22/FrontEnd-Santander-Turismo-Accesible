import { useEffect } from 'react'
import { Container } from '../../components/ui/Container'
import { Heading } from '../../components/ui/Heading'
import { Link } from '../../components/ui/Link'
import styles from './Legal.module.css'

/**
 * Declaración de accesibilidad del portal — cierre de LEGAL-02 de la auditoría.
 *
 * Exigida por la Resolución MinTIC 1519 de 2020 (anexo técnico de accesibilidad)
 * para los sujetos obligados del Estado colombiano, que adopta las WCAG 2.1 como
 * referente. Sigue el modelo de "declaración de accesibilidad" habitual
 * (conformidad declarada, fecha y método de evaluación, limitaciones conocidas y
 * canal de contacto para reportar barreras).
 *
 * El estado se declara "PARCIALMENTE CONFORME": la base del portal cumple WCAG
 * 2.1 AA y así lo verifica la suite automática, pero quedan áreas con
 * limitaciones conocidas (listadas abajo) que impiden declarar conformidad
 * total. Declarar de más sería una afirmación legal falsa.
 */
export function DeclaracionAccesibilidadPage() {
  useEffect(() => {
    const previo = document.title
    document.title = 'Declaración de accesibilidad — Santander Accesible'
    return () => {
      document.title = previo
    }
  }, [])

  return (
    <Container as="article" maxWidth={840} className={styles.wrap}>
      <Heading level={1} size={2}>
        Declaración de accesibilidad
      </Heading>
      <p className={styles.updated}>
        Portal «Santander Accesible» — Gobernación de Santander · Última revisión: 31 de octubre de
        2026.
      </p>

      <p>
        La Gobernación de Santander se compromete a que su portal de turismo accesible pueda ser
        usado por el mayor número posible de personas, con independencia de sus capacidades técnicas
        o funcionales. Esta declaración se publica en cumplimiento de la Resolución MinTIC 1519 de
        2020, que adopta los criterios de las Pautas de Accesibilidad para el Contenido Web (WCAG)
        como referente obligatorio para los portales del Estado colombiano.
      </p>

      <Heading level={2} size={4}>
        Nivel de conformidad
      </Heading>
      <p>
        Este portal es <strong>parcialmente conforme</strong> con las{' '}
        <strong>WCAG 2.1 en nivel AA</strong>. «Parcialmente conforme» significa que la mayor parte
        del contenido cumple el nivel AA, pero existen algunas excepciones conocidas que se detallan
        en el apartado «Contenido no accesible».
      </p>

      <Heading level={2} size={4}>
        Fecha de la evaluación
      </Heading>
      <p>
        La evaluación de accesibilidad más reciente se realizó el{' '}
        <strong>31 de octubre de 2026</strong>. La declaración se revisa cuando cambian el método de
        evaluación, el alcance o los resultados.
      </p>

      <Heading level={2} size={4}>
        Método de evaluación
      </Heading>
      <p>La conformidad se verifica combinando dos métodos:</p>
      <ul className={styles.lista}>
        <li>
          <strong>Auditoría automática.</strong> La suite de pruebas del proyecto ejecuta{' '}
          <Link to="https://github.com/dequelabs/axe-core" external className={styles.enlace}>
            axe-core
          </Link>{' '}
          contra las páginas y componentes principales (inicio, listados de lugares y eventos,
          fichas de detalle, acceso/registro, panel de gestión y el propio panel de accesibilidad),
          acotada a las reglas de las normas WCAG 2.0 y 2.1 niveles A y AA. Estas pruebas se
          ejecutan de forma continua en cada cambio del código, de modo que una regresión de
          accesibilidad detiene la integración.
        </li>
        <li>
          <strong>Revisión manual.</strong> Se complementa con revisión manual de los aspectos que
          una herramienta automática no puede comprobar por sí sola: contraste de color real,
          navegación completa con teclado, orden de foco, uso con lector de pantalla y
          comprensibilidad del contenido.
        </li>
      </ul>

      <Heading level={2} size={4}>
        Contenido no accesible
      </Heading>
      <p>
        A la fecha de esta declaración, los siguientes contenidos pueden no ser plenamente
        accesibles en nivel AA. Trabajamos para corregirlos:
      </p>
      <ul className={styles.lista}>
        <li>
          <strong>Experiencia en realidad virtual (metaverso 360°).</strong> El recorrido inmersivo
          en 3D/VR se apoya en una representación visual y espacial que no tiene aún una alternativa
          equivalente para personas con discapacidad visual. La información turística que ofrece
          está también disponible en las fichas de detalle, que sí son accesibles.
        </li>
        <li>
          <strong>Mapas interactivos.</strong> Los mapas (MapLibre) son un medio esencialmente
          visual. La información de ubicación y contacto de cada lugar se ofrece además en texto en
          su ficha, de modo que no depende únicamente del mapa.
        </li>
        <li>
          <strong>Contenido aportado por terceros.</strong> Las fotografías, descripciones y
          materiales que cargan los prestadores turísticos y las casas de cultura pueden no cumplir
          siempre los requisitos (por ejemplo, texto alternativo poco descriptivo). Se revisan y se
          solicita su corrección a quien los aporta.
        </li>
        <li>
          <strong>Contraste de color.</strong> El contraste se verifica mediante revisión manual
          sobre el diseño real; la auditoría automática no puede medirlo en el entorno de pruebas
          porque este no renderiza los estilos visuales.
        </li>
      </ul>

      <Heading level={2} size={4}>
        Tecnologías en las que se basa la accesibilidad
      </Heading>
      <p>
        La accesibilidad del portal se apoya en HTML, WAI-ARIA, CSS y JavaScript. Se ha probado con
        navegadores actuales y sus lectores de pantalla asociados. El portal ofrece además un panel
        de accesibilidad propio con alto contraste, ajuste del tamaño del texto, lengua de señas y
        narrador, y respeta la preferencia del sistema de «reducir el movimiento».
      </p>

      <Heading level={2} size={4}>
        Reporte de barreras y contacto
      </Heading>
      <p>
        Si encuentras una barrera de accesibilidad en este portal, o necesitas un contenido en un
        formato alternativo, por favor repórtalo. Atenderemos tu solicitud y la usaremos para seguir
        mejorando:
      </p>
      <ul className={styles.lista}>
        <li>
          Correo electrónico:{' '}
          <Link
            to="mailto:contactenos@santander.gov.co?subject=Barrera%20de%20accesibilidad%20-%20Santander%20Accesible"
            external
            className={styles.enlace}
          >
            contactenos@santander.gov.co
          </Link>
        </li>
        <li>Conmutador: +57 (607) 691 5355</li>
        <li>Línea gratuita nacional: +57 018000 915 000</li>
        <li>Dirección: Calle 37 # 10-30, Palacio Amarillo, Bucaramanga, Santander (Colombia).</li>
      </ul>
      <p>
        Al reportar, indícanos la página (su dirección web), el problema que encontraste y, si
        puedes, el dispositivo y la tecnología de apoyo que usas. Procuramos responder en los plazos
        de la Ley 1755 de 2015 (derecho de petición).
      </p>

      <Heading level={2} size={4}>
        Procedimiento de quejas
      </Heading>
      <p>
        Si no estás conforme con la respuesta a tu reporte, puedes presentar una petición, queja o
        reclamo a través de los canales oficiales de atención a la ciudadanía de la Gobernación de
        Santander. También puedes consultar la{' '}
        <Link to="/politica-de-datos" className={styles.enlace}>
          Política de Tratamiento de Datos Personales
        </Link>{' '}
        y los{' '}
        <Link to="/terminos" className={styles.enlace}>
          Términos y Condiciones
        </Link>{' '}
        del portal.
      </p>
    </Container>
  )
}
