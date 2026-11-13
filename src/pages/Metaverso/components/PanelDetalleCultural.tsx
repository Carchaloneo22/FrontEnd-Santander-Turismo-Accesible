import { useEffect, useMemo, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { CanvasTexture, type Texture } from 'three'
import {
  buildBotonTexture,
  buildTableroTexture,
  mascaraRedonda,
  INFO_RATIO,
  BOTON_RATIO,
  MARGEN_TABLERO,
} from '../lib/panelTexture'
import type { CuadroCulturalModel } from '../models/CuadroCulturalModel'

interface PanelDetalleCulturalProps {
  obra: CuadroCulturalModel
  position: [number, number, number]
  rotY: number
  onViajar?: () => void
  onCerrar: () => void
}

const MARCO = 0.06
const HUECO = 0.08

const FOTO_ANCHO = 1.5
// ── ALTU̇RA EXACTA: Se ve completa y no se sale por arriba ni por abajo ──
const FOTO_ALTO = 1.38

const INFO_ANCHO = 1.25
const INFO_ALTO = INFO_ANCHO * INFO_RATIO

const BTN_ANCHO = 0.55
const BTN_ALTO = BTN_ANCHO * BOTON_RATIO

const CUERPO_ANCHO = FOTO_ANCHO + HUECO + INFO_ANCHO + MARCO * 2
// ── FIX: Calculamos la altura dinámica para mantener la proporción de la paleta beige ──
const CUERPO_ALTO = Math.max(FOTO_ALTO, INFO_ALTO + BTN_ALTO + 0.1) + MARCO * 2

const TABLERO_ANCHO = CUERPO_ANCHO * (1 + MARGEN_TABLERO)
const TABLERO_ALTO = CUERPO_ALTO + CUERPO_ANCHO * MARGEN_TABLERO

const Z_FONDO = 0
const Z_PIEZA = 0.02
const Z_FOTO = 0.04

const X_FOTO = -CUERPO_ANCHO / 2 + MARCO + FOTO_ANCHO / 2
const X_INFO = CUERPO_ANCHO / 2 - MARCO - INFO_ANCHO / 2
const ARRIBA = CUERPO_ALTO / 2 - MARCO

// Posicionamiento preciso centrado dentro del área beige
const Y_FOTO = ARRIBA - FOTO_ALTO / 2
const Y_INFO = ARRIBA - INFO_ALTO / 2
const Y_BOTONES = Y_INFO - INFO_ALTO / 2 - 0.08 - BTN_ALTO / 2

function buildInfoCulturalTexture(
  titulo: string,
  subtitulo: string,
  descripcion: string,
): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = Math.round(1024 * INFO_RATIO)
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#7c3aed'
  ctx.font = 'bold 32px sans-serif'
  ctx.fillText(subtitulo.toUpperCase(), 40, 60)

  ctx.fillStyle = '#1f2937'
  ctx.font = 'bold 44px serif'
  ctx.fillText(titulo, 40, 125)

  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(40, 155)
  ctx.lineTo(canvas.width - 40, 155)
  ctx.stroke()

  ctx.fillStyle = '#1f2937'
  ctx.font = '500 38px sans-serif'
  const lineHeight = 54
  let y = 225

  const palabras = descripcion.split(' ')
  let linea = ''

  for (const p of palabras) {
    const test = linea + p + ' '
    if (ctx.measureText(test).width > canvas.width - 80) {
      ctx.fillText(linea.trim(), 40, y)
      linea = p + ' '
      y += lineHeight
    } else {
      linea = test
    }
  }
  if (linea) {
    ctx.fillText(linea.trim(), 40, y)
  }

  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function PanelDetalleCultural({
  obra,
  position,
  rotY,
  onCerrar,
}: PanelDetalleCulturalProps) {
  const mascaraFoto = mascaraRedonda(FOTO_ALTO / FOTO_ANCHO)

  const columna = useMemo(
    () => buildInfoCulturalTexture(obra.titulo, obra.subtitulo, obra.descripcion),
    [obra],
  )
  const btnVolver = useMemo(() => buildBotonTexture('✕  Volver', '#4b3a2a'), [])
  const tablero = useMemo(() => buildTableroTexture(TABLERO_ALTO / TABLERO_ANCHO), [])

  useEffect(() => () => tablero.dispose(), [tablero])
  useEffect(() => () => columna.dispose(), [columna])
  useEffect(() => () => btnVolver.dispose(), [btnVolver])

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Fondo de madera */}
      <mesh position={[0, 0, Z_FONDO]}>
        <planeGeometry args={[TABLERO_ANCHO, TABLERO_ALTO]} />
        <meshBasicMaterial map={tablero} transparent toneMapped={false} />
      </mesh>

      {/* Imagen ajustada de forma simétrica sin salirse del marco beige */}
      <mesh position={[X_FOTO, Y_FOTO, Z_PIEZA]}>
        <planeGeometry args={[FOTO_ANCHO + 0.03, FOTO_ALTO + 0.03]} />
        <meshBasicMaterial color="#4a3220" transparent alphaMap={mascaraFoto} />
      </mesh>

      {obra.textura && (
        <mesh position={[X_FOTO, Y_FOTO, Z_FOTO]}>
          <planeGeometry args={[FOTO_ANCHO, FOTO_ALTO]} />
          <meshBasicMaterial
            map={obra.textura}
            transparent
            alphaMap={mascaraFoto}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Tarjeta blanca */}
      <mesh position={[X_INFO, Y_INFO, Z_PIEZA]}>
        <planeGeometry args={[INFO_ANCHO, INFO_ALTO]} />
        <meshBasicMaterial map={columna} transparent toneMapped={false} />
      </mesh>

      {/* Botón Volver */}
      <Boton textura={btnVolver} position={[X_INFO, Y_BOTONES, Z_FOTO]} onClick={onCerrar} />
    </group>
  )
}

function Boton({
  textura,
  position,
  onClick,
}: {
  textura: Texture
  position: [number, number, number]
  onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <mesh
      position={position}
      scale={hover ? 1.08 : 1}
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
        onClick()
      }}
    >
      <planeGeometry args={[BTN_ANCHO, BTN_ALTO]} />
      <meshBasicMaterial map={textura} transparent toneMapped={false} />
    </mesh>
  )
}
