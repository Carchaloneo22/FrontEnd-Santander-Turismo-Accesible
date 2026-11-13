import { DoubleSide } from 'three'
import { texturaBandera } from '../lib/texturaCache'

interface BanderaColumnaProps {
  position: [number, number, number]
  /** Rotación de la columna: 0 en el muro norte, π en el sur. */
  rotY: number
}

/** Vuelo de la tela (lo largo) y vaina (el borde que abraza el asta). */
const VUELO = 0.82
const VAINA = VUELO * (341 / 512)
const LARGO_ASTA = VAINA + 0.22
/** Base del asta, medida para que la tela pase justo sobre los cuadros. */
export const ALTURA_BANDERA = 2.85

/**
 * BanderaColumna — bandera de Santander en su asta, montada a 45° sobre la
 * columna que separa un municipio del siguiente.
 *
 * Va colgada en alto y no plantada en el piso: las astas del suelo tapaban las
 * obras y hasta la vista de algunas ciudades. El asta sale de la columna a 45°
 * de alzado y otros 45° en planta, así que la tela se ve de frente tanto desde
 * el nodo de esa bahía como recorriendo la casa a lo largo.
 *
 * El vuelo y la altura están medidos al límite: la tela baja hasta 2.29 m y su
 * esquina más lejana pasa 5 cm por encima del cuadro más cercano (que acaba en
 * 2.39 m a 0.56 m de la columna), mientras la más ancha se queda en 0.73 m, por
 * dentro del nombre del municipio, que empieza a 1.0 m. Justo por estar tumbada
 * 45° cabe: su punto más bajo cae cerca de la columna, donde no hay obra. Si se
 * mueve el reparto del muro (ANCHO_BAHIA, SEP_COL o ALTURA_OBRA), estos dos
 * números hay que recalcularlos.
 */
export function BanderaColumna({ position, rotY }: BanderaColumnaProps) {
  const tela = texturaBandera()

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Soporte contra la columna */}
      <mesh>
        <boxGeometry args={[0.11, 0.11, 0.09]} />
        <meshBasicMaterial color="#6b5638" />
      </mesh>

      {/* Los dos giros del asta: 45° en planta y 45° de alzado. Dentro de este
          grupo el eje +Y local ES la dirección del asta, así que la tela se
          coloca como si el asta fuera vertical. */}
      <group rotation={[0, -Math.PI / 4, 0]}>
        <group rotation={[0, 0, -Math.PI / 4]}>
          <mesh position={[0, LARGO_ASTA / 2, 0]}>
            <cylinderGeometry args={[0.022, 0.022, LARGO_ASTA, 10]} />
            <meshBasicMaterial color="#6b5638" />
          </mesh>
          {/* Remate de cobre en la punta */}
          <mesh position={[0, LARGO_ASTA, 0]}>
            <sphereGeometry args={[0.04, 12, 10]} />
            <meshBasicMaterial color="#b87333" />
          </mesh>
          {/* Tela: la vaina sobre el asta y el vuelo saliendo perpendicular. */}
          <mesh position={[VUELO / 2 + 0.03, VAINA / 2 + 0.06, 0]}>
            <planeGeometry args={[VUELO, VAINA]} />
            <meshBasicMaterial map={tela} side={DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
