import { Suspense, useMemo } from 'react'
import { BackSide } from 'three'
import { Photosphere, PhotosphereBoundary } from './Photosphere'
import { Pabellon } from './Pabellon'
import { OrbeDestino } from './OrbeDestino'
import { MapaAtril } from './MapaAtril'
import { MiradaControlada } from './MiradaControlada'
import { ControladorEntradaVR } from './ControladorEntradaVR'
import { sitiosCercanos, ALTURA_OJOS } from '../lib/geo'
import type { Distribucion, Geometria, Parada } from '../lib/sala'
import type { Pantalla } from '../lib/patrocinadores'
import type { Sala } from '../lib/salas'
import type { Destino, SitioConDestino, SitioTuristico } from '../../../features/destinos'

interface VrSceneProps {
  /** Medidas de la sala y sus pantallas: bajan hasta Salon. */
  geometria: Geometria
  pantallas: Pantalla[]
  /** Plazas de operador (METAVERSO_SALAS.PLAZAS_OPERADOR). Baja hasta la ficha. */
  plazasOperador: number
  /** null = estamos en la casa; si no, la panorámica del sitio actual. */
  sitio: SitioTuristico | null
  /**
   * El visor 360° del sitio se pinta FUERA del lienzo 3D (Street View / estado
   * vacío, en el DOM). Entonces la escena solo muestra un fondo neutro: ni
   * Photosphere (no hay equirectangular que pintar) ni orbes (se viaja desde el
   * visor 2D), para no dejar una esfera oscura rota detrás del visor.
   */
  panoramaEnDom?: boolean
  enVestibulo?: boolean
  salas: Sala[]
  destinos: Destino[]
  sitios: SitioConDestino[]
  distribucion: Distribucion
  paradas: Parada[]
  /** Dónde está parado el visitante dentro de la casa. */
  parada: Parada
  mapaVisible: boolean
  onIrAParada: (p: Parada) => void
  onEnter: (sitio: SitioTuristico) => void
  onNarrar: (texto: string) => void
  /** Narra la etiqueta de un orbe al apuntarlo (sin repetir el mismo). */
  onApuntar: (etiqueta: string) => void
  onCallar: () => void
  onSalir: () => void
  onEntrarASala?: (sala: Sala) => void
}

const ORBES = 4 // Vecinos que se muestran como vista previa

/**
 * VrScene — Componente Orquestador de la Escena 3D.
 *
 * ARQUITECTURA SENIOR & DESACOPLAMIENTO:
 *  - Abstracción de Mandos VR / Gamepad: Gestor universal de eventos físicos (Oculus / Xbox / PS).
 *  - Salón (Pabellón): Galería principal desacoplada de transiciones intermedias.
 *  - Sitio: Entorno inmersivo fotosférico 360° con puntos de interés geo-referenciados.
 *  - Iluminación PBR: Balance de luces ambientales y hemisféricas para dar realismo
 *    y profundidad al piso pulido y al tragaluz de vidrio sin sobrecargar la GPU.
 */
export function VrScene({
  sitio,
  panoramaEnDom = false,
  geometria,
  pantallas,
  plazasOperador,
  destinos,
  sitios,
  distribucion,
  paradas,
  parada,
  mapaVisible,
  onIrAParada,
  onEnter,
  onNarrar,
  onApuntar,
  onCallar,
  onSalir,
}: VrSceneProps) {
  // Cálculo memoizado de sitios turísticos colindantes para prevenir renderizados innecesarios en la GPU
  const cercanos = useMemo(
    () => (sitio ? sitiosCercanos(sitio.coordenada, sitios, sitio.id, ORBES) : []),
    [sitio, sitios],
  )

  return (
    <>
      {/* ── Capturador / Mapeador de Gamepads y Mandos WebXR VR ── */}
      <ControladorEntradaVR />

      {/* ── Configuración de Iluminación PBR Rebalanceada ── */}
      {/* Luz ambiental sutil para evitar zonas oscuras puras sin quemar los colores */}
      <ambientLight intensity={0.4} />

      {/* Luz hemisférica natural: 'color' define la luz del cielo y 'groundColor' el rebote del suelo */}
      <hemisphereLight color="#ffffff" groundColor="#444444" intensity={0.65} />

      {sitio === null ? (
        <Pabellon
          destinos={destinos}
          geometria={geometria}
          pantallas={pantallas}
          plazasOperador={plazasOperador}
          distribucion={distribucion}
          paradas={paradas}
          parada={parada}
          onIrAParada={onIrAParada}
          onViajar={onEnter}
          onNarrar={onNarrar}
          onCallar={onCallar}
          onSalir={onSalir}
        />
      ) : panoramaEnDom ? (
        /* La panorámica se muestra en el DOM (Street View / estado vacío): aquí
           solo un fondo neutro, sin Photosphere rota ni orbes. */
        <mesh>
          <sphereGeometry args={[50, 32, 16]} />
          <meshBasicMaterial color="#0b0f18" side={BackSide} />
        </mesh>
      ) : (
        <>
          {/* Cámara alineada a la altura de los ojos en la esfera 360° */}
          <group position={[0, ALTURA_OJOS, 0]}>
            <PhotosphereBoundary key={sitio.panorama360}>
              <Suspense fallback={null}>
                <Photosphere url={sitio.panorama360} />
              </Suspense>
            </PhotosphereBoundary>
          </group>

          {cercanos.map((destino) => (
            <OrbeDestino
              key={destino.sitio.id}
              destino={destino}
              onSelect={onEnter}
              onApuntar={onApuntar}
            />
          ))}

          <MapaAtril
            sitios={sitios}
            visible={mapaVisible}
            sitioActualId={sitio.id}
            onSelect={onEnter}
            onNarrar={onNarrar}
          />
        </>
      )}

      {/* Control de vista e interacción de cámara */}
      <MiradaControlada
        posicion={sitio ? [0, ALTURA_OJOS, 0] : parada.posicion}
        yawBase={sitio ? 0 : parada.yaw}
      />
    </>
  )
}
