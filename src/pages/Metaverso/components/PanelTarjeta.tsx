import { useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { FOTO_RATIO, CARTELA_RATIO, type PanelInfo } from '../lib/panelTexture'
import { texturaFoto, texturaCartela } from '../lib/texturaCache'

interface PanelTarjetaProps {
  info: PanelInfo
  position: [number, number, number]
  /** Rotación Y para que la pieza mire hacia dentro de la casa. */
  rotY: number
  onSelect: () => void
}

export const FOTO_ANCHO = 0.82
export const FOTO_ALTO = FOTO_ANCHO * FOTO_RATIO
const MARCO = 0.05 // grosor del marco
const FONDO_MARCO = 0.06 // profundidad: le da volumen de cuadro colgado

const CARTELA_ANCHO = 0.56
const CARTELA_ALTO = CARTELA_ANCHO * CARTELA_RATIO
const HUECO = 0.07 // aire entre el marco y la cartela

/** Alto total de la pieza (marco + hueco + cartela): lo usa el reparto del muro. */
export const PIEZA_ALTO = FOTO_ALTO + MARCO * 2 + HUECO + CARTELA_ALTO
export const PIEZA_ANCHO = FOTO_ANCHO + MARCO * 2

/**
 * PanelTarjeta — una pieza colgada: fotografía enmarcada en madera y, debajo,
 * su cartela de bronce grabada con el nombre. El marco tiene volumen real (una
 * caja, no un plano), así que se lee como un cuadro colgado y no como una
 * calcomanía sobre la pared.
 *
 * Solo la CARTELA es clickeable —como tocar la placa de un museo—, con margen
 * generoso: el blanco dibujado mide pocos grados desde el punto de vista.
 *
 * Las texturas vienen del caché precalentado en la pantalla de carga, así que la
 * pieza se pinta en su PRIMER render: nada aparece "de golpe" al entrar.
 */
export function PanelTarjeta({ info, position, rotY, onSelect }: PanelTarjetaProps) {
  const [hover, setHover] = useState(false)
  const foto = texturaFoto(info.imagen)
  const cartela = texturaCartela(info.nombre, info.color)

  if (!foto || !cartela) return null

  const yFoto = PIEZA_ALTO / 2 - (FOTO_ALTO / 2 + MARCO)
  const yCartela = -PIEZA_ALTO / 2 + CARTELA_ALTO / 2

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Marco de madera con volumen: la pieza se ve colgada. */}
      <mesh position={[0, yFoto, -FONDO_MARCO / 2]}>
        <boxGeometry args={[PIEZA_ANCHO, FOTO_ALTO + MARCO * 2, FONDO_MARCO]} />
        <meshBasicMaterial color={hover ? info.color : '#4a3220'} />
      </mesh>
      <mesh position={[0, yFoto, 0.002]}>
        <planeGeometry args={[FOTO_ANCHO, FOTO_ALTO]} />
        <meshBasicMaterial map={foto} toneMapped={false} />
      </mesh>

      {/* Cartela de bronce: el nombre y el ÚNICO objetivo clickeable. */}
      <mesh
        position={[0, yCartela, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        {/* Blanco generoso: la caja es más alta que la cartela dibujada. */}
        <boxGeometry args={[CARTELA_ANCHO, CARTELA_ALTO * 1.4, 0.02]} />
        <meshBasicMaterial map={cartela} toneMapped={false} />
      </mesh>
    </group>
  )
}
