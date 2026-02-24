# 📔 Codex

**Codex** es una aplicación web estática, moderna y premium diseñada para leer, gestionar e interactuar con guías de texto en formato Markdown (`.md`). Evolucionada para ofrecer una experiencia superior, incluye integración con Inteligencia Artificial, herramientas de estudio interactivo y un diseño basado en *Glassmorphism*.

Desarrollada con **React** y **Vite**.

## ✨ Características Premium (Features)

- **🤖 Codex AI (Asistente Integrado)**: Conexión local con **LM Studio**. Selecciona una guía y chatea en tiempo real con una IA que usa tu guía actual como contexto estricto. (Soporta Streaming SSE, lo que significa que la IA "teclea" la respuesta en vivo).
- **🖊️ Sistema de Anotaciones Inteligente**:
  - Resalta cualquier fragmento de texto en la guía.
  - Selecciona entre 5 colores de resaltado (Amarillo, Verde, Azul, Rosa, Naranja).
  - Añade notas personalizadas a tus resaltados.
  - Al hacer clic en un texto resaltado, un *popover* elegante muestra tu nota y la opción de eliminarla.
  - Todas las anotaciones persisten localmente en tu navegador (`localStorage`).
- **📑 Índice Interactivo (ToC)**: Una Tabla de Contenidos *sticky* autogenerada a partir de los encabezados (H1, H2, H3) del Markdown. Se ilumina dinámicamente indicando qué sección estás leyendo actualmente (vía `IntersectionObserver`).
- **📊 Progreso de Lectura**: Una sutil barra superior que crece indicando el porcentaje de la guía que ya has leído.
- **🎨 Sistema de Temas Dinámicos**: Cambia toda la paleta de colores de la aplicación al instante. Los temas se guardan en tu navegador.
  - *Temas incluidos*: Dark Ocean, Nord, Cyberpunk, Sepia Clásico, Bosque Místico, y el exclusivo **Void** (Negro puro con acento ámbar absoluto).
- **🔍 Buscador en Tiempo Real**: Encuentra rápidamente la guía que necesitas tipeando en el *Sidebar*.
- **✨ Animaciones de Transición**: Navegación fluida entre guías con fundidos suaves (fade-ins).
- **💎 Diseño Glassmorphism**: Paneles translúcidos con desenfoque de fondo (`backdrop-filter`) para una estética inmersiva "premium".

## 🛠 Instalación y Uso Local

Este proyecto no requiere un backend tradicional, es puro Frontend, pero requiere Node.js instalado en tu sistema.

1. **Clonar / Descargar el repositorio**.
2. **Abrir la terminal** en la carpeta raíz del proyecto (`app-guias`).
3. **Instalar dependencias**:
   ```bash
   npm install
   ```
4. **Ejecutar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
5. Accede a `http://localhost:5173/` en tu navegador.

## 📂 ¿Cómo añadir nuevas Guías?

Simplemente arrastra cualquier archivo de texto en formato `.md` (Markdown) dentro de la ruta:
`src/Resources/`

La herramienta interna `import.meta.glob` de Vite detectará automáticamente los archivos nuevos, generará un nombre legible (reemplazando guiones bajos por espacios y quitando el `.md`) y los añadirá al *Sidebar* al recargar la página.

## 🧠 Configuración del Asistente Codex AI (LM Studio)

Para que el chat de Codex responda consultas sobre tus guías usando IA de forma privada:

1. Descarga e instala [LM Studio](https://lmstudio.ai/).
2. Descarga un modelo de lenguaje ligero (ej: Llama 3 de 8B, Qwen, o Phi-3).
3. Entra en la pestaña **Local Server** (icono `<->`).
4. **IMPORTANTE**: Activa la opción **Enable CORS (Cross-Origin Resource Sharing)**. Si no lo haces, el navegador bloqueará la conexión.
5. Inicia el servidor (`Start Server`) en el puerto por defecto `1234`.
6. En **Codex**, selecciona una guía, abre el chat a tu derecha y pregúntale lo que quieras sobre lo que estás leyendo.

## 💻 Stack Tecnológico
- **Framework**: [React 18](https://react.dev/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Estilos**: Vanilla CSS (`index.css`) apalancado fuertemente en Variables CSS (`--`) para el motor de temas personalizados.
- **Renderizado Markdown**: `react-markdown`.
- **Persistencia de Datos**: API nativa `localStorage` (para temas y anotaciones de lectura).

---
*Desarrollado para la lectura y gestión óptima de documentación extensa, guías de juegos RPG y material de estudio.*
