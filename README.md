<div align="center">

# 🏔️ Santander Accesible — Frontend

**Plataforma turística y de metaverso inclusivo del departamento de Santander (Colombia)**

Interfaz web construida con **React + TypeScript + Vite**, con módulo inmersivo
**(WebXR + Three.js)** y accesibilidad como eje transversal (**WCAG 2.2**).

[![Status](https://img.shields.io/badge/estado-en%20desarrollo-yellow)](#-roadmap)
[![React](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38bdf8?logo=tailwindcss&logoColor=black)](https://tailwindcss.com)
[![Three.js](https://img.shields.io/badge/WebXR%20%C2%B7%20Three.js-black?logo=three.js&logoColor=white)](https://threejs.org)
[![WCAG](https://img.shields.io/badge/accesibilidad-WCAG%202.2-005fcc)](https://www.w3.org/WAI/WCAG22/quickref/)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-green?logo=node.js&logoColor=white)](https://nodejs.org)

🌐 **Demo:** [dev.turismo-santander.desarrollos-pablo-carvajal.com/municipios](https://dev.turismo-santander.desarrollos-pablo-carvajal.com/municipios)

</div>

---

## 📌 Índice

- [Descripción](#-descripción)
- [Características](#-características)
- [Stack tecnológico](#-stack-tecnológico)
- [Requisitos previos](#-requisitos-previos)
- [Puesta en marcha](#-puesta-en-marcha)
- [Variables de entorno](#-variables-de-entorno)
- [Scripts disponibles](#-scripts-disponibles)
- [Arquitectura y estructura](#-arquitectura-y-estructura)
- [Modelo de ramas y flujo de trabajo](#-modelo-de-ramas-y-flujo-de-trabajo)
- [Calidad y pruebas](#-calidad-y-pruebas)
- [Accesibilidad](#-accesibilidad-eje-transversal)
- [Despliegue](#-despliegue)
- [Guía de contribución](#-guía-de-contribución)
- [Equipo](#-equipo)
- [Licencia](#-licencia)

---

## 🎯 Descripción

**Santander Accesible** es el frontend de una plataforma pública de turismo que
combina dos experiencias complementarias:

1. **Catálogo turístico**: exploración de destinos, municipios, planes y rutas del
   departamento de Santander (San Gil, Barichara, Bucaramanga, Cañón del Chicamocha, etc.).
2. **Metaverso inmersivo**: recorridos 3D en tiempo real por escenarios emblemáticos,
   ejecutados directamente en el navegador mediante WebXR y Three.js, sin instalación de clientes.

El proyecto nace con un mandato claro: **el turismo también debe ser accesible**. Por eso,
la accesibilidad no es una capa final, sino un criterio de diseño presente en cada componente,
rutas de navegación, textos alternativos, contraste y experiencia inmersiva.

---

## ✨ Características

- ⚡ **Base moderna**: React + TypeScript en modo estricto, bundling con Vite y HMR instantáneo.
- 🎨 **UI consistente**: sistema de componentes reutilizables con Tailwind CSS y shadcn/ui (`components.json`).
- 🕶️ **Módulo VR/3D**: escena WebXR con Three.js, hotspots de interés multimedia y navegación en tiempo real.
- ♿ **Accesibilidad WCAG 2.2**: navegación por teclado completa, jerarquía semántica de títulos, `aria-live`, foco visible y soporte de lectores de pantalla.
- 🔍 **SEO técnico**: gestión de metadatos y OpenGraph por página, precarga de assets críticos.
- 🧪 **QA automatizado**: suite E2E con Selenium en `qa/`.
- 🌱 **Optimización de assets**: pipeline propio para compresión de imágenes a `.webp`.
- 🚀 **Deploy listo**: configuración de Cloudflare Workers/Pages vía `wrangler.jsonc`.

---

## 🛠 Stack tecnológico

| Capa | Tecnología | Propósito |
| --- | --- | --- |
| Framework | React 18 | Construcción de la interfaz |
| Lenguaje | TypeScript (estricto) | Tipado estático y seguridad en runtime |
| Build tool | Vite | Desarrollo con HMR y build de producción |
| Estilos | Tailwind CSS + shadcn/ui | Design system y utilidades |
| 3D / VR | Three.js + WebXR | Metaverso navegable en navegador |
| Calidad | ESLint + TypeScript compiler | Linter y typecheck en CI |
| Pruebas | Selenium (`qa/`) | Automatización end-to-end |
| Infraestructura | Wrangler (Cloudflare) | Despliegue y dominio oficial |

---

## ✅ Requisitos previos

- **Node.js ≥ 20** (recomendado gestionar con `nvm`)
- **npm** (incluido con Node)
- Navegador con soporte WebXR para el módulo de metaverso (Chrome/Edge de escritorio o visores compatibles)

---

## 🚀 Puesta en marcha

```bash
# 1. Clonar el repositorio
git clone https://github.com/Carchaloneo22/FrontEnd-Santander-Turismo-Accesible.git
cd FrontEnd-Santander-Turismo-Accesible

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env        # ajusta las variables si hace falta

# 4. Levantar el servidor de desarrollo
npm run dev                 # http://localhost:5173
