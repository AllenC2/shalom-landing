/* Drop a file in templates/ and it is picked up on its own.
   The admin screenshots that render for the dashboard miniature, and opening
   it builds the visual editor from the same function.

   ShalomTemplates.define({
     id: "nota",
     label: "Nota",
     order: 10,
     blank() {
       return { id: "", title: "Nueva nota", body: "", image: "assets/serenidad.jpg", alt: "" };
     },
     render(root, page, mode) {
       const { el, text, imageFrame } = ShalomTemplates;
       const article = el("article", "package");
       article.append(
         text("h1", "", "title", page.title),
         text("p", "pkg-lead", "body", page.body, { multiline: true }),
         imageFrame("figure", "package-photo", "image", page.image, page.alt, "alt")
       );
       root.append(article);
     },
   });
*/
(function () {
  const templates = [];
  const reservedIds = new Set([
    "home",
    "about",
    "servicios",
    "servicios-catalog",
    "paquetes",
    "capillas",
    "nosotros",
    "articulos",
    "articulo",
    "servicio",
    "incluye",
    "contact",
    "edit",
  ]);
  const imageIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="10" r="1.3" fill="currentColor"/><path d="M4.5 16.5 8.6 13a1 1 0 0 1 1.3.05L13 16l1.7-1.4a1 1 0 0 1 1.3.1L20 17.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  let loading = null;

  function define(spec) {
    const index = templates.findIndex((item) => item.id === spec.id);
    if (index >= 0) templates[index] = spec;
    else templates.push(spec);
  }

  function list() {
    return templates.slice().sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.label.localeCompare(b.label, "es"));
  }

  function get(id) {
    return templates.find((item) => item.id === id) || null;
  }

  function getPath(root, path) {
    return String(path || "").split(".").reduce((value, key) => (value == null ? value : value[key]), root);
  }

  function setPath(root, path, next) {
    const keys = String(path || "").split(".");
    let cursor = root;
    for (let index = 0; index < keys.length - 1; index += 1) cursor = cursor[keys[index]];
    cursor[keys[keys.length - 1]] = next;
  }

  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function setMultiline(node, value) {
    node.replaceChildren();
    String(value || "").split("\n").forEach((line, index) => {
      if (index) node.append(document.createElement("br"));
      node.append(document.createTextNode(line));
    });
  }

  function text(tag, className, path, value, options = {}) {
    const node = el(tag, className);
    node.dataset.field = path;
    const multiline = Boolean(options.multiline || String(value || "").includes("\n"));
    if (multiline) node.dataset.multiline = "1";
    if (options.chip) node.dataset.chip = "1";
    if (multiline) setMultiline(node, value);
    else node.textContent = value ?? "";
    return node;
  }

  function imageFrame(tag, className, path, src, alt, altPath, mediaOptions = {}) {
    const node = el(tag || "div", className);
    node.dataset.image = path;
    if (altPath) node.dataset.alt = altPath;
    const image =
      window.ShalomModel && window.ShalomModel.createImage
        ? window.ShalomModel.createImage(src || "", {
            alt: alt || "",
            width: mediaOptions.width || window.ShalomModel.MEDIA_WIDTHS?.hero || 1200,
            lazy: mediaOptions.lazy !== false,
            priority: Boolean(mediaOptions.priority),
          })
        : (() => {
            const fallback = document.createElement("img");
            fallback.src = src || "";
            fallback.alt = alt || "";
            return fallback;
          })();
    node.append(image);
    return node;
  }

  function control(label, kind, path, blank, options = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = options.className || "text-action";
    button.dataset[kind] = path;
    if (blank !== undefined) button.dataset.blank = JSON.stringify(blank);
    if (options.label) button.setAttribute("aria-label", options.label);
    if (options.icon) {
      const mark = document.createElement("span");
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = options.icon;
      button.append(mark);
      if (label && options.showLabel) button.append(document.createTextNode(` ${label}`));
    } else {
      button.textContent = label;
    }
    return button;
  }

  function addControl(label, path, blank, options = {}) {
    return control(label, "add", path, blank, options);
  }

  function removeControl(label, path, options = {}) {
    return control(label, "remove", path, undefined, options);
  }

  function field(value, onChange, { multiline = false, chip = false } = {}) {
    const input = document.createElement(multiline ? "textarea" : "input");
    input.className = chip ? "edit-field edit-chip" : "edit-field";
    input.value = value ?? "";
    if (multiline) input.rows = Math.min(8, Math.max(2, Math.ceil(String(value || "").length / 52)));
    input.addEventListener("input", () => onChange(input.value));
    return input;
  }

  function activate(root, data, hooks) {
    // En el editor visual los enlaces no deben navegar: solo editar campos.
    if (root.dataset.editorLinksBound !== "1") {
      root.dataset.editorLinksBound = "1";
      root.addEventListener(
        "click",
        (event) => {
          const link = event.target.closest("a[href]");
          if (!link || !root.contains(link)) return;
          event.preventDefault();
          event.stopPropagation();
        },
        true
      );
      root.addEventListener(
        "auxclick",
        (event) => {
          const link = event.target.closest("a[href]");
          if (!link || !root.contains(link)) return;
          event.preventDefault();
          event.stopPropagation();
        },
        true
      );
    }
    root.querySelectorAll("a[href]").forEach((link) => {
      link.setAttribute("data-editor-href", link.getAttribute("href") || "");
      if (link.hasAttribute("target")) {
        link.setAttribute("data-editor-target", link.getAttribute("target") || "");
        link.removeAttribute("target");
      }
      link.removeAttribute("href");
      link.setAttribute("role", "presentation");
      link.setAttribute("tabindex", "-1");
    });

    root.querySelectorAll("[data-field]").forEach((node) => {
      const path = node.dataset.field;
      node.replaceChildren(field(getPath(data, path), (value) => {
        setPath(data, path, value);
        hooks.onChange();
      }, {
        multiline: node.dataset.multiline === "1",
        chip: node.dataset.chip === "1",
      }));
    });

    root.querySelectorAll("[data-image]").forEach((node) => {
      const path = node.dataset.image;
      const image = node.querySelector("img");
      if (!image) return;
      node.classList.add("image-slot");
      const badge = document.createElement("span");
      badge.className = "image-edit";
      badge.innerHTML = `${imageIcon}<span class="sr-only">Cambiar imagen</span>`;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.className = "image-file";
      input.addEventListener("change", async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        node.classList.add("is-uploading");
        try {
          const form = new FormData();
          form.append("file", file);
          const response = await fetch("/api/upload", {
            method: "POST",
            credentials: "same-origin",
            body: form,
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || "No se pudo subir la imagen");
          if (window.ShalomModel?.bindImage) {
            window.ShalomModel.bindImage(image, payload.url, {
              alt: image.alt || "",
              width: window.ShalomModel.MEDIA_WIDTHS?.hero || 1200,
              lazy: false,
            });
          } else {
            image.src = payload.url;
          }
          setPath(data, path, payload.url);
          if (node.dataset.alt && !getPath(data, node.dataset.alt)) setPath(data, node.dataset.alt, file.name);
          hooks.onChange();
        } catch (error) {
          window.alert(error.message || "No se pudo subir la imagen");
        } finally {
          node.classList.remove("is-uploading");
          input.value = "";
        }
      });
      node.append(badge, input);
    });

    root.querySelectorAll("[data-add]").forEach((button) => {
      button.addEventListener("click", () => {
        const list = getPath(data, button.dataset.add);
        if (!Array.isArray(list)) return;
        list.push(JSON.parse(button.dataset.blank || "null"));
        hooks.onStructure();
      });
    });

    root.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const keys = button.dataset.remove.split(".");
        const index = Number(keys.pop());
        const list = getPath(data, keys.join("."));
        if (!Array.isArray(list)) return;
        list.splice(index, 1);
        hooks.onStructure();
      });
    });

    root.querySelectorAll("[data-theme]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const theme = button.dataset.theme;
        if (!theme) return;
        data.theme = theme;
        data.featured = theme === "gold";
        hooks.onStructure();
      });
    });
  }

  function pages(state, template) {
    if (!state || template.singleton) return [];
    if (template.pagesKey) {
      state[template.pagesKey] ||= [];
      return state[template.pagesKey];
    }
    state.pages ||= {};
    state.pages[template.id] ||= [];
    return state.pages[template.id];
  }

  function source(state, template) {
    if (template.singleton) {
      return template.document ? template.document(state) : state[template.key || template.id];
    }
    if (template.blueprintKey) return state[template.blueprintKey];
    state.blueprints ||= {};
    return state.blueprints[template.id];
  }

  function prepare(state) {
    if (!state) return state;
    list().forEach((template) => {
      if (template.singleton) {
        const key = template.key || template.id;
        if (state[key] == null && template.blank) state[key] = template.blank();
        return;
      }
      const normalize = template.normalize || ((value) => value);
      if (template.blueprintKey) {
        if (state[template.blueprintKey] == null && template.blank) state[template.blueprintKey] = template.blank();
        if (state[template.blueprintKey] != null) state[template.blueprintKey] = normalize(state[template.blueprintKey]);
        state[template.pagesKey] = (state[template.pagesKey] || []).map((page) => normalize(page));
        return;
      }
      state.blueprints ||= {};
      state.pages ||= {};
      if (state.blueprints[template.id] == null && template.blank) state.blueprints[template.id] = template.blank();
      if (state.blueprints[template.id] != null) state.blueprints[template.id] = normalize(state.blueprints[template.id]);
      state.pages[template.id] = (state.pages[template.id] || []).map((page) => normalize(page));
    });
    return state;
  }

  function pageLabel(template, page) {
    if (template.pageLabel) return template.pageLabel(page);
    return page.name || page.title || page.id || "Página";
  }

  function uniqueId(name, ids) {
    const slugify = window.ShalomModel.slugify;
    let id = slugify(name);
    if (reservedIds.has(id)) id = `${id}-2`;
    let count = 2;
    while (ids.includes(id)) {
      id = `${slugify(name)}-${count}`;
      count += 1;
    }
    return id;
  }

  function allIds(state) {
    return list().flatMap((template) => pages(state, template).map((page) => page.id));
  }

  function clonePage(template, source, name, state) {
    const ids = allIds(state);
    if (typeof template.clone === "function") return template.clone(source, name, ids);
    const page = structuredClone(source);
    const label = String(name || "").trim() || "Nueva página";
    if (Object.prototype.hasOwnProperty.call(page, "name")) page.name = label;
    else page.title = label;
    page.featured = false;
    page.theme = "sand";
    page.id = uniqueId(label, ids);
    return template.normalize ? template.normalize(page) : page;
  }

  function findPage(state, id) {
    if (!state || !id) return null;
    for (const template of list()) {
      if (template.singleton) {
        if (template.route && template.route === id) {
          return { template, page: source(state, template) };
        }
        continue;
      }
      const page = pages(state, template).find((item) => item.id === id);
      if (page) return { template, page };
    }
    return null;
  }

  function inject(file, force = false) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-template="${file}"]`);
      if (existing && !force) {
        resolve();
        return;
      }
      if (existing && force) existing.remove();
      const script = document.createElement("script");
      script.src = force ? `templates/${file}?t=${Date.now()}` : `templates/${file}`;
      script.dataset.template = file;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`No se pudo cargar templates/${file}`));
      document.head.append(script);
    });
  }

  function load() {
    if (!loading) {
      loading = fetch("/api/templates")
        .then((response) => (response.ok ? response.json() : []))
        .catch(() => [])
        .then(async (files) => {
          for (const file of files) await inject(file);
        });
    }
    return loading;
  }

  function reload() {
    loading = fetch("/api/templates")
      .then((response) => (response.ok ? response.json() : []))
      .catch(() => [])
      .then(async (files) => {
        for (const file of files) await inject(file, true);
      });
    return loading;
  }

  window.ShalomTemplates = {
    define,
    list,
    get,
    load,
    reload,
    prepare,
    source,
    pages,
    pageLabel,
    clonePage,
    findPage,
    activate,
    el,
    text,
    imageFrame,
    addControl,
    removeControl,
  };
})();
