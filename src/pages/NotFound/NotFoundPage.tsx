import { useEffect } from 'react'
import { Container } from '../../components/ui/Container'
import { Heading } from '../../components/ui/Heading'
import { Text } from '../../components/ui/Text'
import { Link } from '../../components/ui/Link'
import styles from './NotFoundPage.module.css'

/**
 * Página 404 personalizada (usabilidad GD + WCAG): informa con claridad que la
 * página no existe, NO redirige de forma automática y ofrece vías para retomar
 * la navegación (inicio + secciones). El `document.title` cumple el criterio de
 * "título de página claro" (WCAG 2.4.2).
 */
export function NotFoundPage() {
  useEffect(() => {
    const previo = document.title
    document.title = 'Página no encontrada — Santander Accesible'
    return () => {
      document.title = previo
    }
  }, [])

  return (
    <Container as="section" maxWidth={720} className={styles.wrap}>
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      <Heading level={1} size={2} align="center">
        Página no encontrada
      </Heading>
      <Text as="p" align="center" className={styles.msg}>
        La página que buscas no existe o cambió de dirección. Puedes volver al inicio o explorar
        nuestros destinos, planes y servicios accesibles.
      </Text>
      <nav className={styles.actions} aria-label="Vías para continuar">
        <Link to="/" className={styles.btn}>
          Volver al inicio
        </Link>
        <Link to="/planes-turisticos" className={styles.btnOutline}>
          Ver planes turísticos
        </Link>
      </nav>
    </Container>
  )
}
