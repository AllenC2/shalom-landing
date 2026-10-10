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
    const catalog = (state.serviciosCatalog || []).filter((item) => !item.hidden);
    const article = el("article", "page page-nosotros page-servicios");

    const close = el("section", "nosotros-close");
    if (page.mapImage || mode.edit) {
      close.append(
        imageFrame("figure", "nosotros-map", "servicios.mapImage", page.mapImage, page.mapAlt, "servicios.mapAlt")
      );
    }
    const closeCopy = el("div", "nosotros-close-copy");
    closeCopy.append(
      text("h2", "", "servicios.sectionTitle", page.sectionTitle),
      text("p", "nosotros-body", "servicios.sectionBody", page.sectionBody, { multiline: true }),
      text("p", "nosotros-emphasis", "servicios.emphasis", page.emphasis)
    );
    close.append(closeCopy);

    const catalogSection = el("section", "servicios-catalog");
    const catalogHead = el("header", "servicios-catalog-head");
    if (page.catalogEyebrow || mode.edit) {
      catalogHead.append(
        text("p", "eyebrow", "servicios.catalogEyebrow", page.catalogEyebrow || "Servicios")
      );
    }
    catalogHead.append(
      text("h2", "", "servicios.catalogTitle", page.catalogTitle || "Nuestros servicios", {
        multiline: true,
      })
    );
    if (page.catalogLede || mode.edit) {
      catalogHead.append(
        text("p", "lede", "servicios.catalogLede", page.catalogLede || "", { multiline: true })
      );
    }

    const grid = el("div", "servicios-catalog-grid");
    catalog.forEach((item) => {
      const card = el(mode.edit ? "article" : "a", `servicios-catalog-card${mode.edit ? " is-readonly" : ""}`);
      if (!mode.edit) card.href = `#/${item.id}`;

      const photo = el("figure", "servicios-catalog-photo");
      const image = document.createElement("img");
      image.src = item.image || "assets/capilla-1.jpg";
      image.alt = item.alt || item.name || "Servicio";
      photo.append(image);

      const body = el("div", "servicios-catalog-body");
      const name = el("h3");
      name.textContent = item.name || "";
      const place = el("p", "servicios-catalog-place");
      place.textContent = [item.colonia, item.municipio].filter(Boolean).join(" · ");
      const cta = el("span", "servicios-catalog-cta");
      cta.textContent = item.cta || "Conocer más";
      body.append(name);
      if (place.textContent) body.append(place);
      body.append(cta);
      card.append(photo, body);
      grid.append(card);
    });

    if (catalog.length || mode.edit) {
      catalogSection.append(catalogHead);
      if (mode.edit) {
        const note = el("p", "editor-note");
        note.textContent = "Los servicios de esta sección se editan en el menú Servicios del admin.";
        catalogSection.append(note);
      }
      if (catalog.length) catalogSection.append(grid);
      else {
        const empty = el("p", "editor-note");
        empty.textContent = "Aún no hay servicios visibles. Créelos en el menú Servicios.";
        catalogSection.append(empty);
      }
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

    article.append(close);
    if (catalogSection.childElementCount) article.append(catalogSection);
    article.append(cta, comments);
    root.append(article);
  },
});
