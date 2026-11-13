import { useState } from 'react'
import { useLoader, type ThreeEvent } from '@react-three/fiber'
import { TextureLoader } from 'three'
import { texturaNombre } from '../lib/texturaCache'
import { NOMBRE_RATIO } from '../lib/panelTexture'
import { CuadroMarco } from './CuadroMarco'
import { zDeMuro, rotYDeMuro, type Geometria, type Seccion } from '../lib/sala'
import type { RotuloSeccion } from './Salon'
import { CUADROS_CULTURALES_REGISTRO } from '../data/cuadrosCulturales.data'
import type { CuadroCulturalModel } from '../models/CuadroCulturalModel'

const NOMBRE_ANCHO = 2.4
const NOMBRE_ALTO = NOMBRE_ANCHO * NOMBRE_RATIO
const Z_NOMBRE = 0.05
const Z_CUADRO = 0.05

const CUADRO_ANCHO = 1.4
const CUADRO_ALTO = 1.8

interface CuadrosCulturalesProps {
  largo: number
  geometria: Geometria
  rotulos: RotuloSeccion[]
  /**
   * Callback opcional disparado al hacer clic en una obra cultural.
   * Retorna la obra seleccionada y la sección de pared correspondiente.
   */
  onSeleccionarObra?: (obra: CuadroCulturalModel, seccion: Seccion) => void
}

/**
 * CuadrosCulturales — Renderizador 3D de Galerías Culturales Interactivas.
 *
 * Mapea las obras de arte en los muros de la sala basándose en la configuración
 * geométrica y los rótulos activos. Maneja la precarga de texturas PBR, estados
 * de selección y eventos de puntero/hover para interacción 3D.
 */
export function CuadrosCulturales({
  largo,
  geometria,
  rotulos,
  onSeleccionarObra,
}: CuadrosCulturalesProps) {
  const { anchoBahia: ANCHO_BAHIA, alturaObra: ALTURA_OBRA } = geometria
  const medioLargo = largo / 2
  const [hoverId, setHoverId] = useState<string | null>(null)

  // Carga reactiva de texturas mediante hook optimizado de R3F
  const texturas = useLoader(
    TextureLoader,
    CUADROS_CULTURALES_REGISTRO.map((c) => c.urlImagen),
  )

  // Vinculación de instancias de textura con los modelos del registro
  CUADROS_CULTURALES_REGISTRO.forEach((cuadro, index) => {
    cuadro.setTextura(texturas[index])
  })

  return (
    <group>
      {CUADROS_CULTURALES_REGISTRO.map((cuadro) => {
        // Búsqueda protegida de coincidencia entre rótulos y secciones
        const rotuloEncontrado = rotulos.find((r) =>
          r?.titulo?.toLowerCase()?.includes(cuadro?.seccionBusqueda?.toLowerCase() ?? ''),
        )

        const muro: 0 | 1 = rotuloEncontrado
          ? (rotuloEncontrado.seccion.muro as 0 | 1)
          : cuadro.muroDefault

        // Cálculo directo de la posición X (sin asignaciones inútiles para ESLint)
        const x = rotuloEncontrado
          ? (() => {
              const bahias = rotuloEncontrado.seccion.centrosBahia
              const base = cuadro.offsetBahia >= 0 ? Math.max(...bahias) : Math.min(...bahias)
              return base + ANCHO_BAHIA * cuadro.offsetBahia
            })()
          : -medioLargo + ANCHO_BAHIA * (cuadro.offsetBahia >= 0 ? 0.5 : 1.5)

        const esMuroCero = muro === 0
        const zPared = zDeMuro(muro, geometria) + (esMuroCero ? Z_CUADRO : -Z_CUADRO)
        const zRotulo = zDeMuro(muro, geometria) + (esMuroCero ? Z_NOMBRE : -Z_NOMBRE)

        // Asignación explícita de Seccion para posicionamiento del panel de detalles
        const seccionPadre: Seccion = rotuloEncontrado
          ? {
              ...rotuloEncontrado.seccion,
              muro,
              centrosBahia: [x],
            }
          : {
              ...(rotulos[0]?.seccion || ({} as Seccion)),
              muro,
              centrosBahia: [x],
            }

        // Manejador centralizado para detener la propagación del evento 3D
        const manejarSeleccion = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          if (onSeleccionarObra) {
            onSeleccionarObra(cuadro, seccionPadre)
          }
        }

        return (
          <group key={cuadro.id}>
            {/* Rótulo superior con el título de la obra */}
            <mesh position={[x, ALTURA_OBRA + 1.42, zRotulo]} rotation={[0, rotYDeMuro(muro), 0]}>
              <planeGeometry args={[NOMBRE_ANCHO, NOMBRE_ALTO]} />
              <meshBasicMaterial
                map={texturaNombre(cuadro.titulo)}
                transparent
                toneMapped={false}
              />
            </mesh>

            {/* Cuadro principal e interactividad de la obra */}
            <group
              position={[x, ALTURA_OBRA + 0.1, zPared]}
              rotation={[0, rotYDeMuro(muro), 0]}
              scale={hoverId === cuadro.id ? 1.05 : 1}
              onClick={manejarSeleccion}
            >
              {cuadro.textura && <CuadroMarco textura={cuadro.textura} />}

              {/* Hitbox frontal invisible para asegurar la zona de clic y cursor */}
              <mesh
                position={[0, 0, 0.1]}
                onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                  e.stopPropagation()
                  setHoverId(cuadro.id)
                  document.body.style.cursor = 'pointer'
                }}
                onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                  e.stopPropagation()
                  setHoverId(null)
                  document.body.style.cursor = 'auto'
                }}
                onClick={manejarSeleccion}
              >
                <planeGeometry args={[CUADRO_ANCHO, CUADRO_ALTO]} />
                <meshBasicMaterial visible={false} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}
