import { DoubleSide } from 'three'

interface TechoReticularProps {
  largo: number
  ancho: number
  alto: number
  filas?: number
  columnas?: number
  grosorViga?: number
  colorViga?: string
}

/**
 * TechoReticular — Tragaluz Reticular Diurno con Sombras Proyectadas y Cristal Transparente.
 *
 * NOTAS TÉCNICAS SENIOR:
 * - Renderizado Directo de Vigas: Se utiliza un mapeo JSX explícito sobre [0, alto, 0] para garantizar
 *   la posición en la parte superior sin desplazamientos matriciales indeseados.
 * - Luz Solar con Sombras: Proyección calibrada para marcar la sombra de la retícula en el piso.
 * - Vidrio PBR Translúcido: Permite ver el cielo celeste exterior mientras recibe la luz del día.
 */
export function TechoReticular({
  largo,
  ancho,
  alto,
  filas = 8,
  columnas = 3,
  grosorViga = 0.35,
  colorViga = '#2b221b',
}: TechoReticularProps) {
  const pasoX = largo / filas
  const pasoZ = ancho / columnas

  // Arreglos para renderizar la malla de vigas
  const vigasTransversales = Array.from({ length: filas + 1 })
  const vigasLongitudinales = Array.from({ length: columnas + 1 })

  return (
    <group>
      {/* ── 1. Luz Solar Principal para Sombras Diagonales ── */}
      <directionalLight
        position={[15, alto + 15, 10]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-largo}
        shadow-camera-right={largo}
        shadow-camera-top={ancho}
        shadow-camera-bottom={-ancho}
        shadow-bias={-0.0001}
      />

      {/* ── 2. Luz de Relleno Diurna (Mantiene los Cuadros Iluminados) ── */}
      <ambientLight intensity={0.9} color="#ffffff" />

      {/* ── 3. Estructura de Vigas (Posicionada Arriba en 'alto') ── */}
      <group position={[0, alto, 0]}>
        {/* Vigas Transversales (Eje Z) */}
        {vigasTransversales.map((_, i) => {
          const x = -largo / 2 + i * pasoX
          return (
            <mesh key={`viga-x-${i}`} position={[x, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[grosorViga, grosorViga, ancho]} />
              <meshStandardMaterial color={colorViga} roughness={0.6} />
            </mesh>
          )
        })}

        {/* Vigas Longitudinales (Eje X) */}
        {vigasLongitudinales.map((_, j) => {
          const z = -ancho / 2 + j * pasoZ
          return (
            <mesh key={`viga-z-${j}`} position={[0, 0, z]} castShadow receiveShadow>
              <boxGeometry args={[largo, grosorViga, grosorViga]} />
              <meshStandardMaterial color={colorViga} roughness={0.6} />
            </mesh>
          )
        })}

        {/* ── 4. Vidrio Transparente del Tragaluz ── */}
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[largo, ancho]} />
          <meshStandardMaterial
            color="#a2d5f2"
            transparent
            opacity={0.25}
            roughness={0.1}
            metalness={0.1}
            side={DoubleSide}
          />
        </mesh>
      </group>

      {/* ── 5. Plano de Cielo Exterior Azul de Día ── */}
      <mesh position={[0, alto + 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[largo * 2, ancho * 2]} />
        <meshBasicMaterial color="#7ec8e3" side={DoubleSide} />
      </mesh>
    </group>
  )
}
