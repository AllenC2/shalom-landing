ShalomTemplates.define({
  id: "nosotros",
  label: "Nosotros",
  order: 1,
  singleton: true,
  route: "nosotros",
  key: "nosotros",
  blank() {
    return structuredClone(window.SHALOM_DEFAULT.nosotros);
  },
  pageLabel() {
    return "Nosotros";
  },
  render(root, page, mode) {
    const { el, text, imageFrame } = ShalomTemplates;
    const article = el("article", "page page-nosotros");

    const story = el("div", "nosotros-story");
    const media = el("div", "nosotros-media");
    media.append(
      imageFrame("figure", "nosotros-photo", "image", page.image, page.alt, "alt")
    );

    const copy = el("div", "nosotros-copy");
    const intro = el("header", "nosotros-intro");
    intro.append(
      text("p", "eyebrow", "eyebrow", page.eyebrow),
      text("h1", "", "title", page.title, { multiline: true }),
      text("p", "lede", "lede", page.lede, { multiline: true })
    );

    const chapter = el("section", "nosotros-chapter");
    chapter.append(
      text("h2", "", "brandTitle", page.brandTitle),
      text("p", "nosotros-tagline", "tagline", page.tagline, { multiline: true })
    );

    copy.append(intro, chapter);
    story.append(media, copy);

    const close = el("section", "nosotros-close");
    if (page.mapImage) {
      close.append(
        imageFrame("figure", "nosotros-map", "mapImage", page.mapImage, page.mapAlt, "mapAlt")
      );
    }
    const closeCopy = el("div", "nosotros-close-copy");
    closeCopy.append(
      text("h2", "", "sectionTitle", page.sectionTitle),
      text("p", "nosotros-body", "sectionBody", page.sectionBody, { multiline: true }),
      text("p", "nosotros-emphasis", "emphasis", page.emphasis)
    );
    close.append(closeCopy);

    const cta = el("div", "nosotros-cta");
    if (page.ctaLede) cta.append(text("p", "nosotros-cta-lede", "ctaLede", page.ctaLede));
    const actions = el("div", "nosotros-cta-actions");
    const packages = el("a", "nosotros-cta-link");
    packages.href = "#servicios";
    packages.dataset.field = "ctaPackages";
    packages.textContent = page.ctaPackages || "Ver paquetes";
    const contact = el("a", "nosotros-cta-link is-quiet");
    contact.href = "#contact";
    contact.dataset.field = "ctaContact";
    contact.textContent = page.ctaContact || "Pedir información";
    actions.append(packages, contact);
    cta.append(actions);

    article.append(story, close, cta);
    root.append(article);
  },
});
