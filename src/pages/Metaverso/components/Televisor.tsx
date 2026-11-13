import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { PANTALLA_RATIO } from '../lib/panelTexture'
import {
  alTenerImagen,
  pausarVideo,
  reproducirVideo,
  sonarVideo,
  texturaPantalla,
  texturaVideo,
} from '../lib/texturaCache'
import { ControlesVideo } from './ControlesVideo'
import type { Pantalla } from '../lib/patrocinadores'

interface TelevisorProps {
  pantalla: Pantalla
  clave: string
  position: [number, number, number]
  rotY: number
  activo: boolean
  ancho?: number
}

const MARCO = 0.06
const FONDO = 0.09
const MIRAR_ENTRA = 0.64
const MIRAR_SALE = 0.55

export function Televisor({
  pantalla,
  clave,
  position,
  rotY,
  activo,
  ancho = 2.1,
}: TelevisorProps) {
  const [enZoom, setEnZoom] = useState(false)
  const anchoEfectivo = enZoom ? ancho * 1.45 : ancho
  const alto = anchoEfectivo * PANTALLA_RATIO

  const cartel = texturaPantalla(pantalla.titulo, pantalla.subtitulo)
  const src = pantalla.videoSrc
  const video = src ? texturaVideo(clave, src) : null
  const [conImagen, setConImagen] = useState(false)
  const [pausado, setPausado] = useState(false)
  const [volumen, setVolumen] = useState(1)
  const [mirando, setMirando] = useState(false)

  // Color de marco personalizable o valor por defecto
  // En Televisor.tsx:
  const colorMarco = pantalla.colorMarco ?? '#26201a'

  useEffect(() => (src ? reproducirVideo(clave) : undefined), [clave, src])

  useEffect(() => {
    if (src) sonarVideo(clave, activo && !pausado, volumen)
  }, [clave, src, activo, pausado, volumen])

  useEffect(() => {
    if (src) pausarVideo(clave, pausado)
  }, [clave, src, pausado])

  useEffect(() => {
    if (!src) return
    let vivo = true
    const quitar = alTenerImagen(clave, () =>
      queueMicrotask(() => {
        if (vivo) setConImagen(true)
      }),
    )
    return () => {
      vivo = false
      quitar()
    }
  }, [clave, src])

  const dir = useRef(new Vector3())
  const haciaTv = useRef(new Vector3())
  const posTv = useRef(new Vector3(...position))

  useFrame((state) => {
    if (!activo || !src) return
    state.camera.getWorldDirection(dir.current)
    haciaTv.current.copy(posTv.current).sub(state.camera.position).normalize()
    const cos = dir.current.dot(haciaTv.current)
    const deFrente = mirando ? cos > MIRAR_SALE : cos > MIRAR_ENTRA
    if (deFrente !== mirando) setMirando(deFrente)
  })

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Marco parametricamente coloreado */}
      <mesh position={[0, 0, -FONDO / 2 - 0.005]}>
        <boxGeometry args={[anchoEfectivo + MARCO * 2, alto + MARCO * 2, FONDO]} />
        <meshBasicMaterial color={colorMarco} />
      </mesh>

      {/* Pantalla con textura del Video o Cartel informativo */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[anchoEfectivo, alto]} />
        <meshBasicMaterial map={conImagen && video ? video : cartel} toneMapped={false} />
      </mesh>

      {/* Panel 3D de Controles Interactivos (Pausa, Vol-, Vol+, Zoom) */}
      {activo && mirando && src && (
        <group position={[0, -alto / 2 - 0.16, 0.02]}>
          <ControlesVideo
            pausado={pausado}
            volumen={volumen}
            enZoom={enZoom}
            onPausar={() => setPausado((p) => !p)}
            onVolumen={setVolumen}
            onToggleZoom={() => setEnZoom((z) => !z)}
          />
        </group>
      )}
    </group>
  )
}
