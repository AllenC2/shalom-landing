# Admin → Páginas: listado y editor visual

Guía para agentes (y humanos) que deban tocar la sección **Páginas** del admin: cómo se listan las miniaturas, cómo se abre el editor visual y cómo se conecta con el sitio público.

## Mapa rápido

| Pieza | Rol |
| --- | --- |
| `admin.html` + `admin.js` | Shell del admin, rutas hash, grid de Páginas, montaje del editor |
| `templates.js` | Motor `ShalomTemplates`: define, carga, `source`/`pages`, `activate` (campos editables) |
| `templates/*.js` | Una plantilla = una “página” (o familia de páginas) del editor |
| `content.js` + `data/content.json` | Modelo por defecto y contenido persistido |
| `GET /api/templates` | Lista los archivos en `templates/` para cargarlos en runtime |
| Sitio público (`script.js`) | Usa las mismas plantillas vía `findPage` + `#generated-view` cuando la ruta coincide |

Hash del admin relevantes:

- `#/paginas` — grid de páginas editables (singletons / plantillas con `dashboard !== false`)
- `#/edit/<templateId>` — editor visual de un **singleton** (ej. `#/edit/inicio`, `#/edit/paquetes`, `#/edit/nosotros`)
- `#/edit/paquete/<id>` — editor de un paquete concreto (no vive en Páginas; vive en `#/paquetes`)
- `#/paquetes` — listado de **productos** paquete (otro menú del admin; no confundir con la página de sitio “Paquetes”)

## Flujo de arranque del admin

1. `admin.js` autentica con `/api/me`.
2. Carga plantillas: `ShalomTemplates.load()` → `GET /api/templates` → inyecta cada `templates/<archivo>.js`.
3. Carga contenido: `ShalomModel.loadContent()` → estado global `state`.
4. `ShalomTemplates.prepare(state)` rellena claves faltantes con `blank()` de cada plantilla.
5. `route()` reacciona al hash y pinta Dashboard, Páginas, Paquetes o el editor.

Cualquier `.js` nuevo en `templates/` aparece solo (el API lo enumera). No hace falta registrarlo a mano en `admin.html`, salvo que el sitio público lo precargue con `<script data-template="...">` para el primer paint.

## Cómo Páginas arma el listado

`renderPages()` en `admin.js`:

1. Filtra `engine.list()` y **omite** plantillas con `dashboard: false` (hoy: `paquete`).
2. Para cada plantilla restante, toma `engine.source(state, template)` (el objeto que editará el editor).
3. Pinta una miniatura con `shotThumb(...)` que enlaza a `#/edit/<template.id>`.
4. Genera capturas con html2canvas en background (`refreshMiniatures`).

Orden del grid: `order` de la plantilla (ascendente), luego `label`.

Plantillas que deben verse en **Páginas** (singletons del sitio):

| `id` | Label | Ruta pública | Contenido en `state` |
| --- | --- | --- | --- |
| `inicio` | Inicio | home (`#home` / vista estática) | `document(state)` → **todo** `state` (campos `inicio.*`) |
| `paquetes` | Paquetes | `#/paquetes` | `document(state)` → **todo** `state` (campos `paquetes.*` + cards desde `packages`) |
| `servicios` | Servicios | `#/servicios` | `state.servicios` (`key: "servicios"`) |
| `nosotros` | Nosotros | `#/nosotros` | `state.nosotros` (`key: "nosotros"`) |

La plantilla `paquete` tiene `dashboard: false` y `pagesKey: "packages"`: se gestiona en el menú **Paquetes** del admin, no en el grid de Páginas.

## Anatomía de una plantilla (`ShalomTemplates.define`)

Archivo típico: `templates/<id>.js`.

```js
ShalomTemplates.define({
  id: "nosotros",          // clave de ruta admin: #/edit/nosotros
  label: "Nosotros",       // texto en el grid de Páginas
  order: 2,                // posición en el grid
  singleton: true,         // una sola instancia (no lista de páginas)
  route: "nosotros",       // slug público: #/nosotros (findPage)
  key: "nosotros",         // dónde vive en state si no hay document()
  dashboard: true,         // default; false = ocultar en Páginas
  blank() { ... },         // seed si state[key] no existe (prepare)
  pageLabel() { ... },     // título documento / miniatura
  document(state) { ... }, // opcional: qué objeto recibe render/activate
  render(root, data, mode) { ... },
});
```

### `singleton` vs colección

- **Singleton** (`singleton: true`): una página. Editor en `#/edit/<id>`. `source()` devuelve `document(state)` o `state[key|id]`.
- **Colección** (ej. `paquete`): muchas páginas en `state.packages`. Editor en `#/edit/paquete/<pageId>`. `dashboard: false` para no mezclarlas en Páginas.

### `document(state)` vs `key`

- Con **`key` + `blank`**: `render` recibe solo el objeto de esa página (`state.nosotros`). Los `data-field` son rutas relativas (`title`, `lede`, …).
- Con **`document(state)`** (Inicio, Paquetes): `render`/`activate` reciben el **estado completo**. Los `data-field` deben ser rutas absolutas en el state (`inicio.about.title`, `paquetes.eyebrow`). Útil cuando la vista también muestra datos de otra clave (`packages`).

### `render(root, data, mode)`

- `mode.edit === true` en el admin: marcar cards/bloques de solo lectura con `is-readonly`, notas con `.editor-note`, etc.
- `mode.edit === false` en el sitio público: enlaces reales, sin controles de edición.
- Construir el DOM con helpers del motor:
  - `text(tag, className, path, value, { multiline })` → nodo con `data-field` (el editor lo convierte en input).
  - `imageFrame(..., path, src, alt, altPath)` → `data-image` (+ upload en activate).
  - `addControl` / `removeControl` → listas dinámicas (`data-add` / `data-remove`).

IDs reservados (no usar como `id` de paquete/página nueva): ver `reservedIds` en `templates.js` (`home`, `about`, `servicios`, `paquetes`, `nosotros`, `incluye`, `contact`, `edit`, …).

## Cómo funciona el editor visual

`renderEditor(template, data, { blueprint })` en `admin.js`:

1. `template.render(sheet, data, { edit: true })` pinta el layout real del sitio (mismas clases CSS públicas).
2. `engine.activate(sheet, data, { onChange, onStructure })`:
   - Cada `[data-field]` se reemplaza por un input/textarea; al escribir hace `setPath(data, path, value)` y `scheduleSave()`.
   - Cada `[data-image]` recibe file input → `POST /api/upload` → actualiza URL en el state.
   - Botones add/remove mutan arrays y llaman `onStructure` → **re-render completo** del editor + save.
3. Barra superior: volver a `#/paginas` (o a `#/paquetes` si el edit es de un paquete).

Persistencia: `scheduleSave()` → `ShalomModel.saveContent(state)` (debounce). El state es la fuente de verdad compartida con el sitio público.

Miniaturas: `shotThumb` vuelve a llamar `template.render` en un iframe/documento aislado y captura con html2canvas. `keepOpening()` ajusta layouts de detalle de paquete; si no hay `.package-layout`, sale temprano (válido para Inicio/Paquetes/Nosotros).

## Puente con el sitio público

Misma plantilla, distinto host:

1. Público carga plantillas (`ShalomTemplates.load()` y/o scripts `data-template` en `index.html`).
2. `applyRoute()` en `script.js`:
   - Si el hash es `#/<slug>` de un paquete existente → `#package-view`.
   - Si `findPage(siteContent, slug)` encuentra un singleton con `route === slug` → `renderGenerated(found)` en `#generated-view`.
3. `findPage` solo matchea singletons por `template.route`, o ítems de colección por `page.id`.

Ejemplos:

- `#/servicios` → template `servicios` (incluye sección de comentarios públicos)
- `#/nosotros` → template `nosotros`
- `#/paquetes` → template `paquetes` (el carrusel se renderiza desde la plantilla; los ítems se editan en admin **Paquetes**)
- Home / Inicio sigue siendo en gran parte HTML estático en `#home-view`, rellenado con `fillInicio()` desde `state.inicio` (el editor de Inicio edita ese mismo objeto vía `document(state)`).

Legacy: `#servicios`, `#/servicios`, `#paquetes` redirigen a `#/paquetes`.

## Cómo agregar una página nueva al editor (checklist)

1. **Contenido**: añadir clave en `SHALOM_DEFAULT` (`content.js`) y, si aplica, en `data/content.json`.
2. **Plantilla**: crear `templates/<id>.js` con `singleton: true`, `label`, `order`, `route`, `key` o `document()`, `blank()`, `render()`.
3. **IDs**: añadir el slug a `reservedIds` en `templates.js` si no debe usarse como id de paquete.
4. **Público** (si la página se navega en el sitio):
   - Enlace de menú a `#/<route>`.
   - Confirmar que `findPage` + `renderGenerated` la muestran (o cablear vista estática + `fill*` si se prefiere HTML fijo).
   - Opcional: precargar `<script src="templates/<id>.js" data-template="<id>.js">` en `index.html`.
5. **No** hace falta tocar `renderPages()`: cualquier plantilla sin `dashboard: false` aparece sola en el grid.
6. Verificar en admin: `#/paginas` → miniatura → `#/edit/<id>` → editar → recargar sitio público.

## Trampas frecuentes

- **`#/paquetes` en admin ≠ página Paquetes del sitio**: en admin es el CRUD de productos; la página de marketing se edita en `#/edit/paquetes` desde **Páginas**.
- **`dashboard: false`**: la plantilla no sale en Páginas (correcto para `paquete`).
- **Rutas `data-field` incorrectas**: si usas `document(state)`, los paths deben incluir el prefijo (`paquetes.title`). Si usas solo `key`, los paths son relativos al objeto de página.
- **Cards “editables” que no deben editarse ahí**: marcar `is-readonly` y apuntar al editor correcto (nota `.editor-note`), como en Paquetes → “se editan en Paquetes”.
- **`prepare` no corre after-the-fact**: si añades `blank()` y el JSON ya existe sin la clave, `prepare` la crea al cargar el admin; el público también debe pasar por `prepare` o tolerar default.
- **Doble carga de script**: `data-template="<file>"` evita que `inject()` vuelva a insertar el mismo archivo.

## Archivos clave (lectura ordenada)

1. `admin.js` — `renderPages`, `renderEditor`, `route`
2. `templates.js` — `define`, `source`, `pages`, `prepare`, `findPage`, `activate`, `load`
3. `templates/inicio.js`, `templates/paquetes.js`, `templates/servicios.js`, `templates/nosotros.js`, `templates/paquete.js`
4. `content.js` — `SHALOM_DEFAULT`
5. `script.js` — `applyRoute`, `renderGenerated`, `fillInicio`
6. `server/index.js` — `GET /api/templates`
