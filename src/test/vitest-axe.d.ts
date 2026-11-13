import type { NoViolationsMatcherResult } from 'vitest-axe/matchers'

/**
 * Tipos del matcher `toHaveNoViolations` de vitest-axe para Vitest 4.
 *
 * El paquete trae `vitest-axe/extend-expect`, pero aumenta el espacio de nombres
 * `Vi.Assertion` (estilo antiguo) que Vitest 4 ya no consulta, así que el
 * matcher no quedaba tipado. Aquí se aumenta el módulo `vitest`, que es la vía
 * vigente. El registro en tiempo de ejecución está en src/test/setup.ts.
 */
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): NoViolationsMatcherResult
  }
}
