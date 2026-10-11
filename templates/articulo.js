ShalomTemplates.define({
  id: "articulo",
  label: "Artículo",
  order: 4,
  dashboard: false,
  blueprintKey: "articuloTemplate",
  pagesKey: "articulos",
  blank() {
    return structuredClone(window.SHALOM_DEFAULT.articuloTemplate);
  },
  normalize(page) {
    return window.ShalomModel.createArticulo(page);
  },
  clone(source, name, ids) {
    return window.ShalomModel.cloneArticulo(source, name, ids);
  },
  pageLabel(page) {
    return page.title || "Artículo";
  },
  render(root, articulo, mode = { edit: false }) {
    const { el } = ShalomTemplates;
    if (mode.edit) {
      const note = el("p", "editor-note");
      note.textContent = "Los artículos se editan en el menú Artículos del admin.";
      root.append(note);
      return;
    }

    const page = el("article", "page page-articulo");
    const back = el("a", "back");
    back.href = "#/nosotros";
    back.textContent = "Nosotros";

    const hero = el("div", "articulo-hero");
    const media = el("figure", "articulo-hero-media");
    const cover = articulo.images?.[0];
    if (cover?.src) {
      media.append(
        window.ShalomModel.createImage(cover.src, {
          className: "articulo-cover",
          alt: cover.alt || articulo.title || "",
          width: window.ShalomModel.MEDIA_WIDTHS.hero,
          lazy: false,
          priority: true,
        })
      );
    }
    hero.append(media);

    const head = el("header", "articulo-head");
    if (articulo.date) {
      const date = el("p", "articulo-date");
      date.textContent = formatArticuloDate(articulo.date);
      head.append(date);
    }
    const title = el("h1", "articulo-title");
    title.textContent = articulo.title || "";
    head.append(title);

    const body = el("div", "articulo-body");
    body.innerHTML = articulo.body || "";

    page.append(back, hero, head, body);

    const gallery = (articulo.images || []).slice(1);
    if (gallery.length) {
      const grid = el("div", "articulo-gallery");
      gallery.forEach((image) => {
        const figure = el("figure", "articulo-gallery-item");
        figure.append(
          window.ShalomModel.createImage(image.src, {
            alt: image.alt || articulo.title || "",
            width: window.ShalomModel.MEDIA_WIDTHS.content,
          })
        );
        grid.append(figure);
      });
      page.append(grid);
    }

    root.append(page);
  },
});

function formatArticuloDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
