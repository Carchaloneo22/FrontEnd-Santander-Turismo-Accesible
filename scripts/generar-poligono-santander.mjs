// scripts/generar-poligono-santander.mjs
/**
 * Regenera el contorno del departamento de Santander (public/data/santander-poligono.json)
 * como la UNIÓN (disolución) de los 87 polígonos de municipios de
 * public/data/santander-municipios.json.
 *
 * Por qué: el polígono anterior (fuente john-guerra) era inexacto y recortaba
 * municipios/pueblos enteros del borde. La capa de municipios SÍ es correcta
 * (la usa la página de Municipios), así que el contorno exacto del departamento
 * es la unión de todos sus municipios.
 *
 * Uso:
 *   node scripts/generar-poligono-santander.mjs
 *
 * Verificación integrada: tras construir la unión, comprueba que el centroide de
 * CADA municipio cae DENTRO del polígono resultante. Si alguno queda fuera, el
 * script falla (exit 1) y NO escribe el archivo.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { union } from '@turf/union'
import centroid from '@turf/centroid'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { featureCollection } from '@turf/helpers'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(__dirname, '..')
const ENTRADA = resolve(RAIZ, 'public/data/santander-municipios.json')
const SALIDA = resolve(RAIZ, 'public/data/santander-poligono.json')

const municipios = JSON.parse(readFileSync(ENTRADA, 'utf8'))
const features = municipios.features ?? []
if (features.length === 0) {
  console.error('No hay features de municipios en', ENTRADA)
  process.exit(1)
}
console.log(`Municipios de entrada: ${features.length}`)

// Unión (disolución) de todos los polígonos de municipios en un solo contorno.
// @turf/union v7 acepta una FeatureCollection de Polygon|MultiPolygon.
const unido = union(featureCollection(features))
if (!unido) {
  console.error('La unión devolvió null: revisa la geometría de entrada.')
  process.exit(1)
}

const salida = {
  type: 'Feature',
  properties: {
    nombre: 'Departamento de Santander',
    fuente:
      'Unión (disolución) de los 87 municipios de santander-municipios.json (DANE Marco Geoestadístico Nacional, DPTO 68), generada por scripts/generar-poligono-santander.mjs',
  },
  geometry: unido.geometry,
}

// ── Verificación: ningún municipio queda fuera del contorno ──
// Antes el bug dejaba pueblos afuera; ahora cada centroide debe caer DENTRO.
const fuera = []
for (const m of features) {
  const c = centroid(m)
  if (!booleanPointInPolygon(c, salida)) {
    fuera.push(m.properties?.nombre ?? m.properties?.codigoDane ?? '(sin nombre)')
  }
}

const anillos =
  salida.geometry.type === 'MultiPolygon'
    ? salida.geometry.coordinates.length
    : 1
console.log(`Contorno: ${salida.geometry.type} (${anillos} parte/s)`)

if (fuera.length > 0) {
  console.error(`✗ ${fuera.length} municipio/s quedaron FUERA del contorno:`)
  console.error('  ' + fuera.join(', '))
  process.exit(1)
}

writeFileSync(SALIDA, JSON.stringify(salida) + '\n', 'utf8')
console.log(`✓ Verificación OK: los ${features.length} centroides caen dentro del contorno.`)
console.log(`✓ Escrito ${SALIDA}`)
