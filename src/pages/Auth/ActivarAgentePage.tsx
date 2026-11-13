import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { agenteChatService, ErrorAgente } from '../../services/ia/AgenteChatService'
import { guardarSesionAgente } from '../../services/ia/agenteStorage'

type Estado = 'activando' | 'ok' | 'sin-token' | 'error'

/**
 * Página de activación del asistente de chat. El correo de registro del agente
 * lleva a `/chat/activar?token=…`; aquí se canjea el token por la SESIÓN (token
 * bearer) y se guarda en localStorage. Si el usuario tenía el chat abierto en
 * otra pestaña, el evento `storage` lo desbloquea solo (ver `useAgenteChat`).
 */
export function ActivarAgentePage() {
  const [params] = useSearchParams()
  const token = params.get('token')?.trim() ?? ''
  // El estado inicial se deriva en el render (sin setState en el effect): si no
  // viene token, ya arrancamos en "sin-token".
  const [estado, setEstado] = useState<Estado>(token ? 'activando' : 'sin-token')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    document.title = 'Activar asistente — Santander Accesible'
    if (!token) return
    let vivo = true
    agenteChatService
      .activar(token)
      .then((s) => {
        if (!vivo) return
        guardarSesionAgente({
          token: s.token,
          nombre: s.usuario?.nombre,
          correo: s.usuario?.correo,
        })
        setEstado('ok')
      })
      .catch((e: unknown) => {
        if (!vivo) return
        setMensaje(
          e instanceof ErrorAgente
            ? e.message
            : 'No se pudo activar. El enlace puede haber caducado; solicita uno nuevo.',
        )
        setEstado('error')
      })
    return () => {
      vivo = false
    }
  }, [token])

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '3.5rem 1.25rem', lineHeight: 1.6 }}>
      {estado === 'activando' && <p>Activando tu asistente…</p>}

      {estado === 'ok' && (
        <>
          <h1>¡Chat activado! 🎉</h1>
          <p>
            Ya puedes usar el asistente de turismo de Santander. Si tenías el chat abierto en otra
            pestaña, se desbloqueó solo.
          </p>
          <p>
            <Link to="/">Volver al inicio y empezar a chatear</Link>
          </p>
        </>
      )}

      {estado === 'sin-token' && (
        <>
          <h1>Enlace incompleto</h1>
          <p>
            Falta el token de activación. Abre el enlace completo desde el correo que te enviamos.
          </p>
          <p>
            <Link to="/">Volver al inicio</Link>
          </p>
        </>
      )}

      {estado === 'error' && (
        <>
          <h1>No se pudo activar</h1>
          <p>{mensaje}</p>
          <p>
            <Link to="/">Volver al inicio e intentarlo de nuevo</Link>
          </p>
        </>
      )}
    </main>
  )
}
