import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { SRGBColorSpace, TextureLoader, type Mesh, type Texture } from 'three'
import { CATEGORIAS, type SitioTuristico } from '../../../features/destinos'
import type { SitioCercano } from '../lib/geo'
import { rumboAPosicion, ALTURA_OJOS } from '../lib/geo'
import { buildEtiquetaTexture } from '../lib/panelTexture'
import { distancia, distanciaHablada } from '../../../lib/formato'
import { useReducedMotion } from '../../../hooks/useReducedMotion'

interface OrbeDestinoProps {
  destino: SitioCercano
  onSelect: (sitio: SitioTuristico) => void
  /** Se llama al apuntar el orbe: dice su nombre y a qué distancia está. */
  onApuntar: (etiqueta: string) => void
}

const RADIO_ESCENA = 4
const RADIO_ORBE = 0.45

/**
 * OrbeDestino — esfera flotante texturizada con la PANORÁMICA REAL del sitio al
 * que lleva: el usuario ve a dónde va antes de viajar, sin leer mapas ni iconos
 * abstractos. Es el patrón más amigable para primerizos.
 *
 * Se coloca en el RUMBO geográfico real del destino, así que apunta hacia donde
 * de verdad está el lugar. Al seleccionarlo se viaja: teletransporte, el modo
 * cómodo y sin mareo.
 *
 * Lleva la misma información por DOS vías: una etiqueta visible con nombre y
 * distancia, y la locución al apuntarlo. No es redundancia — es la regla de
 * accesibilidad: quien no ve la etiqueta la oye, y quien no oye la lee.
 *
 * La locución pasa por `narrateHotspot`, que NO repite mientras se apunta al
 * mismo orbe. Esa deduplicación es lo que la hace soportable: sin ella, cada
 * temblor del ratón sobre el orbe la relanzaba, que fue justo el motivo por el
 * que en su día se quitó de las tarjetas del lobby.
 */
export function OrbeDestino({ destino, onSelect, onApuntar }: OrbeDestinoProps) {
  const [textura, setTextura] = useState<Texture | null>(null)
  const [hover, setHover] = useState(false)
  const orbeRef = useRef<Mesh>(null)
  const reduce = useReducedMotion()
  const color = CATEGORIAS[destino.sitio.categoria].color

  const position = rumboAPosicion(destino.rumboRad, RADIO_ESCENA, ALTURA_OJOS)

  const etiqueta = useMemo(
    () => buildEtiquetaTexture(destino.sitio.nombre, `a ${distancia(destino.distanciaKm)}`),
    [destino.sitio.nombre, destino.distanciaKm],
  )
  useEffect(() => () => etiqueta.dispose(), [etiqueta])

  const hablado = useMemo(
    () => `${destino.sitio.nombre}, a ${distanciaHablada(destino.distanciaKm)}`,
    [destino.sitio.nombre, destino.distanciaKm],
  )

  // Carga dinámica de la panorámica 360°
  useEffect(() => {
    let activo = true
    let tex: Texture | null = null
    new TextureLoader().load(
      destino.sitio.panorama360,
      (t) => {
        if (!activo) {
          t.dispose()
          return
        }
        t.colorSpace = SRGBColorSpace
        tex = t
        setTextura(t)
      },
      undefined,
      () => {}, // Callback de error: mantiene el color por defecto de la categoría
    )
    return () => {
      activo = false
      tex?.dispose()
    }
  }, [destino.sitio.panorama360])

  // Rotación suave si el usuario no tiene activada la reducción de movimiento
  useFrame((_, dt) => {
    if (!orbeRef.current || reduce) return
    orbeRef.current.rotation.y += dt * 0.25
  })

  return (
    <group position={position}>
      {/* Aro de color según la categoría */}
      <mesh scale={hover ? 1.15 : 1}>
        <torusGeometry args={[RADIO_ORBE + 0.05, 0.018, 8, 40]} />
        <meshBasicMaterial color={hover ? '#ffffff' : color} />
      </mesh>

      <mesh
        ref={orbeRef}
        scale={hover ? 1.15 : 1}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setHover(true)
          onApuntar(hablado)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onSelect(destino.sitio)
        }}
      >
        <sphereGeometry args={[RADIO_ORBE, 32, 24]} />
        <meshBasicMaterial map={textura} color={textura ? '#ffffff' : color} toneMapped={false} />
      </mesh>

      {/* Etiqueta siempre orientada al usuario */}
      <Billboard position={[0, RADIO_ORBE + 0.28, 0]}>
        <mesh>
          <planeGeometry args={[1.1, 0.275]} />
          <meshBasicMaterial map={etiqueta} transparent toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  )
}
