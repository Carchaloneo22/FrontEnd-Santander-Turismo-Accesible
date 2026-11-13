import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, Mesh } from 'three'
import type { ThreeEvent } from '@react-three/fiber'

interface NodoTeleportProps {
  position: [number, number, number]
  yaw?: number
  activo?: boolean
  onIr: () => void
}

/**
 * NodoTeleport — Punto de teletransporte cyber-rojo elegante con soporte XR/Mando.
 */
export function NodoTeleport({ position, activo, onIr }: NodoTeleportProps) {
  const brilloRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (brilloRef.current) {
      const t = clock.getElapsedTime()
      brilloRef.current.scale.y = 1 + Math.sin(t * 3) * 0.15
    }
  })

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onIr()
  }

  const colorRojo = '#FF2222'
  const colorRojoBrillo = '#FF4444'

  return (
    <group position={[position[0], 0.015, position[2]]}>
      {/* ── 1. Anillo rojo exterior plano en el piso ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handlePointerDown}
        onPointerDown={handlePointerDown}
      >
        <ringGeometry args={[0.32, 0.42, 32]} />
        <meshBasicMaterial
          color={colorRojo}
          transparent
          opacity={activo ? 0.9 : 0.7}
          side={DoubleSide}
        />
      </mesh>

      {/* ── 2. Centro oscuro del botón interactivo ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handlePointerDown}
        onPointerDown={handlePointerDown}
      >
        <circleGeometry args={[0.3, 32]} />
        <meshBasicMaterial color="#150505" transparent opacity={0.8} />
      </mesh>

      {/* ── 3. Micro-brillo vertical ── */}
      <mesh ref={brilloRef} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.38, 0.42, 0.2, 32, 1, true]} />
        <meshBasicMaterial
          color={colorRojoBrillo}
          transparent
          opacity={activo ? 0.4 : 0.25}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── 4. Punto focal central ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color={colorRojoBrillo} />
      </mesh>
    </group>
  )
}
