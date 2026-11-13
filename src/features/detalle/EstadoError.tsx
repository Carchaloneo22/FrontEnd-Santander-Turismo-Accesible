import { Container } from '../../components/ui/Container'
import { Heading } from '../../components/ui/Heading'
import { Text } from '../../components/ui/Text'
import { Link } from '../../components/ui/Link'
import styles from './EstadoError.module.css'

interface Props {
  titulo: string
  /**
   * Mensaje para la persona. Suele ser el del backend, que distingue "no está
   * publicado" (definitivo) de "la API no respondió" (reintentar). Si no hay,
   * se usa `mensajePorDefecto`.
   */
  mensaje?: string | null
  mensajePorDefecto: string
  volverA: string
  volverEtiqueta: string
}

/**
 * EstadoError — estado de error / "no encontrado" de una ficha de detalle.
 * Accesible: `role="alert"` para que el lector lo anuncie al aparecer, un `h1`
 * con el título del problema y un enlace claro para seguir navegando.
 */
export function EstadoError({
  titulo,
  mensaje,
  mensajePorDefecto,
  volverA,
  volverEtiqueta,
}: Props) {
  return (
    <Container maxWidth={640} className={styles.caja}>
      <div role="alert" className={styles.contenido}>
        <Heading level={1} size={2}>
          {titulo}
        </Heading>
        <Text muted>{mensaje || mensajePorDefecto}</Text>
      </div>
      <Link to={volverA} className={styles.volver}>
        ← {volverEtiqueta}
      </Link>
    </Container>
  )
}
