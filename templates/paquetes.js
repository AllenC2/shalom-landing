ShalomTemplates.define({
  id: "paquetes",
  label: "Paquetes",
  order: 1,
  singleton: true,
  route: "paquetes",
  key: "paquetes",
  document(state) {
    return state;
  },
  blank() {
    return structuredClone(window.SHALOM_DEFAULT.paquetes);
  },
  pageLabel() {
    return "Paquetes";
  },
  render(root, state, mode) {
    const { el, text } = ShalomTemplates;
    const page = state.paquetes || window.SHALOM_DEFAULT.paquetes;
    const stage = el("div", "stage stage-paquetes page page-paquetes");

    const head = el("header", "section-head programas-head");
    head.append(
      text("p", "eyebrow", "paquetes.eyebrow", page.eyebrow || ""),
      text("h2", "", "paquetes.title", page.title || "", { multiline: true })
    );
    stage.append(head);

    if (mode.edit) {
      const note = el("p", "editor-note");
      note.textContent = "Los paquetes del carrusel se editan en Paquetes.";
      stage.append(note);
    }

    const programs = el("section", "programs");
    programs.id = "servicios";
    programs.setAttribute("aria-label", "Paquetes");
    const scroller = el("div", "scroller");
    scroller.id = "scroller";
    scroller.tabIndex = 0;

    (state.packages || []).filter((pkg) => !pkg.hidden).forEach((pkg) => {
      const article = el("article", `card ${window.ShalomModel.packageCardClass(pkg)}`);
      if (mode.edit) article.classList.add("is-readonly");
      else article.dataset.href = `#/${pkg.id}`;

      const top = el("div", "card-top");
      const tags = el("div", "tags");
      (pkg.tags || []).forEach((tag) => {
        const span = el("span");
        span.textContent = tag;
        tags.append(span);
      });
      const mark = el("span", "mark");
      mark.setAttribute("aria-hidden", "true");
      mark.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.7" /><path d="M6 12c2.2-4 9.8-4 12 0M6 12c2.2 4 9.8 4 12 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>';
      top.append(tags, mark);

      const heading = el("h2");
      heading.append(document.createTextNode(pkg.name), document.createElement("br"));
      const price = el("span", "price");
      price.textContent = pkg.price;
      heading.append(price);

      const blurb = el("p");
      blurb.textContent = pkg.blurb;

      const photo = el("div", "photo");
      const image = document.createElement("img");
      image.src = pkg.image;
      image.alt = pkg.alt || pkg.name;
      photo.append(image);

      if (!mode.edit) {
        const more = el("a", "more");
        more.href = `#/${pkg.id}`;
        more.append(document.createTextNode("Más información"));
        const arrow = el("span", "more-arrow");
        arrow.setAttribute("aria-hidden", "true");
        arrow.innerHTML = '<svg viewBox="0 0 16 16"><path d="M4 8h8M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>';
        more.append(arrow);
        photo.append(more);
      }

      article.append(top, heading, blurb, photo);
      scroller.append(article);
    });

    programs.append(scroller);
    stage.append(programs);
    root.append(stage);
  },
});
