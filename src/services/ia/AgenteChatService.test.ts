import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { agenteChatService, ErrorAgente } from './AgenteChatService'

function respuesta(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const status = init.status ?? 200
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    json: async () => body,
  } as Response
}

describe('agenteChatService (REST)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registrar hace POST /registro y devuelve la sesión (desanida {exito,datos})', async () => {
    fetchMock.mockResolvedValue(
      respuesta(
        { exito: true, datos: { token: 'ses-1', usuario: { nombre: 'Ana', correo: 'ana@b.co' } } },
        { status: 201 },
      ),
    )
    const r = await agenteChatService.registrar('  Ana ', ' ana@b.co ')
    expect(r.token).toBe('ses-1')
    expect(r.usuario?.correo).toBe('ana@b.co')
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/ia/agente/registro')
    expect(init.method).toBe('POST')
    // Recorta espacios antes de enviar.
    expect(JSON.parse(init.body)).toEqual({ nombre: 'Ana', correo: 'ana@b.co' })
  })

  it('activar hace POST /activar con el token del enlace y devuelve la sesión', async () => {
    fetchMock.mockResolvedValue(
      respuesta({
        exito: true,
        datos: { token: 'ses-1', usuario: { nombre: 'Ana', correo: 'a@b.co' } },
      }),
    )
    const s = await agenteChatService.activar(' tok-del-correo ')
    expect(s.token).toBe('ses-1')
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/ia/agente/activar')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ token: 'tok-del-correo' })
  })

  it('listarConversaciones envía el token como Bearer y devuelve el arreglo', async () => {
    fetchMock.mockResolvedValue(respuesta({ conversaciones: [{ id: 'c1', titulo: 'Rutas' }] }))
    const lista = await agenteChatService.listarConversaciones('tok-9')
    expect(lista).toHaveLength(1)
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer tok-9')
  })

  it('lanza ErrorAgente con el status y mensaje del backend en un fallo', async () => {
    fetchMock.mockResolvedValue(respuesta({ mensaje: 'Token inválido' }, { status: 401 }))
    await expect(agenteChatService.listarConversaciones('malo')).rejects.toMatchObject({
      name: 'ErrorAgente',
      status: 401,
      message: 'Token inválido',
    })
  })

  it('un corte de red se traduce a ErrorAgente status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('network'))
    await expect(agenteChatService.registrar('Ana', 'a@b.co')).rejects.toBeInstanceOf(ErrorAgente)
  })

  it('borrarTodo hace DELETE sobre /conversaciones y acepta 204 sin cuerpo', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => undefined } as Response)
    await expect(agenteChatService.borrarTodo('tok')).resolves.toBeUndefined()
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/ia\/agente\/conversaciones$/)
    expect(init.method).toBe('DELETE')
  })
})
