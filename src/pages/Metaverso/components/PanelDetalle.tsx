import { useEffect, useMemo, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { CanvasTexture, Texture } from 'three'
import {
  CATEGORIAS,
  operadoresDe,
  type OperadorTuristico,
  type SitioConDestino,
  type SitioTuristico,
} from '../../../features/destinos'
import {
  buildInfoTexture,
  buildOperadorTexture,
  buildLogoTexture,
  buildBotonTexture,
  buildTableroTexture,
  mascaraRedonda,
  FOTO_RATIO,
  INFO_RATIO,
  BOTON_RATIO,
  MARGEN_TABLERO,
} from '../lib/panelTexture'
import { texturaFoto } from '../lib/texturaCache'

interface PanelDetalleProps {
  item: SitioConDestino
  /** Dónde se planta: frente a la bahía de SU municipio (lo decide el Pabellón). */
  position: [number, number, number]
  rotY: number
  /**
   * Cuántas plazas comerciales ofrecer si el sitio no tiene operadores
   * (METAVERSO_SALAS.PLAZAS_OPERADOR). Cuántos huecos se enseñan lo decide la
   * Gobernación, no el código.
   */
  plazasOperador: number
  onViajar: (sitio: SitioTuristico) => void
  onCerrar: () => void
}

// ── Reparto: foto y miniaturas a la izquierda; información, logos y botones a
// la derecha. 3.05 m de ancho vistos a 2 m → 74°: llena la vista sin obligar a
// barrer la cabeza para leer.
const MARCO = 0.06
const HUECO = 0.08

const FOTO_ANCHO = 1.7
const FOTO_ALTO = FOTO_ANCHO * FOTO_RATIO
const MINI_ANCHO = 0.5
const MINI_ALTO = MINI_ANCHO * FOTO_RATIO
const MINI_HUECO = 0.06

const INFO_ANCHO = 1.15
const INFO_ALTO = INFO_ANCHO * INFO_RATIO
const LOGO = 0.3
const LOGO_HUECO = 0.05
const BTN_ANCHO = 0.55
const BTN_ALTO = BTN_ANCHO * BOTON_RATIO

const COLUMNA_ALTO = FOTO_ALTO + MINI_HUECO + MINI_ALTO
const CUERPO_ANCHO = FOTO_ANCHO + HUECO + INFO_ANCHO + MARCO * 2
const CUERPO_ALTO = Math.max(COLUMNA_ALTO, INFO_ALTO + LOGO + BTN_ALTO + 0.16) + MARCO * 2
// El tablero se pinta mayor que el cuerpo: en ese margen cabe su sombra.
const TABLERO_ANCHO = CUERPO_ANCHO * (1 + MARGEN_TABLERO)
const TABLERO_ALTO = CUERPO_ALTO + CUERPO_ANCHO * MARGEN_TABLERO

// Separaciones reales: dos planos a menos de 1 cm producen z-fighting.
const Z_FONDO = 0
const Z_PIEZA = 0.02
const Z_FOTO = 0.04

const X_FOTO = -CUERPO_ANCHO / 2 + MARCO + FOTO_ANCHO / 2
const X_INFO = CUERPO_ANCHO / 2 - MARCO - INFO_ANCHO / 2
const ARRIBA = CUERPO_ALTO / 2 - MARCO

const Y_FOTO = ARRIBA - FOTO_ALTO / 2
const Y_MINIS = Y_FOTO - FOTO_ALTO / 2 - MINI_HUECO - MINI_ALTO / 2
const Y_INFO = ARRIBA - INFO_ALTO / 2
const Y_LOGOS = Y_INFO - INFO_ALTO / 2 - 0.05 - LOGO / 2
// Los botones van DENTRO del panel: colgados por fuera quedaban a 0.8 m del
// suelo y había que mirar al piso para pulsarlos.
const Y_BOTONES = Y_LOGOS - LOGO / 2 - 0.05 - BTN_ALTO / 2

/**
 * PanelDetalle — vista de CONTEMPLACIÓN: al tocar la cartela de un cuadro, el
 * lugar se abre en grande, se narra su historia y solo entonces se puede viajar.
 *
 * Se planta frente al MURO de su municipio (posición que calcula el Pabellón),
 * no delante de la cara del visitante: anclado a la mirada aparecía atravesado
 * sobre el piso, sin relación con la pared donde cuelga la obra.
 *
 * Los operadores turísticos se abren desde su logo: la columna de la derecha
 * cambia de la historia del lugar a la del operador y vuelve al tocarlo otra vez.
 *
 * Todas sus imágenes salen del caché precalentado en la pantalla de carga, así
 * que el panel se pinta entero en su PRIMER frame: nada de ver un hueco mientras
 * la voz ya está contando la historia.
 */
export function PanelDetalle({
  item,
  position,
  rotY,
  plazasOperador,
  onViajar,
  onCerrar,
}: PanelDetalleProps) {
  const cat = CATEGORIAS[item.sitio.categoria]
  const galeria = item.sitio.imagenes?.length ? item.sitio.imagenes : [item.sitio.imagen]
  const [principal, setPrincipal] = useState(0)
  const [abierto, setAbierto] = useState<string | null>(null)

  const operadores = useMemo(
    () => operadoresDe(item.sitio, plazasOperador),
    [item.sitio, plazasOperador],
  )
  const operador = operadores.find((o) => o.id === abierto) ?? null
  const foto = texturaFoto(galeria[Math.min(principal, galeria.length - 1)])
  // Dos máscaras compartidas por toda la ficha: las fotos son 3:2 y los logos, 1:1.
  const mascaraFoto = mascaraRedonda(FOTO_RATIO)
  const mascaraLogo = mascaraRedonda(1)

  // La columna derecha: el lugar, o el operador que se haya abierto.
  const columna = useMemo(
    () =>
      operador
        ? buildOperadorTexture(operador)
        : buildInfoTexture({
            nombre: item.sitio.nombre,
            // El municipio REAL del lugar; si el metaverso agrupa por modalidad,
            // `destino.nombre` sería la modalidad, no la ciudad.
            municipio: item.sitio.municipio ?? item.destino.nombre,
            categoria: cat.label,
            color: cat.color,
            descripcion: item.sitio.descripcion,
          }),
    [operador, item, cat.label, cat.color],
  )
  const btnViajar = useMemo(() => buildBotonTexture('Viajar  ▶', '#7c3aed'), [])
  const btnVolver = useMemo(() => buildBotonTexture('✕  Volver', '#4b3a2a'), [])
  const tablero = useMemo(() => buildTableroTexture(TABLERO_ALTO / TABLERO_ANCHO), [])

  useEffect(() => () => tablero.dispose(), [tablero])
  useEffect(() => () => columna.dispose(), [columna])
  useEffect(
    () => () => {
      btnViajar.dispose()
      btnVolver.dispose()
    },
    [btnViajar, btnVolver],
  )

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Tablero: esquinas redondeadas y sombra propia, dibujadas en su textura.
          Va algo más grande que el cuerpo útil para que la sombra quepa. */}
      <mesh position={[0, 0, Z_FONDO]}>
        <planeGeometry args={[TABLERO_ANCHO, TABLERO_ALTO]} />
        <meshBasicMaterial map={tablero} transparent toneMapped={false} />
      </mesh>

      {/* ── La fotografía, grande. La máscara le redondea las esquinas sin tocar
             su textura, que la comparte con el cuadro del muro. ── */}
      <mesh position={[X_FOTO, Y_FOTO, Z_PIEZA]}>
        <planeGeometry args={[FOTO_ANCHO + 0.03, FOTO_ALTO + 0.03]} />
        <meshBasicMaterial color="#4a3220" transparent alphaMap={mascaraFoto} />
      </mesh>
      {foto && (
        <mesh position={[X_FOTO, Y_FOTO, Z_FOTO]}>
          <planeGeometry args={[FOTO_ANCHO, FOTO_ALTO]} />
          <meshBasicMaterial map={foto} transparent alphaMap={mascaraFoto} toneMapped={false} />
        </mesh>
      )}

      {/* ── Las demás imágenes, en fila bajo la foto ── */}
      {galeria.length > 1 &&
        galeria.map((url, i) => (
          <Placa
            key={url}
            textura={texturaFoto(url)}
            mascara={mascaraFoto}
            ancho={MINI_ANCHO}
            alto={MINI_ALTO}
            activa={i === principal}
            position={[
              X_FOTO + (i - (galeria.length - 1) / 2) * (MINI_ANCHO + MINI_HUECO),
              Y_MINIS,
              Z_PIEZA,
            ]}
            onClick={() => setPrincipal(i)}
          />
        ))}

      {/* ── Historia del lugar, o la del operador abierto ── */}
      <mesh position={[X_INFO, Y_INFO, Z_PIEZA]}>
        <planeGeometry args={[INFO_ANCHO, INFO_ALTO]} />
        <meshBasicMaterial map={columna} transparent toneMapped={false} />
      </mesh>

      {/* ── Logos de los operadores: cada uno abre sus datos ── */}
      {operadores.map((op, i) => (
        <LogoOperador
          key={op.id}
          operador={op}
          mascara={mascaraLogo}
          activo={op.id === abierto}
          position={[
            X_INFO + (i - (operadores.length - 1) / 2) * (LOGO + LOGO_HUECO),
            Y_LOGOS,
            Z_PIEZA,
          ]}
          onClick={() => setAbierto((a) => (a === op.id ? null : op.id))}
        />
      ))}

      <Boton
        textura={btnVolver}
        position={[X_INFO - BTN_ANCHO / 2 - 0.01, Y_BOTONES, Z_FOTO]}
        onClick={onCerrar}
      />
      <Boton
        textura={btnViajar}
        position={[X_INFO + BTN_ANCHO / 2 + 0.01, Y_BOTONES, Z_FOTO]}
        onClick={() => onViajar(item.sitio)}
      />
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
      scale={hover ? 1.09 : 1}
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

interface LogoOperadorProps {
  operador: OperadorTuristico
  mascara: Texture
  activo: boolean
  position: [number, number, number]
  onClick: () => void
}

/** Logo del operador: al tocarlo, la columna de la derecha cuenta quién es. */
function LogoOperador({ operador, mascara, activo, position, onClick }: LogoOperadorProps) {
  // Con logo propio se usa su imagen (precargada); sin él, una placa dibujada.
  const propia = operador.logo ? texturaFoto(operador.logo) : undefined
  const dibujada = useMemo(() => (operador.logo ? null : buildLogoTexture(operador)), [operador])
  useEffect(() => () => dibujada?.dispose(), [dibujada])

  return (
    <Placa
      textura={propia ?? dibujada ?? undefined}
      mascara={mascara}
      ancho={LOGO}
      alto={LOGO}
      activa={activo}
      position={position}
      onClick={onClick}
    />
  )
}

interface PlacaProps {
  textura: CanvasTexture | undefined
  /** Redondea las esquinas de la pieza (alphaMap). */
  mascara: Texture
  ancho: number
  alto: number
  activa: boolean
  position: [number, number, number]
  onClick: () => void
}

/**
 * Pieza clickeable con realce: miniatura de galería o logo de operador.
 *
 * El realce es la MADERA del marco, no un color: el de la categoría ya lo lleva
 * su badge y, repartido además por bordes, la ficha parecía tener adornos de
 * colores puestos al azar. El morado queda para un solo sitio, el botón de
 * Viajar, que es la acción final.
 */
function Placa({ textura, mascara, ancho, alto, activa, position, onClick }: PlacaProps) {
  const [hover, setHover] = useState(false)
  if (!textura) return null
  return (
    <group position={position}>
      <mesh scale={hover ? 1.08 : 1}>
        <planeGeometry args={[ancho + 0.03, alto + 0.03]} />
        <meshBasicMaterial
          color={activa ? '#4a3220' : hover ? '#8a6b3f' : '#ded6c6'}
          transparent
          alphaMap={mascara}
        />
      </mesh>
      <mesh
        position={[0, 0, 0.02]}
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
        <planeGeometry args={[ancho, alto]} />
        <meshBasicMaterial map={textura} transparent alphaMap={mascara} toneMapped={false} />
      </mesh>
    </group>
  )
}
