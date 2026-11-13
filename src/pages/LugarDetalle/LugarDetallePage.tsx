import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Heading } from '../../components/ui/Heading'
import { Text } from '../../components/ui/Text'
import { Badge } from '../../components/ui/Badge'
import { Loader } from '../../components/ui/Loader'
import { FotoConCredito } from '../../components/ui/FotoConCredito'
import { MiniMapa } from '../../components/ui/MiniMapa'
import {
  DetalleShell,
  EstadoError,
  AccesibilidadPanel,
  ContactoBloque,
  dimensionesLugar,
} from '../../features/detalle'
import { lugaresService } from '../../services'
import { useRecurso } from '../../hooks/useRecurso'
import { useSEO } from '../../hooks/useSEO'
import styles from './LugarDetallePage.module.css'

/** "atractivo_turistico" → "Atractivo turístico". */
function tipoLegible(tipo: string): string {
  const t = tipo.replace(/_/g, ' ').trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/**
 * LugarDetallePage — ficha de un lugar turístico (/lugares/:slug).
 *
 * Consume el backend real (`GET /api/v1/lugares/:slug`), que es el módulo más
 * completo: foto con crédito CC, descripción, historia, accesibilidad por
 * dimensión, modalidades, municipio y coordenadas. El mini-mapa solo aparece si
 * el lugar tiene coordenadas (muchos aún no están geocodificados).
 *
 * El estado se reinicia con `key={slug}` en la ruta (ver App.tsx): useRecurso no
 * se reinicia solo, así que al pasar de un lugar a otro React remonta la página.
 */
export function LugarDetallePage() {
  const { slug } = useParams<{ slug: string }>()

  const cargar = useCallback(() => lugaresService.detalle(slug ?? ''), [slug])
  const { dato: lugar, cargando, error } = useRecurso(cargar, 'No se pudo cargar el lugar.')

  const dimensiones = useMemo(() => (lugar ? dimensionesLugar(lugar.accesibilidad) : []), [lugar])

  useSEO({
    title: lugar ? lugar.nombre : 'Lugar',
    description: lugar?.descripcion,
    path: `/lugares/${slug ?? ''}`,
    image: lugar?.imagen?.url,
    type: 'article',
  })

  if (cargando) return <Loader label="Cargando lugar" />

  if (error || !lugar) {
    return (
      <EstadoError
        titulo="Lugar no encontrado"
        mensaje={error}
        mensajePorDefecto="El lugar que buscas no existe o aún no está publicado."
        volverA="/"
        volverEtiqueta="Volver al inicio"
      />
    )
  }

  const municipioPrincipal =
    lugar.municipios.find((m) => m.principal)?.nombre ?? lugar.municipios[0]?.nombre ?? null

  return (
    <DetalleShell
      migas={[{ etiqueta: 'Inicio', a: '/' }, { etiqueta: lugar.nombre }]}
      volverA="/"
      volverEtiqueta="Volver al inicio"
    >
      <header className={styles.cabecera}>
        <FotoConCredito
          imagen={lugar.imagen}
          alt={`Foto de ${lugar.nombre}`}
          className={styles.foto}
        />
        <div className={styles.titulares}>
          <Heading level={1} size={2}>
            {lugar.nombre}
          </Heading>
          <ul className={styles.etiquetas} aria-label="Clasificación del lugar">
            <li>
              <Badge variant="neutral">{tipoLegible(lugar.tipo)}</Badge>
            </li>
            {municipioPrincipal && (
              <li>
                <Badge variant="neutral" aria-label={`Municipio: ${municipioPrincipal}`}>
                  <span aria-hidden="true">📍</span> {municipioPrincipal}
                </Badge>
              </li>
            )}
            {lugar.modalidades.map((m) => (
              <li key={m.id}>
                <Badge variant="primary">{m.nombre}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <section className={styles.bloque} aria-label="Descripción">
        <Text size="lg">{lugar.descripcion}</Text>
      </section>

      {lugar.historia && (
        <section className={styles.bloque} aria-labelledby="historia-titulo">
          <Heading level={2} size={4} id="historia-titulo">
            Historia
          </Heading>
          <Text>{lugar.historia}</Text>
        </section>
      )}

      <AccesibilidadPanel dimensiones={dimensiones} titulo="Accesibilidad" />

      <section className={styles.ubicacion} aria-labelledby="ubicacion-titulo">
        <Heading level={2} size={4} id="ubicacion-titulo">
          Cómo llegar y contacto
        </Heading>
        <div className={styles.ubicacionGrid}>
          <ContactoBloque
            telefono={lugar.telefono}
            sitioWeb={lugar.sitioWeb}
            direccion={
              lugar.direccion ?? (municipioPrincipal ? `${municipioPrincipal}, Santander` : null)
            }
            vacioMensaje="Este lugar aún no tiene datos de contacto publicados. Consulta el municipio o la casa de cultura local."
          />
          {lugar.latitud != null && lugar.longitud != null && (
            <MiniMapa
              lat={lugar.latitud}
              lng={lugar.longitud}
              nombre={lugar.nombre}
              direccion={lugar.direccion}
            />
          )}
        </div>
      </section>
    </DetalleShell>
  )
}
