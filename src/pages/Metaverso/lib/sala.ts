import type { Destino } from '../../../features/destinos'
import { PIEZA_ANCHO, PIEZA_ALTO } from '../components/PanelTarjeta'

/**
 * sala.ts — geometría de la casa santandereana y reparto de los municipios.
 *
 * La casa se construye por BAHÍAS: tramos de muro iguales entre columnas, como
 * en una casa colonial de verdad. Un municipio grande no recibe un muro más
 * largo (entonces la casa no cerraría), sino VARIAS BAHÍAS SEGUIDAS. Los dos
 * muros largos siempre tienen el mismo número de bahías —las que sobran quedan
 * libres para presentar lo que se quiera—, así que la planta cierra perfecta.
 *
 * El visitante se acerca a cada sección por teletransporte (un nodo en el piso).
 * Alturas según la regla museística de las 57 pulgadas: centro a ~1.45 m.
 */

/**
 * ── La geometría es un DATO, no una constante ──
 *
 * Toda la casa se describe con estos quince números, y vienen de la base
 * (METAVERSO_SALAS, una fila por sala). Antes estaban aquí escritos a mano, así
 * que mover una puerta era recompilar y volver a desplegar; y una sala nueva con
 * otras medidas era imposible sin duplicar el módulo.
 *
 * Las funciones de este archivo reciben la geometría como PARÁMETRO en vez de
 * leerla de un global mutable: así siguen siendo puras —dos salas distintas
 * pueden calcularse a la vez sin pisarse— y se pueden probar dándoles números.
 */
export interface Geometria {
  /** Tramo de muro entre columnas. Un municipio grande ocupa varias bahías. */
  anchoBahia: number
  /** Separación entre los dos muros largos. */
  ancho: number
  altoSala: number
  /** Centro del cuadro sobre el piso: la regla museística de las 57 pulgadas. */
  alturaObra: number
  columnasArriba: number
  columnasAbajo: number
  /** El cuadro se cuelga por delante del muro (su marco tiene 6 cm de fondo). */
  margenMuro: number
  /** A qué distancia del muro queda el nodo desde el que se contempla. */
  distNodo: number
  puertaAncho: number
  puertaAlto: number
  /**
   * Posición de la puerta en el marco local del muro corto. Va arrimada a un
   * extremo y no al centro: como se cruza tocándola y NO tiene nodo en el piso,
   * estar en un rincón no le estorba a nadie, y así le deja el eje del pasillo
   * al televisor. Como los dos muros miran en sentidos opuestos, el mismo número
   * deja las puertas en esquinas opuestas.
   */
  puertaX: number
  tvAltura: number
  tvAncho: number
  tvSepMuro: number
  distNodoTv: number
}

/**
 * Los valores con los que se construyó la casa, afinados dentro del visor.
 *
 * Son el RESPALDO, no la fuente: si la API no responde, el metaverso se levanta
 * igual con estos. Es el mismo principio que ya sigue `aplicarPanoramicas`: la
 * experiencia VR no puede depender de que el backend esté vivo.
 *
 * Coinciden con los DEFAULT de METAVERSO_SALAS (db/migracion_metaverso_8.sql).
 */
export const GEOMETRIA_DEFECTO: Geometria = {
  anchoBahia: 4.4,
  ancho: 9,
  altoSala: 3.8,
  alturaObra: 1.45,
  columnasArriba: 3,
  columnasAbajo: 2,
  margenMuro: 0.09,
  distNodo: 2.8,
  puertaAncho: 1.5,
  puertaAlto: 2.45,
  puertaX: -3.2,
  tvAltura: 1.75,
  tvAncho: 3,
  tvSepMuro: 0.07,
  distNodoTv: 3,
}

/** Mitad del ancho: el z de cada muro largo. Se usa en casi todos los cálculos. */
const medioAncho = (g: Geometria) => g.ancho / 2
/** Cuántas piezas caben en una bahía. */
const capacidadBahia = (g: Geometria) => g.columnasArriba + g.columnasAbajo

// Aire entre piezas y, sobre todo, entre la fila y las columnas de la bahía:
// pegadas al canto la pared se leía apretada, sin respiro.
//
// Estos dos NO están en la base: salen del tamaño del marco (PIEZA_ANCHO), que
// es cosa del componente que lo dibuja, no de las medidas del edificio. Meterlos
// en METAVERSO_SALAS dejaría configurar por separado el marco y su hueco, y
// bastaría con descuadrarlos para que los cuadros se solaparan.
const SEP_COL = PIEZA_ANCHO + 0.26
const SEP_FILA = PIEZA_ALTO + 0.16

export interface Seccion {
  /** Índice del municipio, o -1 si la sección está libre. */
  destino: number
  /** 0 = muro norte (z negativo); 1 = muro sur (z positivo). */
  muro: 0 | 1
  /** Centro X de cada bahía que ocupa (una sección puede ocupar varias). */
  centrosBahia: number[]
  /** Centro X del conjunto (para la placa y el nodo). */
  centroX: number
}

export interface Distribucion {
  largo: number
  bahiasPorMuro: number
  secciones: Seccion[]
}

/** Reparte `n` piezas entre `b` bahías lo más parejo posible: 13 en 3 → 5,4,4. */
function repartir(n: number, b: number): number[] {
  const base = Math.floor(n / b)
  const resto = n % b
  return Array.from({ length: b }, (_, k) => base + (k < resto ? 1 : 0))
}

/**
 * Asigna bahías a cada municipio según su tamaño y las reparte entre los dos
 * muros largos, igualando el número de bahías de cada muro (las que falten se
 * añaden como secciones libres) para que la casa cierre.
 */
export function distribuir(conteos: number[], g: Geometria = GEOMETRIA_DEFECTO): Distribucion {
  const items = conteos.map((n, destino) => ({
    destino,
    bahias: Math.max(1, Math.ceil(n / capacidadBahia(g))),
  }))

  const bahiasDe = (g: (typeof items)[number][]) => g.reduce((s, it) => s + it.bahias, 0)

  // ── Repartir los municipios entre los dos muros ──
  //
  // Es un problema de PARTICIÓN: hay que dividir los municipios en dos grupos
  // que sumen lo más parecido posible, porque el muro corto se rellena con
  // bahías vacías hasta igualar al largo. Cada bahía de diferencia es una bahía
  // vacía de más.
  //
  // Antes se cortaba la lista EN ORDEN por donde se acumulaba la mitad, y eso
  // no reparte: solo busca dónde partir sin mover a nadie. Con las bahías
  // reales [1,2,3,1,1] cortaba en 6 contra 2 —el peor corte posible salvo uno—,
  // y el muro sur acababa con SEIS bahías vacías seguidas: media casa de 35 m
  // sin un cuadro.
  //
  // Codicioso: el municipio más grande primero, y cada uno al muro que va más
  // ligero. Para dos grupos y estos tamaños da el óptimo (4 y 4), y así las
  // únicas bahías vacías son las dos reservadas de cada muro.
  const grupos: { destino: number; bahias: number }[][] = [[], []]
  for (const it of [...items].sort((a, b) => b.bahias - a.bahias)) {
    grupos[bahiasDe(grupos[0]) <= bahiasDe(grupos[1]) ? 0 : 1].push(it)
  }
  // Dentro de cada muro se recupera el orden del catálogo: repartir por tamaño
  // es cosa de la planta, pero recorrer el muro y encontrarse los municipios
  // ordenados de mayor a menor se leería como un ranking.
  for (const g of grupos) g.sort((a, b) => a.destino - b.destino)
  // Los dos muros deben tener las MISMAS bahías: si no, la casa no cerraría.
  // Se reservan DOS libres: una a cada extremo, junto a los muros cortos. Ahí no
  // va ningún municipio —ni su nodo—, así que el rincón de la puerta y el del
  // televisor quedan despejados y las bahías libres se pueden decorar.
  const bahiasPorMuro = Math.max(bahiasDe(grupos[0]), bahiasDe(grupos[1])) + 2
  for (const g of grupos) {
    const faltan = bahiasPorMuro - bahiasDe(g)
    g.unshift({ destino: -1, bahias: 1 })
    for (let k = 1; k < faltan; k++) g.push({ destino: -1, bahias: 1 })
  }

  const largo = bahiasPorMuro * g.anchoBahia
  const centroDeBahia = (i: number) => (i + 0.5 - bahiasPorMuro / 2) * g.anchoBahia

  const secciones: Seccion[] = []
  grupos.forEach((grupo, muro) => {
    let bahia = 0
    for (const it of grupo) {
      const centrosBahia = Array.from({ length: it.bahias }, (_, k) => centroDeBahia(bahia + k))
      secciones.push({
        destino: it.destino,
        muro: muro as 0 | 1,
        centrosBahia,
        centroX: centrosBahia.reduce((s, c) => s + c, 0) / centrosBahia.length,
      })
      bahia += it.bahias
    }
  })

  return { largo, bahiasPorMuro, secciones }
}

/** Centro de la ficha de contemplación: a la altura de los ojos. */
const ALTURA_FICHA = 1.6
/**
 * Se planta a 0.8 m del muro; el visitante está a 2.8 m, así que la ve a 2 m:
 * sus 3.05 m de ancho abarcan 74°, que llena la vista sin obligar a barrer la
 * cabeza para leerla.
 */
const DIST_FICHA = 0.8

/**
 * Dónde se planta la ficha de un sitio: centrada frente a la BAHÍA donde cuelga
 * su cuadro. Antes se anclaba a la dirección de la mirada y aparecía atravesada
 * sobre el piso, sin relación con la pared de su municipio.
 */
export function posicionFicha(
  muro: 0 | 1,
  bahiaX: number,
  g: Geometria = GEOMETRIA_DEFECTO,
): [number, number, number] {
  const m = medioAncho(g)
  const z = muro === 0 ? -m + DIST_FICHA : m - DIST_FICHA
  return [bahiaX, ALTURA_FICHA, z]
}

/** Bahía de la sección en la que cae `x` (el cuadro elegido). */
export function bahiaDe(s: Seccion, x: number): number {
  return s.centrosBahia.reduce((mejor, c) => (Math.abs(c - x) < Math.abs(mejor - x) ? c : mejor))
}

export function zDeMuro(muro: 0 | 1, g: Geometria = GEOMETRIA_DEFECTO): number {
  return muro === 0 ? -medioAncho(g) : medioAncho(g)
}

/** Rotación para que el contenido mire hacia dentro de la casa. */
export function rotYDeMuro(muro: 0 | 1): number {
  return muro === 0 ? 0 : Math.PI
}

export interface UbicacionPantalla {
  indice: number
  position: [number, number, number]
  rotY: number
  /** Dónde se para el visitante para verla —y oírla— de frente. */
  nodo: [number, number, number]
}

/** Coloca los televisores en los dos muros cortos, que no exponen obra. */
export function ubicarPantallas(
  largo: number,
  cuantas: number,
  g: Geometria = GEOMETRIA_DEFECTO,
): UbicacionPantalla[] {
  const medioLargo = largo / 2
  return Array.from({ length: Math.min(cuantas, 2) }, (_, indice) => {
    const lado = indice === 0 ? -1 : 1
    return {
      indice,
      position: [lado * (medioLargo - g.tvSepMuro), g.tvAltura, 0],
      // Girar la pantalla para que mire hacia dentro y girar al visitante para
      // que la mire a ella es, en esta sala, el mismo ángulo.
      rotY: (-lado * Math.PI) / 2,
      nodo: [lado * (medioLargo - g.distNodoTv), 0, 0],
    }
  })
}

/** Los muros cortos: dónde va cada uno y hacia dónde mira. */
export function murosCortos(largo: number): { lado: -1 | 1; x: number; rotY: number }[] {
  return [-1 as const, 1 as const].map((lado) => ({
    lado,
    x: lado * (largo / 2),
    rotY: (-lado * Math.PI) / 2,
  }))
}

/**
 * Un sitio donde el visitante puede pararse. Hay uno por CADA bahía —no uno por
 * municipio—: con un solo nodo, las bahías lejanas de una misma ciudad quedaban
 * de refilón y costaba mirarlas y acertarles. También hay uno frente a cada
 * televisor (ahí es donde se oye su video) y uno en el centro, para verlo todo.
 */
export interface Parada {
  id: string
  posicion: [number, number, number]
  /** Rumbo al llegar (0 = mirando hacia -Z). */
  yaw: number
  /** Municipio, si la parada mira a una bahía de exposición. */
  seccion: Seccion | null
  /** Índice del televisor, si la parada mira a una pantalla. */
  pantalla: number | null
}

/**
 * Genera la lista oficial de paradas (puntos de teletransporte) en el piso.
 * Integra las bahías de municipios, pantallas y nodos culturales en cada centro de sección.
 */
export function paradasDe(
  d: Distribucion,
  cuantasPantallas: number,
  g: Geometria = GEOMETRIA_DEFECTO,
): Parada[] {
  const paradas: Parada[] = [
    { id: 'centro', posicion: [0, 0, 0], yaw: 0, seccion: null, pantalla: null },
  ]
  const m = medioAncho(g)

  // 1. Nodos por cada sección de la distribución (tanto Municipios como Exposición Cultural)
  for (const seccion of d.secciones) {
    const z = seccion.muro === 0 ? -m + g.distNodo : m - g.distNodo

    if (seccion.destino >= 0) {
      // Nodos individuales para las bahías con municipios
      for (const x of seccion.centrosBahia) {
        paradas.push({
          id: `bahia:${seccion.muro}:${x.toFixed(2)}`,
          posicion: [x, 0, z],
          yaw: rotYDeMuro(seccion.muro),
          seccion,
          pantalla: null,
        })
      }
    } else {
      // Nodos para las secciones de Cuadros Culturales (se ubican en el centroX exacto del muro)
      paradas.push({
        id: `cultural:${seccion.muro}:${seccion.centroX.toFixed(2)}`,
        posicion: [seccion.centroX, 0, z],
        yaw: rotYDeMuro(seccion.muro),
        seccion,
        pantalla: null,
      })
    }
  }

  // 2. Nodos por pantallas multimedia (TVs)
  for (const p of ubicarPantallas(d.largo, cuantasPantallas, g)) {
    paradas.push({
      id: `pantalla:${p.indice}`,
      posicion: p.nodo,
      yaw: p.rotY,
      seccion: null,
      pantalla: p.indice,
    })
  }

  return paradas
}

export interface Colocacion {
  position: [number, number, number]
  rotY: number
}

/**
 * Reparte `n` piezas por las bahías de su sección. TODAS las bahías se cuelgan
 * igual —3 arriba y 2 abajo, centradas—, así que un municipio grande se lee como
 * varias bahías seguidas con el mismo ritmo, no como un amontonamiento.
 */
export function colocarEnSeccion(
  n: number,
  s: Seccion,
  g: Geometria = GEOMETRIA_DEFECTO,
): Colocacion[] {
  const zMuro = zDeMuro(s.muro, g)
  const dz = s.muro === 0 ? g.margenMuro : -g.margenMuro
  // Las columnas avanzan en +X en el norte y en -X en el sur (para leer igual).
  const dirX = s.muro === 0 ? 1 : -1
  const rotY = rotYDeMuro(s.muro)

  const porBahia = repartir(n, s.centrosBahia.length)
  const out: Colocacion[] = []

  s.centrosBahia.forEach((centro, b) => {
    const cuantas = porBahia[b]
    const arriba = Math.min(g.columnasArriba, cuantas)
    const abajo = Math.min(g.columnasAbajo, cuantas - arriba)
    const filas = abajo > 0 ? [arriba, abajo] : [arriba]

    filas.forEach((enEstaFila, fila) => {
      const y = g.alturaObra + ((filas.length - 1) / 2) * SEP_FILA - fila * SEP_FILA
      for (let col = 0; col < enEstaFila; col++) {
        const u = (col - (enEstaFila - 1) / 2) * SEP_COL * dirX
        out.push({ position: [centro + u, y, zMuro + dz], rotY })
      }
    })
  })
  return out
}

/**
 * Parada que pide la URL: la PRIMERA bahía del municipio (desde ahí se salta a
 * las demás). Sin municipio, o si no existe, el centro de la casa.
 */
export function paradaDe(paradas: Parada[], destinos: Destino[], slug: string | undefined): Parada {
  const centro = paradas[0]
  if (!slug) return centro
  const i = destinos.findIndex((d) => d.slug === slug)
  if (i < 0) return centro
  return paradas.find((p) => p.seccion?.destino === i) ?? centro
}
