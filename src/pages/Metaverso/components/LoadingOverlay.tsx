import { useProgress } from '@react-three/drei'
import { BanderaSantander } from '../../../components/ui/BanderaSantander'
import styles from '../MetaversoPage.module.css'

/**
 * LoadingOverlay — indicador 2D mientras carga la panorámica. Lee el progreso
 * global de carga de three (`useProgress`), así que aparece automáticamente al
 * entrar o al cambiar de lugar. Es 3D-específico (por eso vive aquí), pero
 * el indicador visual es la bandera de Santander ondeando (marca). El
 * `role="status"` + `aria-live` del contenedor lo anuncia a lectores de pantalla.
 */
export function LoadingOverlay() {
  const { active, progress } = useProgress()
  if (!active) return null

  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <BanderaSantander size={72} />
      <span>Cargando panorámica… {Math.round(progress)}%</span>
    </div>
  )
}
