import { describe, expect, it } from 'vitest'
import { detectarTipo, sanearNombre, validarArchivo } from './archivos'

/** Construye un File con los bytes dados (para forjar firmas reales o falsas). */
function archivoDe(bytes: number[], nombre: string, type: string): File {
  return new File([new Uint8Array(bytes)], nombre, { type })
}

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]
const WEBP = [...'RIFF']
  .map((c) => c.charCodeAt(0))
  .concat(
    [0x24, 0x00, 0x00, 0x00],
    [...'WEBPVP8 '].map((c) => c.charCodeAt(0)),
  )
const HTML = [...'<!DOCTYPE html><script>'].map((c) => c.charCodeAt(0))

// jsdom no decodifica imágenes: se desactiva la medición en los tests.
const SIN_MEDIR = { medirDimensiones: false as const }

describe('detectarTipo', () => {
  it('reconoce un PNG por sus magic bytes', async () => {
    expect(await detectarTipo(archivoDe(PNG, 'a.png', 'image/png'))).toBe('png')
  })

  it('reconoce un JPEG por sus magic bytes', async () => {
    expect(await detectarTipo(archivoDe(JPEG, 'a.jpg', 'image/jpeg'))).toBe('jpeg')
  })

  it('reconoce un WebP por sus magic bytes', async () => {
    expect(await detectarTipo(archivoDe(WEBP, 'a.webp', 'image/webp'))).toBe('webp')
  })

  it('devuelve null para contenido HTML (no hay firma de imagen)', async () => {
    expect(await detectarTipo(archivoDe(HTML, 'a.png', 'image/png'))).toBeNull()
  })
})

describe('sanearNombre', () => {
  it('neutraliza el path traversal', () => {
    const saneado = sanearNombre('../../etc/passwd')
    expect(saneado).not.toContain('/')
    expect(saneado.startsWith('.')).toBe(false)
  })

  it('quita acentos y caracteres raros', () => {
    expect(sanearNombre('peñón göl<>.jpg')).toBe('penon_gol_.jpg')
  })

  it('nunca devuelve vacío', () => {
    expect(sanearNombre('¿¿¿')).toBe('archivo')
  })
})

describe('validarArchivo', () => {
  it('acepta un PNG válido', async () => {
    const r = await validarArchivo(archivoDe(PNG, 'foto.png', 'image/png'), SIN_MEDIR)
    expect(r).toEqual({ ok: true, tipo: 'png' })
  })

  it('acepta MIME declarado vacío y decide por los bytes', async () => {
    const r = await validarArchivo(archivoDe(JPEG, 'foto.jpg', ''), SIN_MEDIR)
    expect(r.ok).toBe(true)
  })

  it('rechaza un archivo vacío', async () => {
    const r = await validarArchivo(archivoDe([], 'foto.png', 'image/png'), SIN_MEDIR)
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining('vacío') })
  })

  it('rechaza por peso con el mensaje del límite', async () => {
    const r = await validarArchivo(archivoDe(PNG, 'foto.png', 'image/png'), {
      ...SIN_MEDIR,
      maxBytes: 4,
    })
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining('máximo') })
  })

  it('rechaza extensiones fuera de la lista blanca', async () => {
    const r = await validarArchivo(archivoDe(PNG, 'script.exe', 'image/png'), SIN_MEDIR)
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining('Formato no permitido') })
  })

  it('rechaza un MIME declarado no permitido', async () => {
    const r = await validarArchivo(archivoDe(PNG, 'a.png', 'image/gif'), SIN_MEDIR)
    expect(r.ok).toBe(false)
  })

  it('rechaza HTML disfrazado de PNG (extensión y MIME mienten)', async () => {
    const r = await validarArchivo(archivoDe(HTML, 'foto.png', 'image/png'), SIN_MEDIR)
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining('contenido') })
  })

  it('rechaza contenido JPEG con extensión .png (incoherencia)', async () => {
    const r = await validarArchivo(archivoDe(JPEG, 'foto.png', 'image/png'), SIN_MEDIR)
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining('extensión') })
  })

  it('respeta la lista de tipos del llamador', async () => {
    const r = await validarArchivo(archivoDe(PNG, 'foto.png', 'image/png'), {
      ...SIN_MEDIR,
      tipos: ['webp'],
    })
    expect(r.ok).toBe(false)
  })
})
