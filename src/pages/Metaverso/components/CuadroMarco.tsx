import { Texture } from 'three'

const MARCO_COLOR = '#2d1f10'

interface CuadroMarcoProps {
  textura: Texture
}

/**
 * Cuadro montado en marco de madera para galerías
 */
export function CuadroMarco({ textura }: CuadroMarcoProps) {
  return (
    <group>
      {/* Marco de madera reposado en la pared */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[1.2, 1.5, 0.03]} />
        <meshBasicMaterial color={MARCO_COLOR} />
      </mesh>
      {/* Lienzo en la cara frontal del marco */}
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[1.1, 1.4]} />
        <meshBasicMaterial map={textura} toneMapped={false} />
      </mesh>
    </group>
  )
}
