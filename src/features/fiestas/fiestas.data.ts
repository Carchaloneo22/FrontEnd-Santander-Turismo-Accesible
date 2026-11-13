/**
 * Próximas ferias y fiestas de Santander.
 *
 * PLACEHOLDER: hoy es un arreglo estático; el diseño está pensado para que estos
 * datos vengan del backend (fechas reales de la base de datos). Cuando exista el
 * endpoint, reemplazar `FIESTAS` por una llamada al servicio y mantener el mismo
 * tipo `Fiesta` + `proximaFiesta()`.
 */
export interface Fiesta {
  id: string
  nombre: string
  municipio: string
  /** Fechas ISO (YYYY-MM-DD). */
  desde: string
  hasta: string
  descripcion: string
  imagen: string
  enlace?: string
}

export const FIESTAS: Fiesta[] = [
  {
    id: 'festival-bocadillo-velez',
    nombre: 'Festival del Bocadillo Veleño',
    municipio: 'Vélez',
    desde: '2026-08-08',
    hasta: '2026-08-11',
    descripcion:
      'Guabina, torbellino y el dulce más famoso de Santander en la capital folclórica del departamento.',
    imagen: 'https://picsum.photos/seed/fiesta-bocadillo-velez/900/600',
    enlace: '/',
  },
  {
    id: 'feria-bonita-bucaramanga',
    nombre: 'Ferias y Fiestas de Bucaramanga',
    municipio: 'Bucaramanga',
    desde: '2026-09-11',
    hasta: '2026-09-20',
    descripcion:
      'La Feria Bonita llena a Bucaramanga de música, danza, gastronomía y cultura. Una celebración pensada para disfrutarse por todas las personas, con espacios accesibles.',
    imagen: 'https://picsum.photos/seed/fiesta-feria-bonita/900/600',
    enlace: '/',
  },
  {
    id: 'festival-turismo-santander',
    nombre: 'Festival Internacional de Turismo',
    municipio: 'Bucaramanga',
    desde: '2026-10-02',
    hasta: '2026-10-05',
    descripcion:
      'Encuentro de turismo, negocios y cultura (MICE): ruedas de negocio, muestras y experiencias para todos.',
    imagen: 'https://picsum.photos/seed/fiesta-festival-turismo/900/600',
    enlace: '/',
  },
  {
    id: 'giron-navideno',
    nombre: 'Girón Navideño',
    municipio: 'Girón',
    desde: '2026-12-07',
    hasta: '2026-12-16',
    descripcion:
      'El pueblo patrimonio se ilumina: alumbrado, novenas y tradición en sus calles blancas coloniales.',
    imagen: 'https://picsum.photos/seed/fiesta-giron-navideno/900/600',
    enlace: '/',
  },
]

/** Próximas fiestas (las que no han terminado), ordenadas por fecha de inicio. */
export function proximasFiestas(hoy: Date = new Date()): Fiesta[] {
  const hoyIso = hoy.toISOString().slice(0, 10)
  const vigentes = FIESTAS.filter((f) => f.hasta >= hoyIso).sort((a, b) =>
    a.desde.localeCompare(b.desde),
  )
  return vigentes.length > 0 ? vigentes : FIESTAS
}

/**
 * Devuelve la próxima fiesta (la primera cuyo fin no ha pasado); si todas
 * pasaron, la más próxima del arreglo. `null` si no hay ninguna.
 */
export function proximaFiesta(hoy: Date = new Date()): Fiesta | null {
  if (FIESTAS.length === 0) return null
  const hoyIso = hoy.toISOString().slice(0, 10)
  const vigentes = FIESTAS.filter((f) => f.hasta >= hoyIso).sort((a, b) =>
    a.desde.localeCompare(b.desde),
  )
  return vigentes[0] ?? FIESTAS[0]
}

/** Formatea el rango de fechas en español: "Del 11 al 20 de septiembre de 2026". */
export function formatearRango(desde: string, hasta: string): string {
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ]
  const [ay, am, ad] = desde.split('-').map(Number)
  const [by, bm, bd] = hasta.split('-').map(Number)
  const mesA = meses[am - 1]
  const mesB = meses[bm - 1]
  if (am === bm && ay === by) return `Del ${ad} al ${bd} de ${mesB} de ${by}`
  if (ay === by) return `Del ${ad} de ${mesA} al ${bd} de ${mesB} de ${by}`
  return `Del ${ad} de ${mesA} de ${ay} al ${bd} de ${mesB} de ${by}`
}
