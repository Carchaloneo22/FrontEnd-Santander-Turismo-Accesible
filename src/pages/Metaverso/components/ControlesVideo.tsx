import { useMemo, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { CanvasTexture } from 'three'
import { buildBotonTexture, BOTON_RATIO } from '../lib/panelTexture'

interface ControlesVideoProps {
  pausado: boolean
  volumen: number
  enZoom: boolean
  onPausar: () => void
  onVolumen: (v: number) => void
  onToggleZoom: () => void
}

const BTN = 0.38
const BTN_ALTO = BTN * BOTON_RATIO
const HUECO = 0.03
const PASO = 0.2

/**
 * ControlesVideo — Panel de mandos 3D interactivo con 4 acciones:
 * 1. Pausa / Reanudar
 * 2. Bajar Volumen
 * 3. Subir Volumen / Indicador
 * 4. Zoom / Enfoque de Pantalla
 */
export function ControlesVideo({
  pausado,
  volumen,
  enZoom,
  onPausar,
  onVolumen,
  onToggleZoom,
}: ControlesVideoProps) {
  const nivel = Math.round(volumen * 100)

  const texturas = useMemo(
    () => ({
      pausa: buildBotonTexture(pausado ? '▶ Reanudar' : '❚❚ Pausar', '#4b3a2a'),
      menos: buildBotonTexture('🔉 -', '#4b3a2a'),
      mas: buildBotonTexture('🔊 +', '#4b3a2a'),
      zoom: buildBotonTexture(enZoom ? '🔍 Normal' : '🔍 Zoom', '#3a4b2a'),
      nivel: buildBotonTexture(nivel === 0 ? 'Mute' : `${nivel}%`, '#26201a'),
    }),
    [pausado, nivel, enZoom],
  )

  // 5 slots de botones en fila horizontal centrada
  const paso = BTN + HUECO
  const x = (i: number) => (i - 2) * paso

  return (
    <group>
      {/* Botón 1: Pausa / Play */}
      <Boton textura={texturas.pausa} position={[x(0), 0, 0]} onClick={onPausar} />

      {/* Botón 2: Bajar Volumen */}
      <Boton
        textura={texturas.menos}
        position={[x(1), 0, 0]}
        onClick={() => onVolumen(Math.max(0, volumen - PASO))}
      />

      {/* Display Central: Indicador de Nivel */}
      <mesh position={[x(2), 0, 0]}>
        <planeGeometry args={[BTN, BTN_ALTO]} />
        <meshBasicMaterial map={texturas.nivel} transparent toneMapped={false} />
      </mesh>

      {/* Botón 3: Subir Volumen */}
      <Boton
        textura={texturas.mas}
        position={[x(3), 0, 0]}
        onClick={() => onVolumen(Math.min(1, volumen + PASO))}
      />

      {/* Botón 4: Zoom / Pantalla Completa VR */}
      <Boton textura={texturas.zoom} position={[x(4), 0, 0]} onClick={onToggleZoom} />
    </group>
  )
}

interface BotonProps {
  textura: CanvasTexture
  position: [number, number, number]
  onClick: () => void
}

function Boton({ textura, position, onClick }: BotonProps) {
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
      <planeGeometry args={[BTN, BTN_ALTO]} />
      <meshBasicMaterial map={textura} transparent toneMapped={false} />
    </mesh>
  )
}
