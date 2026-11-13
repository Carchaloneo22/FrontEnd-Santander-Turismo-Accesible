import { CanvasTexture, SRGBColorSpace } from 'three'
import type { OperadorTuristico } from '../../../features/destinos'

/**
 * panelTexture.ts — dibuja las tarjetas del lobby VR en un <canvas> y las
 * devuelve como textura.
 *
 * ¿Por qué canvas y no texto 3D (drei/troika)? El texto SDF descarga una fuente
 * desde un CDN; si falla, el panel queda mudo. El canvas usa fuentes del sistema
 * y produce UNA sola textura por panel → cero descargas extra y barato para el
 * Quest (1 draw call por tarjeta).
 */

export interface PanelInfo {
  nombre: string
  municipio: string
  descripcion: string
  imagen: string
  /** Color de la categoría (filo de la cartela). */
  color: string
  categoria: string
  /**
   * Pieza de museo: fotografía + cartela con el nombre. Es lo que cuelga del
   * muro. La historia completa se lee en la ficha, que se acerca a ~2 m.
   */
  compacto?: boolean
}

// ── Pieza colgada: la FOTOGRAFÍA sola, en 3:2 ──
// Historia: primero fue una tarjeta web (fondo oscuro, párrafo y botón morado)
// que sobre un muro de cal se veía como un "cuadrado negro" pegado; luego una
// franja blanca con el nombre, que parecía una fila de tabla. Lo que
// corresponde en una galería: la foto enmarcada y su cartela aparte, debajo.
const W = 512
export const FOTO_RATIO = 2 / 3 // alto/ancho de una foto 3:2
const PAD = 24

// ── Cartela grabada (va como pieza propia bajo el marco) ──
const C_W = 512
const C_H = 132
export const CARTELA_RATIO = C_H / C_W

/** Carga una imagen con CORS (necesario para poder usar el canvas como textura). */
function cargarImagen(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Parte el texto en líneas que quepan en `maxW`, como máximo `maxLineas`.
 * Si sobra texto, corta la última línea con puntos suspensivos → nunca desborda.
 */
function envolver(
  ctx: CanvasRenderingContext2D,
  texto: string,
  maxW: number,
  maxLineas: number,
): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean)
  const lineas: string[] = []
  let actual = ''
  let idx = 0

  while (idx < palabras.length && lineas.length < maxLineas) {
    const prueba = actual ? `${actual} ${palabras[idx]}` : palabras[idx]
    // `!actual` fuerza la palabra suelta demasiado larga (evita bucle infinito).
    if (ctx.measureText(prueba).width <= maxW || !actual) {
      actual = prueba
      idx++
    } else {
      lineas.push(actual)
      actual = ''
    }
  }
  if (actual && lineas.length < maxLineas) {
    lineas.push(actual)
    actual = ''
  }

  const truncado = idx < palabras.length || actual !== ''
  if (truncado && lineas.length) {
    let ultima = lineas[lineas.length - 1]
    while (ultima.length > 1 && ctx.measureText(`${ultima}…`).width > maxW) {
      ultima = ultima.slice(0, -1)
    }
    lineas[lineas.length - 1] = `${ultima}…`
  }
  return lineas
}

/** Rectángulo redondeado (píldoras y botones). */
function pill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.closePath()
}

/** La fotografía sola, recortada a 3:2: es lo que va dentro del marco. */
export async function buildFotoTexture(url: string): Promise<CanvasTexture> {
  const H_F = Math.round(W * FOTO_RATIO)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H_F
  const ctx = canvas.getContext('2d')!

  const img = await cargarImagen(url)
  if (img) {
    const escala = Math.max(W / img.width, H_F / img.height)
    const iw = img.width * escala
    const ih = img.height * escala
    ctx.drawImage(img, (W - iw) / 2, (H_F - ih) / 2, iw, ih)
  } else {
    ctx.fillStyle = '#c9c2b4'
    ctx.fillRect(0, 0, W, H_F)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/**
 * Cartela de bronce grabada con el nombre de la pieza. Va como placa aparte bajo
 * el marco —como en un museo—, en vez de una franja blanca dentro del cuadro,
 * que se leía como una fila de tabla.
 */
export function buildCartelaTexture(nombre: string, color: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = C_W
  canvas.height = C_H
  const ctx = canvas.getContext('2d')!

  // Bronce con degradado: lee como metal.
  const bronce = ctx.createLinearGradient(0, 0, 0, C_H)
  bronce.addColorStop(0, '#8a6b3f')
  bronce.addColorStop(0.55, '#6d5230')
  bronce.addColorStop(1, '#7d613a')
  ctx.fillStyle = bronce
  ctx.fillRect(0, 0, C_W, C_H)

  // Filete grabado y filo con el color de la categoría.
  ctx.strokeStyle = 'rgba(0,0,0,0.32)'
  ctx.lineWidth = 3
  ctx.strokeRect(8, 8, C_W - 16, C_H - 16)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 8, C_H)

  // Nombre grabado: sombra arriba-izq + brillo abajo-der = bajorrelieve.
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = 'bold 30px Georgia, "Times New Roman", serif'
  const lineas = envolver(ctx, nombre, C_W - PAD * 2 - 16, 2)
  const alto = lineas.length * 34
  let y = (C_H - alto) / 2 + 26
  for (const linea of lineas) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillText(linea, C_W / 2 - 1.5, y - 1.5)
    ctx.fillStyle = '#f0dcb4'
    ctx.fillText(linea, C_W / 2 + 1, y + 1)
    y += 34
  }
  ctx.textAlign = 'left'

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// ── Botón suelto (mesh 3D propio) ──
const B_W = 512
const B_H = 128
export const BOTON_RATIO = B_H / B_W

/** Textura de un botón: píldora de color con su etiqueta centrada. */
export function buildBotonTexture(label: string, color: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = B_W
  canvas.height = B_H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  pill(ctx, 4, 4, B_W - 8, B_H - 8, (B_H - 8) / 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 46px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, B_W / 2, B_H / 2)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** Etiqueta flotante de un orbe: nombre + distancia (evita narrar al pasar). */
export function buildEtiquetaTexture(nombre: string, distancia: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(10,16,32,0.82)'
  pill(ctx, 0, 0, 512, 128, 24)
  ctx.fill()
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 40px system-ui, sans-serif'
  const n = envolver(ctx, nombre, 470, 1)
  ctx.fillText(n[0] ?? '', 256, 56)
  ctx.fillStyle = '#9fb3d1'
  ctx.font = '30px system-ui, sans-serif'
  ctx.fillText(distancia, 256, 100)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

// ── Columna de información de la vista de contemplación ──
const I_W = 760
const I_H = 628
export const INFO_RATIO = I_H / I_W

/** Rótulo fijo al pie de la columna: bajo él van los logos de los operadores. */
function pieOperadores(ctx: CanvasRenderingContext2D) {
  const y = I_H - 34
  ctx.strokeStyle = '#ded5c2'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(30, y - 26)
  ctx.lineTo(I_W - 30, y - 26)
  ctx.stroke()
  ctx.fillStyle = '#8a6b3d'
  ctx.font = 'bold 21px system-ui, sans-serif'
  ctx.fillText('OPERADORES TURÍSTICOS', 30, y)
}

/** Radio de las esquinas: el mismo en el tablero y en la columna. */
const RADIO = 26
/** Tono de la casa (cobre/bronce): lo neutro de la ficha, frente al color del sitio. */
const BRONCE = '#8a6b3f'

/**
 * Fondo común de la columna: tarjeta de esquinas redondeadas, recortada a su
 * silueta (fuera queda transparente). A canto vivo la ficha se leía como un
 * montón de rectángulos.
 *
 * Sin pestaña de color: el color de la categoría ya lo lleva su badge, y
 * repartido además por filos y bordes parecían adornos puestos al azar.
 */
function fondoColumna(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, I_W, I_H)
  pill(ctx, 0, 0, I_W, I_H, RADIO)
  ctx.save()
  ctx.clip()
  ctx.fillStyle = '#faf7f0'
  ctx.fillRect(0, 0, I_W, I_H)
  ctx.restore()
}

// ── Máscara de esquinas redondeadas ──
const mascaras = new Map<number, CanvasTexture>()

/**
 * Máscara para redondear una imagen SIN tocar su textura: blanco dentro, negro
 * fuera, y three la lee como `alphaMap`. Hace falta porque las fotos salen del
 * caché compartido con los cuadros del muro, que van enmarcados a canto vivo:
 * redondearlas en su canvas las redondearía también en la pared.
 *
 * Vive a nivel de módulo y no se libera: son dos o tres y se reutilizan siempre.
 */
export function mascaraRedonda(ratio: number): CanvasTexture {
  const cacheada = mascaras.get(ratio)
  if (cacheada) return cacheada

  const w = 512
  const h = Math.round(w * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#ffffff'
  pill(ctx, 0, 0, w, h, Math.round(Math.min(w, h) * 0.09))
  ctx.fill()

  // Sin colorSpace sRGB: es una máscara, no un color que haya que corregir.
  const texture = new CanvasTexture(canvas)
  texture.anisotropy = 4
  mascaras.set(ratio, texture)
  return texture
}

// ── Tablero de la ficha: la tabla sobre la que va todo lo demás ──
const T_W = 1024

/**
 * Tablero de fondo con esquinas redondeadas y una sombra suave alrededor. El
 * canvas lleva un margen para que la sombra quepa, así que el mesh se dibuja un
 * poco mayor que el cuerpo útil (ver `MARGEN_TABLERO`).
 */
export const MARGEN_TABLERO = 0.09

export function buildTableroTexture(ratio: number): CanvasTexture {
  const T_H = Math.round(T_W * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = T_W
  canvas.height = T_H
  const ctx = canvas.getContext('2d')!
  // Margen en píxeles equivalente al del mesh: deja sitio a la sombra.
  const m = Math.round((MARGEN_TABLERO / (MARGEN_TABLERO * 2 + 1)) * T_W) / 2

  ctx.clearRect(0, 0, T_W, T_H)
  ctx.save()
  ctx.shadowColor = 'rgba(20, 12, 4, 0.45)'
  ctx.shadowBlur = 26
  ctx.shadowOffsetY = 10
  ctx.fillStyle = '#efe9db'
  pill(ctx, m, m, T_W - m * 2, T_H - m * 2, 40)
  ctx.fill()
  ctx.restore()

  // Filete claro: despega el tablero del muro de cal, que es de un crema parecido.
  ctx.strokeStyle = 'rgba(120, 96, 60, 0.35)'
  ctx.lineWidth = 3
  pill(ctx, m, m, T_W - m * 2, T_H - m * 2, 40)
  ctx.stroke()

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export interface InfoDetalle {
  nombre: string
  municipio: string
  categoria: string
  color: string
  descripcion: string
}

/**
 * La columna de texto de la ficha: categoría, nombre, municipio e historia. Va a
 * la derecha de la fotografía, no debajo: apaisado se lee de una pasada.
 * Al pie queda el rótulo de operadores, cuyos logos se montan como piezas
 * clickeables aparte (una textura no se puede pulsar por zonas).
 */
export function buildInfoTexture(info: InfoDetalle): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = I_W
  canvas.height = I_H
  const ctx = canvas.getContext('2d')!
  const pad = 34
  const maxW = I_W - pad * 2

  fondoColumna(ctx)

  // Categoría: el ÚNICO sitio donde aparece su color.
  ctx.font = 'bold 24px system-ui, sans-serif'
  const catW = ctx.measureText(info.categoria).width + 38
  ctx.fillStyle = info.color
  pill(ctx, pad, 34, catW, 42, 21)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.fillText(info.categoria, pad + 19, 55)
  ctx.textBaseline = 'alphabetic'

  // Nombre
  ctx.fillStyle = '#1f2937'
  ctx.font = 'bold 46px system-ui, sans-serif'
  let y = 142
  for (const linea of envolver(ctx, info.nombre, maxW, 2)) {
    ctx.fillText(linea, pad, y)
    y += 50
  }

  // Municipio
  ctx.fillStyle = '#6b7280'
  ctx.font = '25px system-ui, sans-serif'
  ctx.fillText(`📍 ${info.municipio}`, pad, y + 6)
  y += 40

  // Historia: solo las líneas que caben sobre el rótulo de operadores.
  const LINEA = 31
  const maxLineas = Math.max(0, Math.floor((I_H - 84 - y) / LINEA))
  ctx.fillStyle = '#374151'
  ctx.font = '24px system-ui, sans-serif'
  for (const linea of envolver(ctx, info.descripcion, maxW, maxLineas)) {
    y += LINEA
    ctx.fillText(linea, pad, y)
  }

  pieOperadores(ctx)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/**
 * La misma columna, pero contando un operador: se muestra al tocar su logo, en
 * el sitio donde estaba la historia del lugar. Un espacio libre se anuncia como
 * tal —nunca como una empresa—, para no inventar datos.
 *
 * En bronce, no en el color de la categoría: esa es del LUGAR y ya la lleva su
 * badge; repetida aquí volvía a llenar la ficha de bordes de colores sueltos.
 */
export function buildOperadorTexture(op: OperadorTuristico): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = I_W
  canvas.height = I_H
  const ctx = canvas.getContext('2d')!
  const pad = 34
  const maxW = I_W - pad * 2

  fondoColumna(ctx)

  // Distintivo: el operador real lleva su servicio; la plaza libre, su aviso.
  const distintivo = op.libre ? 'ESPACIO DISPONIBLE' : op.servicio.toUpperCase()
  const tono = op.libre ? '#9aa1ab' : BRONCE
  ctx.font = 'bold 20px system-ui, sans-serif'
  const dW = ctx.measureText(distintivo).width + 38
  ctx.fillStyle = tono
  pill(ctx, pad, 34, dW, 40, 20)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.fillText(distintivo, pad + 19, 54)
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = '#1f2937'
  ctx.font = 'bold 42px system-ui, sans-serif'
  let y = 138
  for (const linea of envolver(ctx, op.nombre, maxW, 2)) {
    ctx.fillText(linea, pad, y)
    y += 46
  }

  if (!op.libre) {
    ctx.fillStyle = '#6b7280'
    ctx.font = '24px system-ui, sans-serif'
    ctx.fillText(op.servicio, pad, y)
    y += 34
  }

  if (op.contacto) {
    ctx.fillStyle = BRONCE
    ctx.font = 'bold 24px system-ui, sans-serif'
    ctx.fillText(op.contacto, pad, y)
    y += 36
  }

  const LINEA = 31
  const maxLineas = Math.max(0, Math.floor((I_H - 118 - y) / LINEA))
  ctx.fillStyle = op.libre ? '#9aa1ab' : '#374151'
  ctx.font = `${op.libre ? 'italic ' : ''}24px system-ui, sans-serif`
  for (const linea of envolver(ctx, op.descripcion ?? '', maxW, maxLineas)) {
    y += LINEA
    ctx.fillText(linea, pad, y)
  }

  // Cómo se sale: tocar el mismo logo. Sin esto el visitante queda encerrado en
  // la ficha del operador sin saber cómo volver a la del lugar.
  ctx.fillStyle = '#9aa1ab'
  ctx.font = 'italic 20px system-ui, sans-serif'
  ctx.fillText('Toca su logo otra vez para volver al lugar', pad, I_H - 88)

  pieOperadores(ctx)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// ── Logo de un operador (placa cuadrada, clickeable) ──
const L_W = 256

/**
 * Placa del operador. Con logo propio se usará su imagen; sin él —o si es una
 * plaza libre— se dibuja una placa con su inicial, que es honesto y además se
 * lee bien de lejos.
 */
export function buildLogoTexture(op: OperadorTuristico): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = L_W
  canvas.height = L_W
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, L_W, L_W)
  pill(ctx, 0, 0, L_W, L_W, 22)
  ctx.save()
  ctx.clip()
  ctx.fillStyle = op.libre ? '#ece7dc' : '#ffffff'
  ctx.fillRect(0, 0, L_W, L_W)
  ctx.restore()

  if (op.libre) {
    // Placa vacía: recuadro punteado y un "+", el lenguaje universal de hueco.
    ctx.strokeStyle = '#bdb5a5'
    ctx.lineWidth = 4
    ctx.setLineDash([10, 8])
    ctx.strokeRect(14, 14, L_W - 28, L_W - 28)
    ctx.setLineDash([])
    ctx.strokeStyle = '#a49b89'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(L_W / 2 - 26, L_W / 2 - 14)
    ctx.lineTo(L_W / 2 + 26, L_W / 2 - 14)
    ctx.moveTo(L_W / 2, L_W / 2 - 40)
    ctx.lineTo(L_W / 2, L_W / 2 + 12)
    ctx.stroke()
  } else {
    ctx.fillStyle = BRONCE
    ctx.beginPath()
    ctx.arc(L_W / 2, L_W / 2 - 14, 52, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 60px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(op.nombre.charAt(0).toUpperCase(), L_W / 2, L_W / 2 - 12)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }

  ctx.fillStyle = op.libre ? '#8d8578' : '#374151'
  ctx.font = 'bold 22px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(envolver(ctx, op.nombre, L_W - 24, 1)[0] ?? '', L_W / 2, L_W - 34)
  ctx.textAlign = 'left'

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// ── Nombre del municipio: SOLO letras, sin tabla detrás ──
const N_W = 1024
const N_H = 240
export const NOMBRE_RATIO = N_H / N_W

/**
 * Nombre del municipio en letras de COBRE repujado sobre el muro de cal, con un
 * filete de fique (la fibra santandereana) debajo. Fondo transparente: no hay
 * placa ni tabla, solo las letras aplicadas a la pared.
 *
 * El relieve se finge con tres pasadas: sombra arriba-izquierda (el vaciado),
 * cuerpo de cobre y brillo abajo-derecha (la luz rasante). Es como se lee un
 * repujado real.
 */
export function buildNombreTexture(nombre: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = N_W
  canvas.height = N_H
  const ctx = canvas.getContext('2d')! // queda transparente: no se rellena

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 92px Georgia, "Times New Roman", serif'

  const y = 96
  // Sombra del vaciado.
  ctx.fillStyle = 'rgba(60, 35, 12, 0.55)'
  ctx.fillText(nombre, N_W / 2 - 3, y - 3)
  // Brillo del relieve.
  ctx.fillStyle = 'rgba(255, 214, 150, 0.75)'
  ctx.fillText(nombre, N_W / 2 + 3, y + 3)
  // Cuerpo de cobre.
  ctx.fillStyle = '#b87333'
  ctx.fillText(nombre, N_W / 2, y)

  // Filete de fique: cordón trenzado bajo el nombre.
  const anchoTexto = Math.min(ctx.measureText(nombre).width + 80, N_W - 60)
  const x0 = (N_W - anchoTexto) / 2
  const fique = ctx.createLinearGradient(0, 168, 0, 182)
  fique.addColorStop(0, '#c9a86b')
  fique.addColorStop(0.5, '#9b7f4a')
  fique.addColorStop(1, '#7d6438')
  ctx.fillStyle = fique
  ctx.fillRect(x0, 168, anchoTexto, 12)
  // Trenzado: diagonales claras que sugieren la fibra.
  ctx.strokeStyle = 'rgba(240, 222, 180, 0.4)'
  ctx.lineWidth = 2
  for (let x = x0; x < x0 + anchoTexto; x += 10) {
    ctx.beginPath()
    ctx.moveTo(x, 180)
    ctx.lineTo(x + 6, 168)
    ctx.stroke()
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// ── Pantalla de patrocinador sin video: el cartel de "espacio disponible" ──
const P_W = 1024
const P_H = 576
export const PANTALLA_RATIO = P_H / P_W

/** Cartel que muestra un televisor mientras no tenga video asignado. */
export function buildPantallaTexture(titulo: string, subtitulo: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = P_W
  canvas.height = P_H
  const ctx = canvas.getContext('2d')!

  // Pantalla apagada, con un leve degradado (no un negro plano y muerto).
  const fondo = ctx.createLinearGradient(0, 0, 0, P_H)
  fondo.addColorStop(0, '#141a26')
  fondo.addColorStop(1, '#0b0f18')
  ctx.fillStyle = fondo
  ctx.fillRect(0, 0, P_W, P_H)

  // Icono de reproducción: dice "aquí va un video" sin necesidad de texto.
  ctx.beginPath()
  ctx.arc(P_W / 2, P_H / 2 - 40, 62, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(184, 115, 51, 0.75)'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(P_W / 2 - 20, P_H / 2 - 74)
  ctx.lineTo(P_W / 2 + 32, P_H / 2 - 40)
  ctx.lineTo(P_W / 2 - 20, P_H / 2 - 6)
  ctx.closePath()
  ctx.fillStyle = 'rgba(184, 115, 51, 0.85)'
  ctx.fill()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#e6dcc8'
  ctx.font = 'bold 44px Georgia, "Times New Roman", serif'
  ctx.fillText(titulo, P_W / 2, P_H / 2 + 78)
  ctx.fillStyle = '#8b96a8'
  ctx.font = '26px system-ui, sans-serif'
  ctx.fillText(subtitulo, P_W / 2, P_H / 2 + 132)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/**
 * Bandera de Santander para colgar en la casa. Proporción real de las franjas
 * (verde:amarillo:negro = 3:1:1) y la franja roja del asta con sus 7 estrellas
 * (las 7 provincias). Estática a propósito: en VR un entorno que se mueve le
 * roba la atención a la obra.
 */
export function buildBanderaTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  const W_B = 512
  const H_B = 341
  canvas.width = W_B
  canvas.height = H_B
  const ctx = canvas.getContext('2d')!

  // Franjas horizontales 3:1:1:1:3 sobre 9 partes.
  const p = H_B / 9
  const franjas: [number, number, string][] = [
    [0, 3 * p, '#1b8a3f'],
    [3 * p, p, '#ffcf00'],
    [4 * p, p, '#101418'],
    [5 * p, p, '#ffcf00'],
    [6 * p, 3 * p, '#1b8a3f'],
  ]
  for (const [y, h, color] of franjas) {
    ctx.fillStyle = color
    ctx.fillRect(0, y, W_B, h)
  }

  // Franja roja del asta (un tercio).
  const rojo = W_B / 3
  ctx.fillStyle = '#d1141a'
  ctx.fillRect(0, 0, rojo, H_B)

  // 7 estrellas blancas.
  const estrella = (cx: number, cy: number, r: number) => {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const radio = i % 2 === 0 ? r : r * 0.42
      const a = (Math.PI / 5) * i - Math.PI / 2
      const x = cx + Math.cos(a) * radio
      const y = cy + Math.sin(a) * radio
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  }
  for (let i = 0; i < 7; i++) {
    estrella(rojo / 2, (H_B / 8) * (i + 1), 11)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}
