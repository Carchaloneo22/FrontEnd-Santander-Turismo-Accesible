import { CanvasTexture, SRGBColorSpace } from 'three'

/**
 * tileMap.ts — construye la textura del "mapa de mesa" VR uniendo tiles
 * satelitales ESRI (CORS abierto) en un canvas, y expone la proyección
 * Mercator para ubicar pines por lat/lng sobre ese canvas.
 *
 * Colocado en el metaverso (no en lib/ global) porque produce texturas de
 * three.js: solo tiene sentido dentro del Canvas 3D.
 */

export interface GeoBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export interface TileMapData {
  texture: CanvasTexture
  /** alto/ancho del canvas (para dimensionar el plano sin deformar). */
  aspect: number
  /** lat/lng → coordenada UV (0..1) dentro de la textura. */
  toUV: (lat: number, lng: number) => { u: number; v: number }
}

const TILE = 256
const MAX_TILES = 20 // techo de descargas (rendimiento Quest)
const tileUrl = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`

// ── Proyección Web Mercator (lat/lng → coordenada fraccional de tile) ──
const lngToTileX = (lng: number, z: number) => ((lng + 180) / 360) * 2 ** z
const latToTileY = (lat: number, z: number) => {
  const rad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z
}

function loadTile(z: number, x: number, y: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // CORS: necesario para usar el canvas como textura WebGL
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null) // un tile caído no tumba el mapa
    img.src = tileUrl(z, x, y)
  })
}

/**
 * Une los tiles que cubren `bounds` en un canvas y devuelve textura + proyección.
 * Elige el mayor zoom cuyo nº de tiles no pase de MAX_TILES → si mañana el
 * backend manda sitios de TODO Santander, el mapa se aleja solo.
 */
export async function buildTileMap(bounds: GeoBounds): Promise<TileMapData> {
  // Mayor zoom que quepa en el presupuesto de tiles.
  let z = 13
  let x0 = 0
  let x1 = 0
  let y0 = 0
  let y1 = 0
  for (; z >= 8; z--) {
    x0 = Math.floor(lngToTileX(bounds.minLng, z))
    x1 = Math.floor(lngToTileX(bounds.maxLng, z))
    y0 = Math.floor(latToTileY(bounds.maxLat, z)) // lat mayor → tile Y menor
    y1 = Math.floor(latToTileY(bounds.minLat, z))
    if ((x1 - x0 + 1) * (y1 - y0 + 1) <= MAX_TILES) break
  }
  const cols = x1 - x0 + 1
  const rows = y1 - y0 + 1

  const canvas = document.createElement('canvas')
  canvas.width = cols * TILE
  canvas.height = rows * TILE
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0b1220' // fondo si algún tile falla
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const jobs: Promise<void>[] = []
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      jobs.push(
        loadTile(z, tx, ty).then((img) => {
          if (img) ctx.drawImage(img, (tx - x0) * TILE, (ty - y0) * TILE)
        }),
      )
    }
  }
  await Promise.all(jobs)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4

  const zFinal = z
  return {
    texture,
    aspect: canvas.height / canvas.width,
    toUV: (lat, lng) => ({
      u: (lngToTileX(lng, zFinal) - x0) / cols,
      v: (latToTileY(lat, zFinal) - y0) / rows,
    }),
  }
}

/** Bounds que cubren una lista de coordenadas, con margen relativo. */
export function boundsFor(coords: { lat: number; lng: number }[], margin = 0.18): GeoBounds {
  const lats = coords.map((c) => c.lat)
  const lngs = coords.map((c) => c.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const dLat = Math.max((maxLat - minLat) * margin, 0.01)
  const dLng = Math.max((maxLng - minLng) * margin, 0.01)
  return {
    minLat: minLat - dLat,
    maxLat: maxLat + dLat,
    minLng: minLng - dLng,
    maxLng: maxLng + dLng,
  }
}
