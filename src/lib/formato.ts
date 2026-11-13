/**
 * formato.ts — cómo se le enseñan los números al usuario.
 *
 * Centralizado porque las cuatro páginas de catálogo (planes, hospedaje,
 * transporte, artesanías) muestran precios en pesos, y cada una formateándolos
 * a su manera acabaría enseñando "150000", "$150.000" y "150,000 COP" en la
 * misma sesión.
 */

const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0, // el peso no usa centavos en la práctica
})

/** `precio(150000)` → "$ 150.000". Devuelve 'Consultar' si no hay dato. */
export function precio(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return 'Consultar'
  return PESOS.format(valor)
}

/**
 * Distancia legible: `distancia(1)` → "1 km", `distancia(0.8)` → "800 m".
 *
 * Nada de decimales de relleno. "1,0 km" no aporta precisión y, dicho en voz
 * alta, hace daño: el sintetizador lee "uno coma cero kilómetros", que a
 * velocidad normal suena a "UNA HORA cero kilómetros". Un usuario entendió que
 * el orbe le daba un tiempo de viaje de una hora para 1 km.
 */
export function distancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  // Un decimal solo si dice algo: 1,5 sí; 1,0 no.
  const redondeado = Math.round(km * 10) / 10
  return Number.isInteger(redondeado)
    ? `${redondeado} km`
    : `${redondeado.toString().replace('.', ',')} km`
}

/**
 * La misma distancia, para decirla en voz alta: unidades desarrolladas (el
 * sintetizador lee "km" como "ka-eme") y singular cuando toca ("1 kilómetro",
 * no "1 kilómetros").
 */
export function distanciaHablada(km: number): string {
  if (km < 1) {
    const m = Math.round(km * 1000)
    return `${m} ${m === 1 ? 'metro' : 'metros'}`
  }
  const redondeado = Math.round(km * 10) / 10
  const texto = Number.isInteger(redondeado)
    ? String(redondeado)
    : redondeado.toString().replace('.', ',')
  return `${texto} ${redondeado === 1 ? 'kilómetro' : 'kilómetros'}`
}

/** `fechaHora('2026-08-14', '07:30:00')` → "14 ago 2026, 07:30". */
export function fechaHora(fecha: string, hora?: string | null): string {
  // Se parte la cadena en vez de usar new Date('2026-08-14'): eso lo interpreta
  // como UTC y en Colombia (UTC-5) mostraría el día anterior.
  const [a, m, d] = fecha.split('-').map(Number)
  if (!a || !m || !d) return fecha
  const texto = new Date(a, m - 1, d).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return hora ? `${texto}, ${hora.slice(0, 5)}` : texto
}
