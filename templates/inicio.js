ShalomTemplates.define({
  id: "inicio",
  label: "Inicio",
  order: 0,
  singleton: true,
  document(state) {
    return state;
  },
  render(root, state, mode) {
    const { el, text, imageFrame } = ShalomTemplates;
    const inicio = state.inicio;

    state.inicio.slides.forEach((slide, index) => {
      const block = el(index === 0 ? "section" : "div", index === 0 ? "hero" : "hero-copy");
      const copy = index === 0 ? el("div", "hero-copy") : block;
      copy.append(
        ...(slide.eyebrow || mode.edit
          ? [text("p", "eyebrow", `inicio.slides.${index}.eyebrow`, slide.eyebrow || "")]
          : []),
        text(index === 0 ? "h1" : "h2", "", `inicio.slides.${index}.title`, slide.title, { multiline: true })
      );
      if (index === 0) block.append(copy);
      root.append(block);
    });

    const programs = el("section", "programs");
    const scroller = el("div", "scroller");
    state.packages.filter((pkg) => !pkg.hidden).forEach((pkg) => {
      const article = el("article", `card ${pkg.featured ? "card-lime" : "card-sand"}`);
      if (mode.edit) article.classList.add("is-readonly");
      const top = el("div", "card-top");
      const tags = el("div", "tags");
      pkg.tags.forEach((tag) => {
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

      article.append(top, heading, blurb, photo);
      scroller.append(article);
    });
    programs.append(scroller);
    if (mode.edit) {
      const note = el("p", "editor-note");
      note.textContent = "Los paquetes del carrusel se editan en Paquetes.";
      programs.append(note);
    }
    root.append(programs);

    const about = el("section", "about");
    const layout = el("div", "about-layout");
    const aboutCopy = el("div", "about-copy");
    aboutCopy.append(
      text("p", "eyebrow", "inicio.about.eyebrow", inicio.about.eyebrow),
      text("h2", "", "inicio.about.title", inicio.about.title, { multiline: true }),
      text("p", "lede", "inicio.about.lede", inicio.about.lede, { multiline: true })
    );
    layout.append(
      aboutCopy,
      imageFrame(
        "figure",
        "about-photo",
        "inicio.about.image",
        inicio.about.image,
        inicio.about.alt,
        "inicio.about.alt"
      )
    );
    about.append(layout);
    root.append(about);

    const incluye = el("section", "coaches");
    const head = el("div", "section-head");
    if (inicio.incluye.eyebrow) head.append(text("p", "eyebrow", "inicio.incluye.eyebrow", inicio.incluye.eyebrow));
    head.append(text("h2", "", "inicio.incluye.title", inicio.incluye.title, { multiline: true }));
    const grid = el("div", "coach-grid");
    inicio.incluye.items.forEach((item, index) => {
      const article = el("article", "coach");
      article.append(text("p", "coach-index", `inicio.incluye.items.${index}.index`, item.index));
      if (item.title || mode.edit) article.append(text("h3", "", `inicio.incluye.items.${index}.title`, item.title));
      if (item.role || mode.edit) article.append(text("p", "role", `inicio.incluye.items.${index}.role`, item.role));
      article.append(text("p", "", `inicio.incluye.items.${index}.text`, item.text, { multiline: true }));
      grid.append(article);
    });
    incluye.append(head, grid);
    root.append(incluye);

    const contact = el("section", "contact");
    const contactCopy = el("div", "section-copy");
    contactCopy.append(
      text("p", "eyebrow", "inicio.contact.eyebrow", inicio.contact.eyebrow),
      text("h2", "", "inicio.contact.title", inicio.contact.title),
      text("p", "lede", "inicio.contact.lede", inicio.contact.lede, { multiline: true })
    );
    const contactPoints = inicio.contact.points || [];
    if (contactPoints.length || mode.edit) {
      const points = el("ul", "contact-meta");
      (contactPoints.length ? contactPoints : [""]).forEach((point, index) => {
        points.append(text("li", "", `inicio.contact.points.${index}`, point));
      });
      if (contactPoints.length) contactCopy.append(points);
    }
    contact.append(contactCopy);
    root.append(contact);

    root.append(text("p", "pkg-lead", "inicio.footer", inicio.footer));
  },
});
