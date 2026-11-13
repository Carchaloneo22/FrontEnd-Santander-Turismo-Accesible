import { useCallback, useEffect, useRef, useState } from 'react'
import { iaService, type FuenteIA, type ControladorStream } from '../../services/ia/IaService'

export type RolMensaje = 'usuario' | 'ia'
export interface MensajeChat {
  id: string
  rol: RolMensaje
  texto: string
}

/** Estado del turno actual del chat. */
export type EstadoChat = 'vacio' | 'cargando' | 'streaming' | 'listo' | 'error'

let contador = 0
const nuevoId = () => `m${Date.now()}_${contador++}`

/**
 * useChatIA — orquesta la conversación con el asistente y el streaming SSE.
 * Expone los mensajes, el estado del turno (cargando/streaming/listo/error), las
 * fuentes citadas y las acciones. El texto de la IA se va rellenando CHUNK A
 * CHUNK sobre el último mensaje, para que la UI (y el aria-live) lo anuncien a
 * medida que llega.
 */
export function useChatIA() {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([])
  const [estado, setEstado] = useState<EstadoChat>('vacio')
  const [fuentes, setFuentes] = useState<FuenteIA[]>([])
  const [error, setError] = useState<string | null>(null)
  const controlRef = useRef<ControladorStream | null>(null)
  const idIaRef = useRef<string | null>(null)

  // Cierra cualquier stream vivo al desmontar.
  useEffect(() => () => controlRef.current?.cerrar(), [])

  const enviar = useCallback(
    (texto: string) => {
      const q = texto.trim()
      if (!q || estado === 'cargando' || estado === 'streaming') return

      controlRef.current?.cerrar()
      setError(null)
      setFuentes([])

      const idIa = nuevoId()
      idIaRef.current = idIa
      setMensajes((prev) => [
        ...prev,
        { id: nuevoId(), rol: 'usuario', texto: q },
        { id: idIa, rol: 'ia', texto: '' },
      ])
      setEstado('cargando')

      const anexar = (delta: string) =>
        setMensajes((prev) =>
          prev.map((m) => (m.id === idIa ? { ...m, texto: m.texto + delta } : m)),
        )

      controlRef.current = iaService.consultar(q, {
        onChunk: (delta) => {
          setEstado((e) => (e === 'cargando' ? 'streaming' : e))
          anexar(delta)
        },
        onFuentes: (f) => setFuentes(f),
        onDone: () => setEstado('listo'),
        onError: (mensaje) => {
          setError(mensaje)
          setEstado('error')
        },
      })
    },
    [estado],
  )

  const cancelar = useCallback(() => {
    controlRef.current?.cerrar()
    controlRef.current = null
    setEstado((e) => (e === 'cargando' || e === 'streaming' ? 'listo' : e))
  }, [])

  const limpiar = useCallback(() => {
    controlRef.current?.cerrar()
    controlRef.current = null
    idIaRef.current = null
    setMensajes([])
    setFuentes([])
    setError(null)
    setEstado('vacio')
  }, [])

  return { mensajes, estado, fuentes, error, enviar, cancelar, limpiar }
}
