ShalomTemplates.define({
  id: "nosotros",
  label: "Nosotros",
  order: 3,
  singleton: true,
  route: "nosotros",
  document(state) {
    return state;
  },
  blank() {
    return structuredClone(window.SHALOM_DEFAULT.nosotros);
  },
  pageLabel() {
    return "Nosotros";
  },
  render(root, state, mode) {
    const { el, text } = ShalomTemplates;
    const page = state.nosotros || window.SHALOM_DEFAULT.nosotros;
    const articulos = (state.articulos || []).filter((item) => mode.edit || !item.hidden);
    const wrap = el("div", "page page-nosotros page-nosotros-reel");

    if (mode.edit) {
      const note = el("p", "editor-note");
      note.textContent = "Los artículos de esta página se editan en el menú Artículos del admin.";
      wrap.append(note);
      wrap.append(
        text("h2", "", "nosotros.emptyTitle", page.emptyTitle || ""),
        text("p", "lede", "nosotros.emptyLede", page.emptyLede || "", { multiline: true })
      );
      root.append(wrap);
      return;
    }

    const reel = el("div", "nosotros-reel");
    reel.setAttribute("aria-label", "Artículos de Nosotros");

    if (!articulos.length) {
      const empty = el("article", "nosotros-card is-empty");
      const copy = el("div", "nosotros-card-copy");
      const title = el("h2");
      title.textContent = page.emptyTitle || "Pronto compartiremos más de nosotros";
      const lede = el("p", "lede");
      lede.textContent = page.emptyLede || "";
      copy.append(title, lede);
      empty.append(copy);
      reel.append(empty);
    } else {
      articulos.forEach((item) => {
        const card = el("article", "nosotros-card");
        card.dataset.articuloId = item.id || "";

        const images = item.images || [];
        if (images.length) {
          const media = el("div", "nosotros-card-media");
          if (images.length === 1) {
            const img = document.createElement("img");
            img.className = "nosotros-card-cover";
            img.src = images[0].src;
            img.alt = images[0].alt || item.title || "";
            img.loading = "lazy";
            media.append(img);
          } else {
            const gallery = el("div", "nosotros-card-gallery");
            images.forEach((image, index) => {
              const figure = el("figure", "nosotros-card-shot");
              const img = document.createElement("img");
              if (index === 0) img.className = "nosotros-card-cover";
              img.src = image.src;
              img.alt = image.alt || item.title || "";
              img.loading = "lazy";
              figure.append(img);
              gallery.append(figure);
            });
            media.append(gallery);
          }
          card.append(media);
        }

        const copy = el("div", "nosotros-card-copy");
        if (item.date) {
          const date = el("p", "nosotros-card-date");
          date.textContent = formatArticuloDate(item.date);
          copy.append(date);
        }
        const title = el("h2", "nosotros-card-title");
        title.textContent = item.title || "";
        const body = el("div", "nosotros-card-body");
        body.innerHTML = item.body || "";
        const more = el("a", "nosotros-card-more");
        more.href = `#/${item.id}`;
        more.textContent = "Ver el artículo completo";
        copy.append(title, body, more);
        card.append(copy);
        reel.append(card);
      });
    }

    wrap.append(reel);
    root.append(wrap);
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
