/** Ciclo de vida de una locución, para sincronizar con ella (p. ej. el avatar de señas). */
export interface OpcionesHabla {
  /** Idioma de la voz. Por defecto, español de Colombia. */
  lang?: string
  /** Al empezar a sonar (después de cancelar lo anterior). */
  onStart?: () => void
  /** Al terminar, al cancelarse o al fallar. Siempre se llama una vez. */
  onEnd?: () => void
}

/**
 * Lee un texto en voz alta (Web Speech API). Cancela lo anterior para no encimar.
 *
 * Acepta callbacks de ciclo de vida (`onStart`/`onEnd`) para que otra parte de la
 * experiencia pueda seguir la locución —el intérprete de lengua de señas arranca
 * y para con ella—. Son opcionales: las llamadas que no los pasan no cambian.
 *
 * @returns `true` si el navegador puede sintetizar voz (y por tanto `onEnd`
 *   llegará), `false` si no hay soporte (y no sonará ni se llamará ningún callback).
 */
export function speak(text: string, opts: OpcionesHabla = {}): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = opts.lang ?? 'es-CO'
  if (opts.onStart) u.onstart = () => opts.onStart?.()
  if (opts.onEnd) {
    // `end` y `error` son excluyentes y uno de los dos siempre llega (incluso al
    // cancelar); con ambos apuntando al mismo callback, nunca se queda colgado.
    u.onend = () => opts.onEnd?.()
    u.onerror = () => opts.onEnd?.()
  }
  synth.speak(u)
  return true
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}
