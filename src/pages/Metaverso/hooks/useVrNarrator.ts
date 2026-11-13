import { useCallback, useEffect, useRef, useState } from 'react'
import { speak, stopSpeaking } from '../../../lib/speak'
import type { SitioTuristico } from '../../../features/destinos'

/** Qué se está audio-describiendo ahora (lo refleja el intérprete de señas). */
export interface NarracionActual {
  /** El lugar que se describe, o null si es un texto suelto (p. ej. una ficha). */
  sitio: SitioTuristico | null
  texto: string
}

/**
 * useVrNarrator — audio-descripción de la experiencia VR (regla de accesibilidad).
 * Reutiliza `lib/speak.ts` (Web Speech API). SRP: encapsula QUÉ y CUÁNDO narrar,
 * evitando lógica repartida por el componente.
 *
 * - `narratePlace`: al entrar a un lugar → nombre + descripción. La evidencia en
 *   turismo virtual señala la narración como el mayor factor de presencia
 *   (presencia espacial 0.82 con narración vs 0.43 sin ella), así que va
 *   activada por defecto: no es solo accesibilidad, es la experiencia.
 * - `narrateHotspot`: al apuntar/seleccionar un hotspot → su etiqueta (sin repetir
 *   mientras se mantiene el foco en el mismo).
 * - Todo se silencia si `enabled` es false (toggle de audio-descripción).
 *
 * Además expone, para sincronizar al intérprete de lengua de señas con la voz:
 * - `narrando`: si hay una descripción de lugar sonando ahora mismo.
 * - `narracion`: qué se está describiendo (para resolver su clip de señas).
 * Los hotspots —etiquetas sueltas— no cuentan como narración de lugar: son muy
 * frecuentes y harían parpadear al avatar.
 */
export function useVrNarrator(enabled: boolean) {
  const lastHotspot = useRef<string | null>(null)
  const [narrando, setNarrando] = useState(false)
  const [narracion, setNarracion] = useState<NarracionActual | null>(null)

  // Cada locución recibe un turno. `speak` cancela la anterior, lo que dispara el
  // `onEnd` de ESA —ya obsoleto—; comparando el turno se ignora ese `onEnd` viejo
  // y solo la locución vigente puede apagar `narrando`.
  const turnoRef = useRef(0)

  const describir = useCallback((n: NarracionActual) => {
    const turno = ++turnoRef.current
    setNarracion(n)
    const sonando = speak(n.texto, {
      onEnd: () => {
        if (turnoRef.current === turno) setNarrando(false)
      },
    })
    setNarrando(sonando)
  }, [])

  const narratePlace = useCallback(
    (sitio: SitioTuristico) => {
      if (!enabled) return
      describir({ sitio, texto: `${sitio.nombre}. ${sitio.descripcion}` })
    },
    [enabled, describir],
  )

  const narrateHotspot = useCallback(
    (label: string) => {
      if (!enabled) return
      if (lastHotspot.current === label) return // evita repetir mientras se apunta
      lastHotspot.current = label
      speak(label)
    },
    [enabled],
  )

  const resetHotspot = useCallback(() => {
    lastHotspot.current = null
  }, [])

  /**
   * Narra un texto cualquiera, siempre (sin la deduplicación de `narrateHotspot`,
   * que existía para no repetir mientras se apunta). Se usa en momentos con
   * sentido: al presentar la ficha de un lugar antes de viajar.
   */
  const narrar = useCallback(
    (texto: string) => {
      if (!enabled) return
      describir({ sitio: null, texto })
    },
    [enabled, describir],
  )

  /**
   * Corta la locución en curso. Se llama al cerrar una ficha: si no, la voz
   * seguía contando un lugar que el visitante ya había cerrado, y solo paraba al
   * abrir otro.
   */
  const callar = useCallback(() => {
    turnoRef.current++
    stopSpeaking()
    setNarrando(false)
  }, [])

  // Al apagar la audio-descripción o desmontar, corta cualquier locución en curso.
  // No hace falta apagar `narrando` a mano: `stopSpeaking()` cancela la locución
  // vigente y eso dispara su `onEnd`, que —con el turno al día— lo pone en false.
  useEffect(() => {
    if (!enabled) stopSpeaking()
    return () => stopSpeaking()
  }, [enabled])

  return { narratePlace, narrateHotspot, resetHotspot, narrar, callar, narrando, narracion }
}
