import type { Pantalla } from '../lib/patrocinadores'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Salon, type RotuloSeccion } from './Salon'
import { PanelTarjeta } from './PanelTarjeta'
import { PanelDetalle } from './PanelDetalle'
import { PanelDetalleCultural } from './PanelDetalleCultural'
import { NodoTeleport } from './NodoTeleport'
import {
  bahiaDe,
  colocarEnSeccion,
  posicionFicha,
  rotYDeMuro,
  type Distribucion,
  type Parada,
  type Seccion,
  type Geometria,
} from '../lib/sala'
import type { PanelInfo } from '../lib/panelTexture'
import type { CuadroCulturalModel } from '../models/CuadroCulturalModel'
import {
  CATEGORIAS,
  type Destino,
  type SitioConDestino,
  type SitioTuristico,
} from '../../../features/destinos'

interface PabellonProps {
  destinos: Destino[]
  geometria: Geometria
  pantallas: Pantalla[]
  plazasOperador: number
  distribucion: Distribucion
  paradas: Parada[]
  parada: Parada
  onIrAParada: (p: Parada) => void
  onViajar: (sitio: SitioTuristico) => void
  onNarrar: (texto: string) => void
  onCallar: () => void
  onSalir: () => void
}

interface Elegido extends SitioConDestino {
  seccion: Seccion
  bahiaX: number
}

export function Pabellon({
  destinos,
  geometria,
  pantallas,
  plazasOperador,
  distribucion,
  paradas,
  parada,
  onIrAParada,
  onViajar,
  onNarrar,
  onCallar,
  onSalir,
}: PabellonProps) {
  // Estado para la tarjeta de municipios
  const [elegido, setElegido] = useState<Elegido | null>(null)

  // Estado para la obra cultural elegida (Hormiga Culona, Mapa, etc.)
  const [obraCulturalElegida, setObraCulturalElegida] = useState<{
    obra: CuadroCulturalModel
    seccion: Seccion
  } | null>(null)

  const irA = useCallback(
    (p: Parada) => {
      setElegido(null)
      setObraCulturalElegida(null)
      onIrAParada(p)
    },
    [onIrAParada],
  )

  // Audio / Narración para Municipio
  useEffect(() => {
    if (!elegido) return
    onNarrar(`${elegido.sitio.nombre}, ${elegido.destino.nombre}. ${elegido.sitio.descripcion}`)
    return onCallar
  }, [elegido, onNarrar, onCallar])

  // Audio / Narración para Obra Cultural
  useEffect(() => {
    if (!obraCulturalElegida) return
    const { obra } = obraCulturalElegida
    onNarrar(`Exposición cultural: ${obra.titulo}. ${obra.descripcion}`)
    return onCallar
  }, [obraCulturalElegida, onNarrar, onCallar])

  const rotulos = useMemo<RotuloSeccion[]>(
    () =>
      distribucion.secciones.map((s) => {
        const d = destinos[s.destino]
        if (!d) return { seccion: s, titulo: '', lema: '', libre: true }
        const lema = d.titular.includes(',')
          ? d.titular.slice(d.titular.indexOf(',') + 1).trim()
          : d.titular
        return { seccion: s, titulo: d.nombre, lema, libre: false }
      }),
    [distribucion.secciones, destinos],
  )

  const piezas = useMemo(
    () =>
      distribucion.secciones.flatMap((s) => {
        const destino = destinos[s.destino]
        if (!destino) return []
        const colocaciones = colocarEnSeccion(destino.sitios.length, s)
        return destino.sitios.map((sitio, k) => ({
          sitio,
          destino,
          seccion: s,
          colocacion: colocaciones[k],
          info: {
            nombre: sitio.nombre,
            municipio: destino.nombre,
            descripcion: sitio.descripcion,
            imagen: sitio.imagen,
            color: CATEGORIAS[sitio.categoria].color,
            categoria: CATEGORIAS[sitio.categoria].label,
            compacto: true,
          } satisfies PanelInfo,
        }))
      }),
    [distribucion.secciones, destinos],
  )

  return (
    <Salon
      largo={distribucion.largo}
      bahiasPorMuro={distribucion.bahiasPorMuro}
      rotulos={rotulos}
      geometria={geometria}
      pantallas={pantallas}
      pantallaActiva={parada.pantalla}
      onSalir={onSalir}
      onSeleccionarObra={(obra, seccion) => {
        // Al seleccionar obra cultural, cerramos cualquier municipio abierto
        setElegido(null)
        setObraCulturalElegida({ obra, seccion })
      }}
    >
      {/* Nodos de teletransporte (Piso) */}
      {paradas.map((p) => (
        <NodoTeleport
          key={p.id}
          position={p.posicion}
          yaw={p.yaw}
          activo={p.id === parada.id}
          onIr={() => irA(p)}
        />
      ))}

      {/* Tarjetas interactivas de Municipios */}
      {piezas.map(({ sitio, destino, seccion, colocacion, info }) => {
        if (!colocacion) return null
        return (
          <PanelTarjeta
            key={sitio.id}
            info={info}
            position={colocacion.position}
            rotY={colocacion.rotY}
            onSelect={() => {
              setObraCulturalElegida(null)
              setElegido({
                sitio,
                destino,
                seccion,
                bahiaX: bahiaDe(seccion, colocacion.position[0]),
              })
            }}
          />
        )
      })}

      {/* Panel Detalle Modal para Municipios */}
      {elegido && (
        <PanelDetalle
          plazasOperador={plazasOperador}
          key={elegido.sitio.id}
          item={elegido}
          position={posicionFicha(elegido.seccion.muro, elegido.bahiaX)}
          rotY={rotYDeMuro(elegido.seccion.muro)}
          onViajar={onViajar}
          onCerrar={() => setElegido(null)}
        />
      )}

      {/* Panel Detalle Modal Flotante para Obras Culturales */}
      {obraCulturalElegida && (
        <PanelDetalleCultural
          obra={obraCulturalElegida.obra}
          position={posicionFicha(
            obraCulturalElegida.seccion.muro,
            obraCulturalElegida.seccion.centrosBahia?.[0] ?? 0,
          )}
          rotY={rotYDeMuro(obraCulturalElegida.seccion.muro)}
          onViajar={() => {
            console.log('Navegando a la experiencia de:', obraCulturalElegida.obra.titulo)
          }}
          onCerrar={() => setObraCulturalElegida(null)}
        />
      )}
    </Salon>
  )
}
