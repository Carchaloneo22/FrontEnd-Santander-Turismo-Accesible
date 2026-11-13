import { useEffect, useMemo, useRef, useState } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { DoubleSide, Euler, Vector3, type CanvasTexture, type Group } from 'three'
import { CATEGORIAS, type SitioConDestino, type SitioTuristico } from '../../../features/destinos'
import { buildTileMap, boundsFor, type TileMapData } from '../lib/tileMap'
import { buildEtiquetaTexture } from '../lib/panelTexture'

interface MapaAtrilProps {
  sitios: SitioConDestino[]
  visible: boolean
  /** Sitio donde está el usuario actualmente (se resalta en el mapa). */
  sitioActualId: string
  onSelect: (sitio: SitioTuristico) => void
  /** Narra un texto (solo al viajar, no al pasar el puntero). */
  onNarrar: (texto: string) => void
}

// Configuración espacial del Atril 3D (Recomendación de accesibilidad VR de Meta)
const ANCHO = 1.0
const DISTANCIA = 1.1
const ALTURA = 1.0
const INCLINACION = -1.0 // Ángulo de inclinación tipo mesa de control

/**
 * MapaAtril — Vista flotante anclada al espacio 3D para navegación de destinos.
 *
 * Se posiciona dinámicamente frente al usuario al activarse y permite la interacción
 * directa con los sitios turísticos disponibles en el departamento.
 */
export function MapaAtril({ sitios, visible, sitioActualId, onSelect }: MapaAtrilProps) {
  const [mapa, setMapa] = useState<TileMapData | null>(null)
  const grupoRef = useRef<Group>(null)
  const colocado = useRef(false)
  const { camera } = useThree()

  const bounds = useMemo(() => boundsFor(sitios.map(({ sitio }) => sitio.coordenada)), [sitios])

  useEffect(() => {
    let activo = true
    let data: TileMapData | null = null
    buildTileMap(bounds).then((d) => {
      if (!activo) {
        d.texture.dispose()
        return
      }
      data = d
      setMapa(d)
    })
    return () => {
      activo = false
      data?.texture.dispose()
    }
  }, [bounds])

  // Anclaje único en el espacio tridimensional al abrir la vista
  useEffect(() => {
    if (!visible) {
      colocado.current = false
      return
    }
    const g = grupoRef.current
    if (!g || colocado.current) return
    const dir = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    dir.y = 0
    dir.normalize()
    g.position.copy(camera.position).addScaledVector(dir, DISTANCIA)
    g.position.y = ALTURA
    g.rotation.copy(new Euler(INCLINACION, Math.atan2(-dir.x, -dir.z), 0, 'YXZ'))
    colocado.current = true
  }, [visible, camera, mapa])

  const alto = ANCHO * (mapa?.aspect ?? 1)

  const pines = useMemo(() => {
    if (!mapa) return []
    return sitios.map((item) => {
      const { u, v } = mapa.toUV(item.sitio.coordenada.lat, item.sitio.coordenada.lng)
      return {
        item,
        position: [(u - 0.5) * ANCHO, (0.5 - v) * alto, 0.014] as [number, number, number],
      }
    })
  }, [mapa, sitios, alto])

  if (!visible || !mapa) return null

  return (
    <group ref={grupoRef}>
      {/* Fondo de contraste del tablero */}
      <mesh position={[0, 0, -0.006]}>
        <planeGeometry args={[ANCHO + 0.05, alto + 0.05]} />
        <meshBasicMaterial color="#0e1524" side={DoubleSide} />
      </mesh>

      {/* Mapa base */}
      <mesh>
        <planeGeometry args={[ANCHO, alto]} />
        <meshBasicMaterial map={mapa.texture} side={DoubleSide} toneMapped={false} />
      </mesh>

      {/* Marcadores de destinos */}
      {pines.map(({ item, position }) => (
        <PinMapa
          key={item.sitio.id}
          item={item}
          position={position}
          actual={item.sitio.id === sitioActualId}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}

interface PinMapaProps {
  item: SitioConDestino
  position: [number, number, number]
  actual: boolean
  onSelect: (sitio: SitioTuristico) => void
}

/**
 * PinMapa — Marcador interactivo para la selección de destinos dentro del mapa.
 */
function PinMapa({ item, position, actual, onSelect }: PinMapaProps) {
  const [hover, setHover] = useState(false)
  const [etiqueta, setEtiqueta] = useState<CanvasTexture | null>(null)
  const color = CATEGORIAS[item.sitio.categoria].color

  useEffect(() => () => etiqueta?.dispose(), [etiqueta])

  return (
    <group position={position}>
      <mesh
        scale={hover ? 2 : actual ? 1.5 : 1}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setHover(true)
          if (!etiqueta) {
            setEtiqueta(
              buildEtiquetaTexture(item.sitio.nombre, actual ? 'Estás aquí' : item.destino.nombre),
            )
          }
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onSelect(item.sitio)
        }}
      >
        <sphereGeometry args={[0.016, 14, 10]} />
        <meshBasicMaterial color={hover || actual ? '#ffffff' : color} />
      </mesh>

      {hover && etiqueta && (
        <Billboard position={[0, 0.09, 0.02]}>
          <mesh>
            <planeGeometry args={[0.34, 0.085]} />
            <meshBasicMaterial map={etiqueta} transparent toneMapped={false} depthTest={false} />
          </mesh>
        </Billboard>
      )}
    </group>
  )
}
