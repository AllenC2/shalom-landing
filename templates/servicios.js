ShalomTemplates.define({
  id: "servicios",
  label: "Servicios",
  order: 2,
  singleton: true,
  route: "servicios",
  key: "servicios",
  document(state) {
    return state;
  },
  blank() {
    return structuredClone(window.SHALOM_DEFAULT?.servicios || {});
  },
  pageLabel() {
    return "Servicios";
  },
  render(root, state, mode) {
    const { el, text, imageFrame } = ShalomTemplates;
    const page = state.servicios || window.SHALOM_DEFAULT?.servicios || {};
    const article = el("article", "page page-nosotros page-servicios");

    const close = el("section", "nosotros-close");
    if (page.mapImage || mode.edit) {
      close.append(
        imageFrame("figure", "nosotros-map", "servicios.mapImage", page.mapImage, page.mapAlt, "servicios.mapAlt", {
          width: window.ShalomModel.MEDIA_WIDTHS.content,
        })
      );
    }
    const closeCopy = el("div", "nosotros-close-copy");
    closeCopy.append(
      text("h2", "", "servicios.sectionTitle", page.sectionTitle),
      text("p", "nosotros-body", "servicios.sectionBody", page.sectionBody, { multiline: true }),
      text("p", "nosotros-emphasis", "servicios.emphasis", page.emphasis)
    );
    close.append(closeCopy);

    const incluye = state.inicio?.incluye || window.SHALOM_DEFAULT?.inicio?.incluye || {};
    const chapels = (state.capillas || []).filter((item) => !item.hidden);
    const chapelSection = el("section", "coaches servicios-chapels");
    const chapelHead = el("div", "section-head");
    if (incluye.eyebrow || mode.edit) {
      const eyebrow = text("p", "eyebrow", "inicio.incluye.eyebrow", incluye.eyebrow || "");
      if (!incluye.eyebrow && !mode.edit) eyebrow.hidden = true;
      chapelHead.append(eyebrow);
    }
    chapelHead.append(
      text("h2", "", "inicio.incluye.title", incluye.title || "Capillas y servicios a domicilio", {
        multiline: true,
      })
    );
    const scroller = el("div", "scroller chapel-scroller");
    scroller.tabIndex = 0;
    scroller.setAttribute("aria-label", "Capillas y servicios");
    chapels.forEach((item) => {
      const card = el("article", `chapel-card${mode.edit ? " is-readonly" : ""}`);
      if (!mode.edit) card.dataset.href = `#/${item.id}`;
      const photo = el("div", "chapel-card-photo");
      photo.append(
        window.ShalomModel.createImage(item.image, {
          alt: item.alt || item.name,
          width: window.ShalomModel.MEDIA_WIDTHS.card,
        })
      );
      const body = el("div", "chapel-card-body");
      const name = el("h3");
      name.textContent = item.name;
      const place = el("p", "chapel-card-place");
      place.textContent = [item.colonia, item.municipio].filter(Boolean).join(" · ");
      body.append(name, place);
      const cardCta = el(mode.edit ? "span" : "a", "chapel-card-cta");
      if (!mode.edit) cardCta.href = `#/${item.id}`;
      cardCta.textContent = item.cta || "Contratar";
      card.append(photo, body, cardCta);
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
    chapelSection.append(chapelHead, scroller);
    if (!mode.edit) {
      const dialog = document.createElement("dialog");
      dialog.className = "modal more-services-modal";
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
      panel.append(modalHead, list);
      dialog.append(panel);
      chapelSection.append(dialog);
    }
    if (mode.edit) {
      const note = el("p", "editor-note");
      note.textContent = "Las capillas de este carrusel se editan en Capillas. El título se comparte con Inicio.";
      chapelSection.append(note);
    }

    const cta = el("div", "nosotros-cta");
    if (page.ctaLede || mode.edit) {
      cta.append(text("p", "nosotros-cta-lede", "servicios.ctaLede", page.ctaLede || ""));
    }
    const actions = el("div", "nosotros-cta-actions");
    const packages = el("a", "nosotros-cta-link");
    packages.href = "#/paquetes";
    packages.dataset.field = "servicios.ctaPackages";
    packages.textContent = page.ctaPackages || "Ver paquetes";
    const contact = el("a", "nosotros-cta-link is-quiet");
    contact.href = "#contact";
    contact.dataset.field = "servicios.ctaContact";
    contact.textContent = page.ctaContact || "Pedir información";
    actions.append(packages, contact);
    cta.append(actions);

    const comments = el("section", "comments-section");
    const commentsHead = el("header", "comments-head");
    commentsHead.append(
      text("p", "comments-eyebrow eyebrow", "servicios.commentsEyebrow", page.commentsEyebrow || "Comentarios"),
      text("h2", "comments-title", "servicios.commentsTitle", page.commentsTitle || "Testimonios", {
        multiline: true,
      }),
      text("p", "comments-lede", "servicios.commentsLede", page.commentsLede || "", { multiline: true })
    );
    const list = el("div", "comments-list");
    list.id = "comments-list";
    list.setAttribute("aria-live", "polite");
    if (mode.edit) {
      const note = el("p", "editor-note");
      note.textContent = "Los comentarios publicados se moderan en el menú Comentarios del admin.";
      list.append(note);
    }

    const openWrap = el("div", "comments-open-wrap");
    const openBtn = el("button", "submit comments-open-btn");
    openBtn.type = "button";
    openBtn.id = "comments-open";
    openBtn.dataset.field = "servicios.commentsCta";
    openBtn.textContent = page.commentsCta || "Dejar mis comentarios";
    openWrap.append(openBtn);

    const dialog = document.createElement("dialog");
    dialog.className = "modal comments-modal";
    dialog.id = "comments-modal";
    const panel = el("article", "comments-modal-panel");
    const modalHead = el("div", "comments-modal-head");
    const title = text("h3", "", "servicios.commentsFormTitle", page.commentsFormTitle || "Deje su comentario");
    const closeBtn = el("button", "icon-btn comments-modal-close");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Cerrar");
    closeBtn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    modalHead.append(title, closeBtn);

    if (mode.edit) {
      panel.append(modalHead, text("p", "editor-note", "servicios.commentsSuccess", page.commentsSuccess || ""));
      openBtn.disabled = true;
      openBtn.title = "En el sitio público este botón abre el formulario.";
    } else {
      const form = el("form", "comments-form");
      form.id = "comments-form";
      form.noValidate = true;
      form.innerHTML = `
        <label>Nombre
          <input name="name" type="text" autocomplete="name" required maxlength="80" />
        </label>
        <label>Comentario
          <textarea name="message" rows="4" required maxlength="800"></textarea>
        </label>
        <label class="hp" aria-hidden="true">Empresa
          <input name="company" type="text" tabindex="-1" autocomplete="off" />
        </label>
        <p class="comments-error" id="comments-error" hidden></p>
        <p class="comments-success" id="comments-success" hidden></p>
        <button class="submit" type="submit">Enviar comentario</button>
      `;
      const success = form.querySelector("#comments-success");
      success.textContent =
        page.commentsSuccess || "Gracias. Su comentario quedó registrado y será revisado antes de publicarse.";
      panel.append(modalHead, form);
    }

    dialog.append(panel);
    comments.append(commentsHead, list, openWrap, dialog);

    article.append(close, chapelSection, cta, comments);
    root.append(article);
  },
});
