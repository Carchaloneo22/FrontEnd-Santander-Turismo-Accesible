import { useMemo, type ReactNode } from 'react'
import { DoubleSide } from 'three'
import { texturaNombre } from '../lib/texturaCache'
import { NOMBRE_RATIO } from '../lib/panelTexture'
import { BanderaColumna, ALTURA_BANDERA } from './BanderaColumna'
import { Televisor } from './Televisor'
import { CuadrosCulturales } from './CuadrosCulturales'
import { TechoReticular } from './TechoReticular'
import { claveDePantalla, type Pantalla } from '../lib/patrocinadores'
import type { CuadroCulturalModel } from '../models/CuadroCulturalModel'
import {
  murosCortos,
  ubicarPantallas,
  zDeMuro,
  rotYDeMuro,
  type Geometria,
  type Seccion,
} from '../lib/sala'

export interface RotuloSeccion {
  seccion: Seccion
  titulo: string
  lema: string
  libre: boolean
}

export interface CuadroCultural {
  id: string
  titulo: string
  url: string
}

interface PantallaUbicada {
  indice: number
  position: [number, number, number]
  rotY: number
}

const NOMBRE_ANCHO = 2.4
const NOMBRE_ALTO = NOMBRE_ANCHO * NOMBRE_RATIO

interface SalonProps {
  largo: number
  bahiasPorMuro: number
  rotulos: RotuloSeccion[]
  geometria: Geometria
  pantallas: Pantalla[]
  pantallaActiva?: number | null
  children?: ReactNode
  onSalir?: () => void
  /** Callback para propagar la selección de cuadros culturales */
  onSeleccionarObra?: (obra: CuadroCulturalModel, seccion: Seccion) => void
}

const CAL = '#E6E4DD'
const COLUMNA_COLOR = '#D6D0C5'
const COLUMNA_CAPITEL = '#473b2d'
const ZOCALO_OSCURO = '#444040'

const Z_ZOCALO = 0.02
const Z_NOMBRE = 0.05
const Z_BANDERA = 0.28

export function Salon({
  largo,
  bahiasPorMuro,
  rotulos,
  geometria,
  pantallas: pantallasConfig,
  pantallaActiva,
  children,
  onSeleccionarObra,
}: SalonProps) {
  const {
    ancho: ANCHO,
    anchoBahia: ANCHO_BAHIA,
    altoSala: ALTO_SALA,
    alturaObra: ALTURA_OBRA,
    tvAncho: TV_ANCHO,
  } = geometria
  const MEDIO_ANCHO = ANCHO / 2
  const medioLargo = largo / 2

  const columnas = useMemo(
    () => Array.from({ length: bahiasPorMuro + 1 }, (_, k) => -medioLargo + k * ANCHO_BAHIA),
    [bahiasPorMuro, medioLargo, ANCHO_BAHIA],
  )

  const divisores = useMemo(() => {
    const cuenta = new Map<string, { x: number; muro: 0 | 1; veces: number }>()
    for (const { seccion, libre } of rotulos) {
      if (libre) continue
      const bordes = [
        Math.min(...seccion.centrosBahia) - ANCHO_BAHIA / 2,
        Math.max(...seccion.centrosBahia) + ANCHO_BAHIA / 2,
      ]
      for (const x of bordes) {
        const clave = `${seccion.muro}:${x.toFixed(2)}`
        const y = cuenta.get(clave)
        if (y) y.veces += 1
        else cuenta.set(clave, { x, muro: seccion.muro, veces: 1 })
      }
    }

    return [...cuenta.values()].filter((d) => {
      const esDivisorCompartido = d.veces > 1
      const esColumnaEsquinaFondo = Math.abs(Math.abs(d.x) - medioLargo) < 0.1
      return esDivisorCompartido && !esColumnaEsquinaFondo
    })
  }, [rotulos, ANCHO_BAHIA, medioLargo])

  const pantallas = useMemo(
    () => ubicarPantallas(largo, pantallasConfig.length, geometria),
    [largo, pantallasConfig.length, geometria],
  )

  return (
    <group>
      {/* ── 1. Piso ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[largo, ANCHO]} />
        <meshStandardMaterial color="#B0AAA0" roughness={0.25} metalness={0.05} side={DoubleSide} />
      </mesh>

      {/* ── 2. Techo ── */}
      <TechoReticular
        largo={largo}
        ancho={ANCHO}
        alto={ALTO_SALA}
        filas={bahiasPorMuro}
        columnas={3}
        grosorViga={0.3}
        colorViga="#2b221b"
      />

      {/* ── 3. Muros Largos ── */}
      <mesh position={[0, ALTO_SALA / 2, -MEDIO_ANCHO]} receiveShadow>
        <planeGeometry args={[largo, ALTO_SALA]} />
        <meshStandardMaterial color={CAL} roughness={0.8} />
      </mesh>
      <mesh position={[0, ALTO_SALA / 2, MEDIO_ANCHO]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[largo, ALTO_SALA]} />
        <meshStandardMaterial color={CAL} roughness={0.8} />
      </mesh>

      {/* ── 4. Muros Cortos ── */}
      {murosCortos(largo).map(({ x, rotY }, index) => (
        <group key={index} position={[x, ALTO_SALA / 2, 0]} rotation={[0, rotY, 0]}>
          <mesh position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[ANCHO, ALTO_SALA]} />
            <meshStandardMaterial color={CAL} roughness={0.8} />
          </mesh>
          <mesh position={[0, -ALTO_SALA / 2 + 0.17, Z_ZOCALO]}>
            <planeGeometry args={[ANCHO, 0.34]} />
            <meshBasicMaterial color={ZOCALO_OSCURO} />
          </mesh>
        </group>
      ))}

      {/* ── 5. Cuadros Culturales ── */}
      <CuadrosCulturales
        largo={largo}
        geometria={geometria}
        rotulos={rotulos}
        onSeleccionarObra={onSeleccionarObra}
      />

      {/* ── 6. Zócalos ── */}
      <mesh position={[0, 0.17, -MEDIO_ANCHO + Z_ZOCALO]}>
        <planeGeometry args={[largo, 0.34]} />
        <meshBasicMaterial color={ZOCALO_OSCURO} />
      </mesh>
      <mesh position={[0, 0.17, MEDIO_ANCHO - Z_ZOCALO]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[largo, 0.34]} />
        <meshBasicMaterial color={ZOCALO_OSCURO} />
      </mesh>

      {/* ── 7. Columnas ── */}
      {columnas.map((x) => (
        <group key={`bahia-${x}`}>
          {[-MEDIO_ANCHO + 0.2, MEDIO_ANCHO - 0.2].map((z) => (
            <group key={z} position={[x, ALTO_SALA / 2, z]}>
              <mesh position={[0, -ALTO_SALA / 2 + 0.15, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.25, 0.3, 0.3, 16]} />
                <meshStandardMaterial color={COLUMNA_CAPITEL} roughness={0.5} />
              </mesh>
              <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.2, 0.2, ALTO_SALA - 0.6, 16]} />
                <meshStandardMaterial color={COLUMNA_COLOR} roughness={0.6} />
              </mesh>
              <mesh position={[0, ALTO_SALA / 2 - 0.15, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.3, 0.25, 0.3, 16]} />
                <meshStandardMaterial color={COLUMNA_CAPITEL} roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* ── 8. Rótulos ── */}
      {rotulos
        .filter((r) => !r.libre)
        .flatMap(({ seccion, titulo }) =>
          seccion.centrosBahia.map((x) => (
            <mesh
              key={`nom-${seccion.muro}-${x}`}
              position={[
                x,
                ALTURA_OBRA + 1.42,
                zDeMuro(seccion.muro, geometria) + (seccion.muro === 0 ? Z_NOMBRE : -Z_NOMBRE),
              ]}
              rotation={[0, rotYDeMuro(seccion.muro), 0]}
            >
              <planeGeometry args={[NOMBRE_ANCHO, NOMBRE_ALTO]} />
              <meshBasicMaterial map={texturaNombre(titulo)} transparent toneMapped={false} />
            </mesh>
          )),
        )}

      {/* ── 9. Banderas ── */}
      {divisores.map(({ x, muro }) => (
        <BanderaColumna
          key={`ban-${muro}-${x}`}
          position={[
            x,
            ALTURA_BANDERA,
            zDeMuro(muro, geometria) + (muro === 0 ? Z_BANDERA : -Z_BANDERA),
          ]}
          rotY={rotYDeMuro(muro)}
        />
      ))}

      {/* ── 10. Televisores ── */}
      {pantallas.map(({ indice, position, rotY }: PantallaUbicada) => (
        <Televisor
          key={`tv-${indice}`}
          clave={claveDePantalla(indice)}
          pantalla={pantallasConfig[indice]}
          position={position}
          rotY={rotY}
          ancho={TV_ANCHO}
          activo={pantallaActiva === indice}
        />
      ))}

      {/* ── 11. Hijos (Aquí entran los nodos de la vista principal sin duplicar) ── */}
      {children}
    </group>
  )
}
