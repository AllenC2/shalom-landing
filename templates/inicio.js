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
    const aboutData = inicio.about || {};

    if (mode.edit) {
      const note = el("p", "editor-note");
      note.textContent = "Los paquetes y las capillas se editan en sus menús del admin.";
      root.append(note);
    }

    const about = el("section", "about about-hero");
    about.id = "home";
    const layout = el("div", "about-layout");
    layout.append(
      imageFrame(
        "figure",
        "about-photo",
        "inicio.about.image",
        aboutData.image,
        aboutData.alt,
        "inicio.about.alt",
        { width: ShalomModel.MEDIA_WIDTHS.hero, lazy: false, priority: true }
      )
    );

    const aboutCopy = el("div", "about-copy");
    aboutCopy.append(
      text("p", "about-brand", "inicio.about.brand", aboutData.brand || "Servicios Funerarios Shalom"),
      text("h1", "about-title", "inicio.about.title", aboutData.title || "", { multiline: true }),
      text("p", "lede", "inicio.about.lede", aboutData.lede || "", { multiline: true })
    );

    const actions = el("div", "about-actions");
    const packages = el("a", "submit about-cta-packages");
    packages.href = "#/paquetes";
    packages.dataset.field = "inicio.about.ctaPackages";
    packages.textContent = aboutData.ctaPackages || "Ver paquetes";
    const whatsapp = el("a", "whatsapp-link about-cta-whatsapp");
    whatsapp.href = aboutData.whatsappHref || "https://wa.me/523313383886";
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener noreferrer";
    whatsapp.dataset.field = "inicio.about.ctaWhatsapp";
    whatsapp.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24m4.52 10.6c-.25-.12-1.47-.72-1.7-.8-.22-.09-.39-.12-.55.12-.16.25-.64.8-.78.96-.14.17-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.88 2.4 1 2.56.12.17 1.75 2.67 4.23 3.74 2.49 1.07 2.49.71 2.94.66.45-.04 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.29"
        />
      </svg>
    `;
    const waLabel = document.createTextNode(aboutData.ctaWhatsapp || "Enviar un Whatsapp");
    whatsapp.append(waLabel);
    actions.append(packages, whatsapp);
    aboutCopy.append(actions);
    if (mode.edit) {
      aboutCopy.append(
        text("p", "editor-note", "inicio.about.whatsappHref", aboutData.whatsappHref || "https://wa.me/523313383886")
      );
    }

    layout.append(aboutCopy);
    about.append(layout);
    root.append(about);

    const incluye = el("section", "coaches");
    const head = el("div", "section-head");
    if (inicio.incluye.eyebrow) head.append(text("p", "eyebrow", "inicio.incluye.eyebrow", inicio.incluye.eyebrow));
    head.append(text("h2", "", "inicio.incluye.title", inicio.incluye.title, { multiline: true }));
    const scroller = el("div", "scroller chapel-scroller");
    scroller.id = "chapel-scroller";
    scroller.tabIndex = 0;
    scroller.setAttribute("aria-label", "Capillas y servicios");
    (state.capillas || []).filter((item) => !item.hidden).forEach((item) => {
      const card = el("article", `chapel-card${mode.edit ? " is-readonly" : ""}`);
      if (!mode.edit) card.dataset.href = `#/${item.id}`;
      const photo = el("div", "chapel-card-photo");
      photo.append(
        ShalomModel.createImage(item.image, {
          alt: item.alt || item.name,
          width: ShalomModel.MEDIA_WIDTHS.card,
        })
      );
      const body = el("div", "chapel-card-body");
      const name = el("h3");
      name.textContent = item.name;
      const place = el("p", "chapel-card-place");
      place.textContent = [item.colonia, item.municipio].filter(Boolean).join(" · ");
      body.append(name, place);
      const cta = el(mode.edit ? "span" : "a", "chapel-card-cta");
      if (!mode.edit) cta.href = `#/${item.id}`;
      cta.textContent = item.cta || "Contratar";
      card.append(photo, body, cta);
      scroller.append(card);
    });
    const moreCard = el("article", `chapel-card is-more-services${mode.edit ? " is-readonly" : ""}`);
    if (!mode.edit) {
      moreCard.dataset.action = "more-services";
      moreCard.setAttribute("role", "button");
      moreCard.tabIndex = 0;
    }
    moreCard.setAttribute("aria-label", "Más servicios");
    const moreIcon = el("span", "more-services-icon");
    moreIcon.setAttribute("aria-hidden", "true");
    moreIcon.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
    const moreTitle = el("h3");
    moreTitle.textContent = "Más servicios";
    moreCard.append(moreIcon, moreTitle);
    scroller.append(moreCard);
    incluye.append(head, scroller);

    if (!mode.edit) {
      const dialog = document.createElement("dialog");
      dialog.className = "modal more-services-modal";
      dialog.id = "more-services-modal";
      dialog.setAttribute("aria-label", "Más servicios");
      const panel = el("article");
      const modalHead = el("header", "more-services-modal-head");
      const modalTitle = el("h3");
      modalTitle.textContent = "Más servicios";
      const closeBtn = el("button", "icon-btn more-services-modal-close");
      closeBtn.type = "button";
      closeBtn.setAttribute("aria-label", "Cerrar");
      closeBtn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      modalHead.append(modalTitle, closeBtn);
      const list = el("div", "more-services-list");
      list.id = "more-services-list";
      panel.append(modalHead, list);
      dialog.append(panel);
      incluye.append(dialog);
    }
    if (mode.edit) {
      const note = el("p", "editor-note");
      note.textContent = "Las capillas de esta sección se editan en Capillas.";
      incluye.append(note);
    }
    root.append(incluye);

    const contact = el("section", "contact");
    const contactCopy = el("div", "section-copy");
    const contactData = inicio.contact || {};
    contactCopy.append(
      text("p", "eyebrow", "inicio.contact.eyebrow", contactData.eyebrow || ""),
      text("h2", "", "inicio.contact.title", contactData.title || ""),
      text("p", "lede", "inicio.contact.lede", contactData.lede || "", { multiline: true })
    );
    const contactPoints = contactData.points || [];
    if (contactPoints.length || mode.edit) {
      const points = el("ul", "contact-meta");
      (contactPoints.length ? contactPoints : [""]).forEach((point, index) => {
        points.append(text("li", "", `inicio.contact.points.${index}`, point));
      });
      if (contactPoints.length || mode.edit) contactCopy.append(points);
    }
    contact.append(contactCopy);
    if (mode.edit) {
      const formNote = el("p", "editor-note");
      formNote.textContent = "El formulario de contacto se muestra en el sitio público.";
      contact.append(formNote);
    }
    root.append(contact);

    root.append(text("p", "pkg-lead", "inicio.footer", inicio.footer));
    if (mode.edit) {
      const phoneNote = el("p", "editor-note");
      phoneNote.textContent = "Teléfono del footer";
      root.append(
        phoneNote,
        text("p", "pkg-lead", "inicio.contact.phone", contactData.phone || ""),
        text("p", "editor-note", "inicio.contact.phoneHref", contactData.phoneHref || "tel:+523313383886")
      );
    }
  },
});
