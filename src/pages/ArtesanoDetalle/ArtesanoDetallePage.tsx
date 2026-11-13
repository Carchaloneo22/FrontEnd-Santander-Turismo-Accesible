import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Heading } from '../../components/ui/Heading'
import { Text } from '../../components/ui/Text'
import { Badge } from '../../components/ui/Badge'
import { Loader } from '../../components/ui/Loader'
import { FotoConCredito } from '../../components/ui/FotoConCredito'
import type { ImagenLugar } from '../../services/LugaresService'
import { DetalleShell, EstadoError, ContactoBloque } from '../../features/detalle'
import { artesanosService, type Artesano } from '../../services'
import { useRecurso } from '../../hooks/useRecurso'
import { useSEO } from '../../hooks/useSEO'
import styles from './ArtesanoDetallePage.module.css'

/** Normaliza la imagen del artesano al shape que espera FotoConCredito. */
function aImagen(img: Artesano['imagen']): ImagenLugar | null {
  if (!img?.url) return null
  return {
    url: img.url,
    credito: img.credito ?? null,
    licencia: img.licencia ?? null,
    fuente: img.fuente ?? null,
  }
}

/**
 * ArtesanoDetallePage — perfil de un artesano para contactarlo (/artesanos/:slug).
 *
 * ── Importante sobre el backend ──
 * Hoy el backend tiene `/artesanos` y `/artesanos/:slug` PROTEGIDOS (responde
 * `NO_AUTENTICADO`): solo existe el self-service `/artesanos/yo`. Aún NO hay
 * directorio público de artesanos. La página consume el contrato que el backend
 * expondrá al abrirlo (ver ArtesanosService) y, mientras siga protegido o el
 * artesano no exista, muestra un estado HONESTO en vez de fingir un perfil. En
 * cuanto el backend publique el endpoint, la ficha funciona sin cambios.
 */
export function ArtesanoDetallePage() {
  const { slug } = useParams<{ slug: string }>()

  const cargar = useCallback(() => artesanosService.detalle(slug ?? ''), [slug])
  const {
    dato: artesano,
    cargando,
    error,
  } = useRecurso(cargar, 'No se pudo cargar el perfil del artesano.')

  useSEO({
    title: artesano ? artesano.nombre : 'Artesano',
    description: artesano?.biografia ?? undefined,
    path: `/artesanos/${slug ?? ''}`,
    type: 'article',
  })

  if (cargando) return <Loader label="Cargando perfil del artesano" />

  if (error || !artesano) {
    return (
      <EstadoError
        titulo="Perfil no disponible"
        // No se muestra el mensaje crudo del backend ("Debes iniciar sesión"),
        // que confundiría al visitante: el directorio de artesanos todavía se
        // está habilitando públicamente.
        mensajePorDefecto="Aún no podemos mostrar este perfil de artesano. El directorio público de artesanos de Santander se está habilitando; vuelve pronto para conocer y contactar a los artesanos del departamento."
        volverA="/artesanias"
        volverEtiqueta="Ver artesanías"
      />
    )
  }

  const especialidades = artesano.especialidades ?? []
  const productos = artesano.productos ?? []

  return (
    <DetalleShell
      migas={[
        { etiqueta: 'Inicio', a: '/' },
        { etiqueta: 'Artesanías', a: '/artesanias' },
        { etiqueta: artesano.nombre },
      ]}
      volverA="/artesanias"
      volverEtiqueta="Ver artesanías"
    >
      <header className={styles.cabecera}>
        <FotoConCredito
          imagen={aImagen(artesano.imagen)}
          alt={`Foto de ${artesano.nombre}`}
          className={styles.foto}
        />
        <div className={styles.titulares}>
          <Heading level={1} size={2}>
            {artesano.nombre}
          </Heading>
          <ul className={styles.etiquetas} aria-label="Datos del artesano">
            {artesano.oficio && (
              <li>
                <Badge variant="primary">{artesano.oficio}</Badge>
              </li>
            )}
            {artesano.municipio && (
              <li>
                <Badge variant="neutral" aria-label={`Municipio: ${artesano.municipio}`}>
                  <span aria-hidden="true">📍</span> {artesano.municipio}
                </Badge>
              </li>
            )}
          </ul>
        </div>
      </header>

      {artesano.biografia && (
        <section className={styles.bloque} aria-label="Sobre el artesano">
          <Text size="lg">{artesano.biografia}</Text>
        </section>
      )}

      {especialidades.length > 0 && (
        <section className={styles.bloque} aria-labelledby="especialidades-titulo">
          <Heading level={2} size={4} id="especialidades-titulo">
            Especialidades
          </Heading>
          <ul className={styles.etiquetas}>
            {especialidades.map((e) => (
              <li key={e}>
                <Badge variant="neutral">{e}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {productos.length > 0 && (
        <section className={styles.bloque} aria-labelledby="productos-titulo">
          <Heading level={2} size={4} id="productos-titulo">
            Productos
          </Heading>
          <ul className={styles.productos}>
            {productos.map((p, i) => (
              <li key={p.id ?? `${p.nombre}-${i}`} className={styles.producto}>
                <FotoConCredito
                  imagen={aImagen(p.imagen)}
                  alt={`Producto: ${p.nombre}`}
                  className={styles.productoFoto}
                />
                <div>
                  <Text as="h3" weight="semibold">
                    {p.nombre}
                  </Text>
                  {p.descripcion && (
                    <Text size="sm" muted>
                      {p.descripcion}
                    </Text>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.contacto} aria-labelledby="contacto-titulo">
        <Heading level={2} size={4} id="contacto-titulo">
          Contacto
        </Heading>
        <ContactoBloque
          telefono={artesano.contacto?.telefono}
          whatsapp={artesano.contacto?.whatsapp}
          email={artesano.contacto?.email}
          sitioWeb={artesano.contacto?.sitioWeb}
          vacioMensaje={`${artesano.nombre} aún no publicó datos de contacto directo. La plataforma conecta a los artesanos con quienes quieren apoyar su trabajo.`}
        />
      </section>
    </DetalleShell>
  )
}
