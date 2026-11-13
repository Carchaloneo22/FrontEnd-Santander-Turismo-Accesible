import { useCallback, useState } from 'react'
import { Hero } from '../../components/sections/Hero/Hero'
import { Container } from '../../components/ui/Container'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { Card } from '../../components/ui/Card'
import { Loader } from '../../components/ui/Loader'
import { Text } from '../../components/ui/Text'
import { useListado } from '../../hooks/useListado'
import { useSEO } from '../../hooks/useSEO'
import { academiaService, type CursoResumen, type CategoriaCurso } from '../../services'
import { CATEGORIAS, duracionLegible, etiquetaCategoria, iconoCategoria } from './presentacion'
import styles from './CursosPage.module.css'

/** Convierte un curso en las props de una tarjeta del catálogo. */
function cursoACard(c: CursoResumen) {
  const duracion = duracionLegible(c.duracionMin)
  return {
    key: c.id,
    imagen: c.portada ?? null,
    imageAlt: `Portada del curso ${c.titulo}`,
    badge: etiquetaCategoria(c.categoria),
    title: c.titulo,
    description: c.descripcion ?? undefined,
    meta: [
      ...(duracion ? [{ icono: '⏱️', texto: duracion }] : []),
      ...(c.totalPasos ? [{ icono: '📘', texto: `${c.totalPasos} lecciones` }] : []),
    ],
    linkTo: `/cursos/${c.slug}`,
    linkLabel: 'Ver curso',
  }
}

/**
 * CursosPage — catálogo PÚBLICO de la academia (/cursos).
 *
 * Formación GRATUITA que acompaña a los prestadores a formalizarse. Lista los
 * cursos con un filtro por categoría (RNT, artesanos, documentos, accesibilidad,
 * general). Consume `GET /cursos?categoria=`; si el backend aún no responde,
 * degrada a un estado vacío honesto ("pronto").
 */
export function CursosPage() {
  useSEO({
    title: 'Academia de formalización — Santander Accesible',
    description:
      'Cursos gratuitos que acompañan a los prestadores turísticos y artesanos de Santander a formalizarse: registro RNT, documentos y accesibilidad.',
  })

  // `''` = todas las categorías. Cambia la función de carga → useListado recarga.
  const [categoria, setCategoria] = useState<CategoriaCurso | ''>('')
  const cargar = useCallback(() => academiaService.cursos(categoria || undefined), [categoria])
  const { datos, cargando, error } = useListado<CursoResumen>(
    cargar,
    'No pudimos cargar los cursos. Inténtalo de nuevo en un momento.',
  )

  return (
    <>
      <Hero
        variant="page"
        eyebrow="Academia · Gratis"
        title="Fórmate y formaliza tu negocio"
        subtitle="Cursos cortos y gratuitos que te acompañan paso a paso: inscríbete en el RNT, reúne tus documentos y haz tu oferta más accesible."
      />

      <Container as="section" maxWidth={1100} className={styles.seccion}>
        <SectionHeader
          title="Cursos disponibles"
          subtitle="Avanza a tu ritmo. Cada curso está dividido en lecciones breves con texto y vídeo."
        />

        {/* Filtro por categoría: grupo de botones accesible (aria-pressed). */}
        <div className={styles.filtros} role="group" aria-label="Filtrar cursos por categoría">
          <button
            type="button"
            className={styles.filtro}
            aria-pressed={categoria === ''}
            data-activo={categoria === ''}
            onClick={() => setCategoria('')}
          >
            Todas
          </button>
          {CATEGORIAS.map((c) => (
            <button
              key={c.valor}
              type="button"
              className={styles.filtro}
              aria-pressed={categoria === c.valor}
              data-activo={categoria === c.valor}
              onClick={() => setCategoria(c.valor)}
            >
              <span aria-hidden="true">{c.icono}</span> {c.etiqueta}
            </button>
          ))}
        </div>

        {cargando ? (
          <Loader label="Cargando cursos" />
        ) : error ? (
          <p className={styles.estado} role="alert">
            {error}
          </p>
        ) : datos.length === 0 ? (
          <div className={styles.vacio}>
            <Text size="lg" muted>
              {categoria
                ? `Aún no hay cursos en la categoría "${etiquetaCategoria(categoria)}".`
                : 'Todavía estamos preparando los cursos de la academia. Vuelve pronto.'}
            </Text>
            {categoria && (
              <button
                type="button"
                className={styles.enlaceAccion}
                onClick={() => setCategoria('')}
              >
                Ver todas las categorías
              </button>
            )}
          </div>
        ) : (
          <ul
            className={styles.rejilla}
            aria-label={`Cursos de ${etiquetaCategoria(categoria) || 'la academia'}`}
          >
            {datos.map((c) => {
              const { key, ...card } = cursoACard(c)
              return (
                <li key={key}>
                  <Card {...card} />
                </li>
              )
            })}
          </ul>
        )}

        <p className={styles.nota}>
          <span aria-hidden="true">{iconoCategoria('general')}</span> ¿Eres prestador o artesano?
          Inicia sesión para marcar tus cursos como completados y seguir tu checklist de
          formalización.
        </p>
      </Container>
    </>
  )
}
