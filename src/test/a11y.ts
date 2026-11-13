import { configureAxe } from 'vitest-axe'

/**
 * Auditoría de accesibilidad automática — WCAG 2.1 nivel AA.
 *
 * Cierra LEGAL-02 de la auditoría (Resolución MinTIC 1519 de 2020, que exige
 * conformidad WCAG 2.1 AA verificable en los sitios del Estado colombiano).
 *
 * `axe` está acotado a las reglas de las normas WCAG 2.0/2.1 niveles A y AA.
 * Deja fuera las reglas "best-practice" de axe (p. ej. `region`,
 * `heading-order`), que son recomendaciones y no criterios de conformidad: así
 * los tests fallan solo ante incumplimientos reales de la norma declarada.
 *
 * LÍMITE CONOCIDO — contraste de color: axe necesita el layout y los estilos
 * computados reales del navegador para medir el contraste (criterio 1.4.3). En
 * jsdom no hay render visual, así que esa regla queda "incompleta", no se puede
 * verificar aquí y se cubre por revisión manual (ver la Declaración de
 * accesibilidad y el doc de auditoría).
 *
 * Uso:
 *   const resultado = await axe(container)
 *   expect(resultado).toHaveNoViolations()
 */
export const axe = configureAxe({
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  },
  // No descender a los iframes embebidos (p. ej. el mini-mapa de las fichas):
  // axe no puede auditar entre marcos dentro de jsdom y lanzaría un error de
  // "frame". El iframe en sí sí se audita en el documento padre (debe llevar
  // `title`); su contenido es de terceros (OpenStreetMap) y se revisa aparte.
  iframes: false,
})
