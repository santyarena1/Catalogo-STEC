# Catálogo Interactivo — Crestron Home Argentina
### Distribuidor oficial: Soundtec SRL

Sitio web de catálogo y presentación de productos **Crestron Home** para el mercado argentino. 100% estático (HTML/CSS/JS), sin frameworks, sin build step. Deploy en Netlify directamente desde GitHub.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Markup | HTML5 semántico |
| Estilos | CSS3 con custom properties (variables) |
| Lógica | Vanilla JavaScript ES6+ (módulos IIFE) |
| Fuentes | Inter (Google Fonts) |
| Persistencia | `localStorage` + JSONBin.io (sync remoto) |
| Deploy | Netlify (CI/CD desde GitHub `main`) |
| Admin auth | `sessionStorage` con credenciales en `config.js` |

---

## Estructura de archivos

```
/
├── index.html                  # Página principal (SPA-like, todo en un archivo)
├── blog.html                   # Página de blog completa
├── catalogo.html               # Catálogo interactivo con filtros
├── recursos.html               # Recursos descargables
│
├── microsite-keypads.html      # Micrositio: Keypads & Dimmers (Horizon / Cameo)
├── microsite-lighting.html     # Micrositio: Iluminación Zūm
├── microsite-shading.html      # Micrositio: Shading / Persianas motorizadas
├── microsite-audio.html        # Micrositio: Audio DM NAX
├── microsite-clima.html        # Micrositio: Climatización
├── microsite-seguridad.html    # Micrositio: Seguridad & Accesos
├── microsite-interfaces.html   # Micrositio: Interfaces & Control (Touch / Remote)
├── microsite-escenarios.html   # Micrositio: Escenarios & Automatización
│
├── styles.css                  # Estilos globales del sitio principal (~2300 líneas)
├── microsite.css               # Estilos compartidos de los 8 micrositios
├── admin.css                   # Estilos del panel de administración
├── annotations.css             # Estilos del sistema de anotaciones
│
├── script.js                   # JS general: scroll, cursor, reveal, nav activa
├── admin.js                    # Sistema de administración completo
├── annotations.js              # Sistema de anotaciones de feedback
├── appdemo.js                  # Demo interactiva de la app Crestron Home
├── blog.js                     # Lógica de la página de blog
├── catalogo.js                 # Filtros y render del catálogo
├── recursos.js                 # Gestión de recursos descargables
│
├── config.js                   # Credenciales y API keys (committed sin keys de IA)
├── crestron-home-logo.svg      # Logo principal (se invierte con CSS filter en dark mode)
└── img/                        # Imágenes del hero slider y contenido
```

---

## Páginas y secciones

### `index.html` — Página principal

Secciones en orden, cada una con `id` para navegación:

| `#id` | Sección | Descripción |
|---|---|---|
| `#inicio` | Hero | Slider de 4 imágenes, dashboard strip con escenas, botones de navegación |
| `#plataforma` | Plataforma | Grid de características de la plataforma Crestron |
| `#escenarios` | Escenarios | Tabs interactivos (Cine / Amanecer / Reunión / Noche) con imagen y descripción |
| `#soluciones` | Soluciones | Cards de 6 categorías de soluciones con hover detail |
| `#micrositios` | Explorar | 8 cards que enlazan a los micrositios de cada categoría |
| `#pilares` | Pilares | 4 pilares: Sin suscripción / Escalable / Confiable / Compatible |
| `#productos` | Catálogo | Grid de productos con filtros (preview de 6 productos) |
| `#marcas` | Marcas compatibles | Grid con 12 marcas: Yale, 2N, DoorBird, Apple, Google, Alexa, Spotify, etc. |
| `#comparacion` | Comparación | Tabla Crestron vs competencia |
| `#chapp` | App Demo | Demo interactiva de la app móvil Crestron Home |
| `#recursos` | Recursos | Fichas técnicas, guías, videos |
| `#blog` | Blog | Preview de últimos 3 artículos |
| `#contacto` | Contacto | Formulario de consulta |
| `#footer` | Footer | Links, redes, info de contacto |

### Micrositios

Cada micrositio tiene la misma estructura base (`microsite.css`):
- **Navbar** con logo + volver al inicio
- **Hero** con título, subtítulo y CTA
- **Sección de beneficios** (cards con ícono)
- **Módulo interactivo** (específico de cada categoría)
- **Ecosistema** (chips de integraciones)
- **CTA final** + footer

#### Módulos interactivos por micrositio

| Micrositio | Módulo interactivo |
|---|---|
| `microsite-keypads.html` | Configurador de acabados Horizon (7 swatches, slider RGB backlight, escenas) + Cameo (colores, selector de cantidad de botones 2/4/6/8) + Partners |
| `microsite-lighting.html` | Canvas mesh network animado (click para agregar nodos) + calculadora de ahorro energético (sliders daylight/occupancy) |
| `microsite-shading.html` | Selector de tipos de persianas + swatches de tela + slider de posición + animación de motor open/close |
| `microsite-audio.html` | Floor plan interactivo (6 zonas) + controles de volumen por zona + EQ animado (20 barras) + selector de fuente |
| `microsite-clima.html` | Termostato SVG con arco animado + modos (Cooling/Heating/Auto/Fan) + circadian rhythm (24 barras de temperatura) |
| `microsite-seguridad.html` | Toggle de cerradura Yale con autolock countdown + selector de acabados (4 opciones) |
| `microsite-interfaces.html` | Simulador Touch Screen 80 Series (5 paneles: luces/persianas/audio/clima/seguridad) + Remote HR-310 con feedback de click |
| `microsite-escenarios.html` | 4 escenas (Cine/Amanecer/Reunión/Fiesta) con device bars animadas, timeline de activación y stats de cada escena |

---

## Sistema de Administración (`admin.js`)

### Autenticación
- Login con usuario/contraseña desde `config.js`
- Sesión guardada en `sessionStorage` (se cierra al cerrar el tab)
- Credenciales: `ADMIN_USER` / `ADMIN_PASS`

### Toolbar flotante (FAB bottom-right)
Botones disponibles en modo admin:

| Botón | Función |
|---|---|
| **Modo edición** | Hace editables todos los elementos con `data-editable`, guarda en `localStorage` |
| **Nuevo artículo** | Modal con editor + generación con IA (OpenAI GPT-4o-mini) |
| **Nuevo producto** | Formulario para agregar productos al catálogo |
| **Nuevo recurso** | Agregar fichas técnicas / videos / guías |
| **Editar video** | Cambiar el video de la sección de plataforma |
| **Anotaciones** | Abre el panel de anotaciones (ver abajo) |
| **Cerrar sesión** | Limpia sessionStorage |

### Gestión de imágenes
- **Slider hero**: 4 imágenes editables desde el panel de slides
- **Productos**: imagen por producto (búsqueda Serper o upload o URL)
- **Logos de marcas**: reemplazables por imagen personalizada
- Picker unificado con 3 tabs: Buscar (Serper Google Images), Subir archivo, URL directa

### Contenido editable
Cualquier elemento con `data-editable="clave"` en el HTML se puede editar en modo admin. El contenido se persiste en `localStorage` bajo la key `crestron_content`.

### Storage keys de `localStorage`
| Key | Contenido |
|---|---|
| `crestron_content` | Textos editados por admin |
| `crestron_product_imgs` | Imágenes de productos (model → url) |
| `crestron_product_extra` | Imágenes múltiples + posición por producto |
| `crestron_slide_imgs` | Imágenes del hero slider (0-3 → url) |
| `crestron_brand_imgs` | Logos de marcas (id → url) |
| `crestron_blog_posts` | Artículos del blog |
| `stec_annotations` | Notas del sistema de anotaciones |
| `chTheme` | Tema actual (`'light'` o ausente = dark) |

---

## Sistema de Anotaciones (`annotations.js` + `annotations.css`)

Herramienta de feedback para el cliente. Solo visible en modo admin.

### Cómo funciona
1. Iniciar sesión como admin → aparece botón **"Notas"** (bottom-left)
2. Clic en **"+ Agregar nota"** → cursor cambia a crosshair
3. Clic en cualquier punto de cualquier página → aparece sticky note
4. La nota detecta automáticamente en qué sección fue colocada
5. Las notas son **arrastrables** (drag por el header)
6. Cada nota tiene: textarea para escribir, botón **✓ Resolver**, botón **✕ Eliminar**

### Panel de checklist
- Filtros: **Todas / Pendientes / Resueltas**
- Cada fila muestra: **Origen** (Página › Sección) + texto + fecha
- Botón 👁 navega directamente a la nota (scroll + highlight)
- Botón 🗑 elimina
- Checkbox resuelve/reabre

### Persistencia
- **Local**: `localStorage` key `stec_annotations` (cache instantáneo)
- **Remoto**: JSONBin.io (sync cross-device/cross-browser)
- Al login: pull remoto → merge con local → re-render
- Al guardar: push a JSONBin (debounced 700ms)
- Indicador de estado: `✓ Guardado en la nube` / `↻ Sincronizando...` / `⚠ Error`

### Estructura de cada anotación
```js
{
  id:        'ann_1234567890',   // timestamp-based
  pageKey:   'index.html',       // filename de la página
  pageLabel: 'Inicio',           // nombre legible
  section:   'Blog',             // sección detectada automáticamente
  x:         450,                // posición absoluta en el documento (px)
  y:         1200,
  text:      'El texto está muy largo',
  resolved:  false,
  createdAt: '17/4/2026',
}
```

### Páginas donde funciona
Todas: `index.html`, `blog.html`, `catalogo.html`, `recursos.html` y los 8 micrositios.

---

## Dark / Light Mode

- Toggle: botón pill en la navbar (entre el login y el hamburger)
- Persiste en `localStorage` key `chTheme`
- Anti-flash: script inline en `<head>` aplica el tema antes del primer render
- Implementación: CSS custom properties en `:root` (dark por defecto) + override con `html[data-theme="light"]`
- El logo se adapta con `filter: brightness(0) invert(1)` en dark / `filter: none` en light (un solo archivo SVG)
- El footer siempre es oscuro en ambos modos

---

## `config.js`

```js
window.APP_CONFIG = {
  SERPER_KEY:  '',        // Google Image Search via Serper.dev (solo local)
  OPENAI_KEY:  '',        // GPT-4o-mini para generar artículos de blog (solo local)
  JSONBIN_ID:  '',        // ID del bin en jsonbin.io (para sync de anotaciones)
  JSONBIN_KEY: '',        // Master Key de jsonbin.io
  ADMIN_USER:  'admin',
  ADMIN_PASS:  'Stec2024!',
};
```

**Importante**: `SERPER_KEY` y `OPENAI_KEY` se dejan vacíos en el repo. Configurarlos solo en local. `JSONBIN_ID` y `JSONBIN_KEY` se pueden commitear porque son para una feature de admin, no son secretos críticos.

### Setup JSONBin (para sync de anotaciones entre dispositivos)
1. Crear cuenta en [jsonbin.io](https://jsonbin.io)
2. New Bin → contenido inicial: `[]` → copiar el **BIN ID**
3. Account → API Keys → copiar **Master Key**
4. Pegar ambos en `config.js` y pushear

---

## Deploy

**Plataforma**: Netlify  
**Repo**: `github.com/santyarena1/Catalogo-STEC`  
**Branch**: `main` (CI/CD automático)  
**Build command**: *(ninguno — sitio estático)*  
**Publish directory**: `.` (raíz)

---

## Pendiente / Roadmap

### Features en progreso o discutidas
- [ ] **Micrositios en Netlify con admin.js**: los micrositios ya tienen admin.js incluido pero falta probar que el toolbar funcione correctamente en producción
- [ ] **Formulario de contacto funcional**: actualmente el formulario HTML no tiene backend; conectar con Netlify Forms o Formspree
- [ ] **Imágenes reales del hero slider**: placeholder vacío (`img/hero-1.jpg`, etc.); el cliente debe proveer fotos del proyecto
- [ ] **Imágenes de productos**: el catálogo usa placeholder; el admin puede cargar imágenes via el picker
- [ ] **SERPER_KEY y OPENAI_KEY en producción**: si se quiere activar la búsqueda de imágenes y generación de blog en Netlify, mover a Netlify Environment Variables + una Edge Function que los inyecte
- [ ] **Dominio personalizado**: apuntar a `crestronhome.com.ar` o similar en Netlify
- [ ] **SEO**: meta tags OG, sitemap.xml, robots.txt

### Bugs conocidos / cosas a revisar
- [ ] El sistema de anotaciones guarda posiciones en píxeles absolutos — si el cliente accede desde mobile (viewport diferente), las notas pueden aparecer en lugares incorrectos. Solución pendiente: posicionamiento relativo por sección.
- [ ] Las API keys de Serper y OpenAI funcionan solo en local (las features de búsqueda de imágenes y generación de blog no están disponibles en producción)

---

## Cómo correr localmente

```bash
# Opción 1: Node.js server inline (puerto 8080)
node -e "
const http=require('http'),fs=require('fs'),path=require('path');
const MIME={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
http.createServer((req,res)=>{
  let p=req.url.split('?')[0]; if(p==='/') p='/index.html';
  const file=path.join(process.cwd(),p);
  fs.readFile(file,(err,data)=>{ if(err){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'text/plain'}); res.end(data); });
}).listen(8080,()=>console.log('http://localhost:8080'));
"

# Opción 2: Python
python -m http.server 8080

# Opción 3: VS Code Live Server extension
```

---

## Créditos
- Desarrollado con Claude Code (Anthropic) en colaboración con Soundtec SRL
- Plataforma: [Crestron Home](https://www.crestron.com/Products/Control-Systems/Residential-Solutions/Crestron-Home)
