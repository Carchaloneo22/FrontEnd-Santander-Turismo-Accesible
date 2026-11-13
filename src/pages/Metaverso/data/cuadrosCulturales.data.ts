import { CuadroCulturalModel } from '../models/CuadroCulturalModel'

export const CUADROS_CULTURALES_REGISTRO: CuadroCulturalModel[] = [
  new CuadroCulturalModel({
    id: 'mapa-santander',
    titulo: 'Mapa Santander',
    subtitulo: 'EXPOSICIÓN CULTURAL',
    urlImagen: '/img/metaverso/Mapa_Santander.webp',
    descripcion:
      'Una representación elegante del departamento de Santander que muestra la división de sus municipios, resaltando su geografía y organización territorial. Es una pieza que invita a reconocer la amplitud y diversidad del territorio santandereano, convirtiéndose en un homenaje a la tierra que da origen a su historia y cultura.',
    seccionBusqueda: 'piedecuesta',
    offsetBahia: 1,
    muroDefault: 0,
  }),
  new CuadroCulturalModel({
    id: 'Mascaras indigenas',
    titulo: 'Máscaras Indígenas',
    subtitulo: 'EXPOSICIÓN CULTURAL',
    urlImagen: '/img/metaverso/Mascaras_Indigenas.webp',
    descripcion:
      'Un reconocimiento a los pueblos indígenas que han dejado una huella invaluable en la historia de Santander. Este cuadro presenta máscaras inspiradas en diferentes comunidades ancestrales, simbolizando sus creencias, expresiones artísticas y legado cultural, como reflejo del patrimonio vivo que aún permanece en la región.',
    seccionBusqueda: 'barichara',
    offsetBahia: 1,
    muroDefault: 1,
  }),
  new CuadroCulturalModel({
    id: 'hormiga-culona',
    titulo: 'Hormiga Culona',
    subtitulo: 'EXPOSICIÓN CULTURAL',
    urlImagen: '/img/metaverso/Hormiga_Culona.webp',
    descripcion:
      'Un recorrido por uno de los mayores símbolos gastronómicos y culturales de Santander. Este cuadro explica de forma ilustrativa la anatomía de la hormiga culona, su importancia como alimento ancestral y el valor que representa dentro de las tradiciones de la región, destacando su aporte a la identidad y al patrimonio santandereano.',
    seccionBusqueda: 'bucaramanga',
    offsetBahia: -1,
    muroDefault: 0,
  }),
  new CuadroCulturalModel({
    id: 'frases santander',
    titulo: 'Frases Santander',
    subtitulo: 'EXPOSICIÓN CULTURAL',
    urlImagen: '/img/metaverso/Palabras_Santandereanas.webp',
    descripcion:
      'Una celebración del lenguaje cotidiano que identifica a los santandereanos. A través de expresiones típicas y elementos representativos de la región, este cuadro resalta la riqueza del habla popular, las costumbres y el carácter auténtico de un pueblo orgulloso de sus tradiciones.',
    seccionBusqueda: 'floridablanca',
    offsetBahia: -0.95,
    muroDefault: 1,
  }),
]
