ShalomTemplates.define({
  id: "servicio",
  label: "Plantilla servicio",
  order: 3,
  dashboard: false,
  blueprintKey: "servicioTemplate",
  pagesKey: "serviciosCatalog",
  blank() {
    return structuredClone(window.SHALOM_DEFAULT.servicioTemplate);
  },
  normalize(page) {
    return window.ShalomModel.createServicio(page);
  },
  clone(source, name, ids) {
    return window.ShalomModel.cloneServicio(source, name, ids);
  },
  pageLabel(page) {
    return page.name;
  },
  render(root, servicio, mode) {
    const { el, text, imageFrame, addControl, removeControl } = ShalomTemplates;
    const article = el("article", "package page-capilla");

    const back = el("a", "back");
    back.href = mode.edit ? "#/servicios-catalog" : "#home";
    back.textContent = mode.edit ? "Servicios" : "Inicio";

    const layout = el("div", "package-layout capilla-layout");
    const buy = el("div", "package-buy capilla-buy");

    const place = el("p", "capilla-place");
    if (mode.edit) {
      place.append(
        text("span", "capilla-place-part", "colonia", servicio.colonia || "Colonia"),
        document.createTextNode(" · "),
        text("span", "capilla-place-part", "municipio", servicio.municipio || "Municipio")
      );
    } else {
      place.textContent = [servicio.colonia, servicio.municipio].filter(Boolean).join(" · ");
    }

    buy.append(place, text("h1", "", "name", servicio.name));

    const features = el("div", "capilla-features");
    (servicio.features || []).forEach((feature, index) => {
      if (mode.edit) {
        const row = el("div", "capilla-feature-row");
        row.append(
          text("span", "capilla-feature-pill", `features.${index}`, feature, { chip: true }),
          removeControl("×", `features.${index}`, {
            className: "icon-action icon-secondary",
            icon: "×",
            label: "Quitar característica",
          })
        );
        features.append(row);
      } else if (feature) {
        const pill = el("span", "capilla-feature-pill");
        pill.textContent = feature;
        features.append(pill);
      }
    });
    if (mode.edit || (servicio.features || []).some(Boolean)) buy.append(features);
    if (mode.edit) {
      const featureTools = el("div", "editor-actions");
      featureTools.append(addControl("Agregar característica", "features", "Nueva característica", {
        className: "text-action text-action-accent",
        icon: "+",
        showLabel: true,
        label: "Agregar característica",
      }));
      buy.append(featureTools);
    }

    buy.append(text("p", "capilla-description", "description", servicio.description || "", { multiline: true }));

    const wa = el("a", "submit whatsapp-link capilla-whatsapp");
    wa.href = window.ShalomModel.servicioWhatsAppUrl(servicio);
    if (mode.edit) {
      wa.addEventListener("click", (event) => event.preventDefault());
    } else {
      wa.target = "_blank";
      wa.rel = "noopener noreferrer";
    }
    const waIcon = el("span", "capilla-wa-icon");
    waIcon.setAttribute("aria-hidden", "true");
    waIcon.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24m4.52 10.6c-.25-.12-1.47-.72-1.7-.8-.22-.09-.39-.12-.55.12-.16.25-.64.8-.78.96-.14.17-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.88 2.4 1 2.56.12.17 1.75 2.67 4.23 3.74 2.49 1.07 2.49.71 2.94.66.45-.04 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.29"/></svg>';
    wa.append(waIcon, document.createTextNode("Enviar un Whatsapp"));
    buy.append(wa);

    if (mode.edit) {
      const meta = el("div", "capilla-edit-meta");
      meta.append(
        text("span", "pkg-cta-href-field", "whatsapp", servicio.whatsapp || "523313383886"),
        text("span", "pkg-cta-href-field", "whatsappMessage", servicio.whatsappMessage || "")
      );
      const hints = el("p", "editor-note");
      hints.textContent = "Arriba: teléfono WhatsApp (con lada) y mensaje prellenado opcional.";
      buy.append(meta, hints);
    }

    layout.append(
      imageFrame("figure", "package-photo", "image", servicio.image, servicio.alt, "alt", {
        width: window.ShalomModel.MEDIA_WIDTHS.hero,
        lazy: false,
        priority: true,
      }),
      buy
    );

    const gallery = el("div", "capilla-gallery");
    const galleryTitle = el("h2", "capilla-gallery-title");
    galleryTitle.textContent = "Fotos";
    gallery.append(galleryTitle);
    const grid = el("div", "capilla-gallery-grid");
    (servicio.images || []).forEach((src, index) => {
      if (mode.edit) {
        const row = el("div", "capilla-gallery-item is-editable");
        row.append(
          imageFrame("figure", "capilla-gallery-photo", `images.${index}`, src, servicio.alt || servicio.name, "alt"),
          removeControl("×", `images.${index}`, {
            className: "icon-action icon-secondary",
            icon: "×",
            label: "Quitar foto",
          })
        );
        grid.append(row);
      } else {
        const figure = el("figure", "capilla-gallery-photo");
        figure.append(
          window.ShalomModel.createImage(src, {
            alt: `${servicio.name || "Servicio"} — foto ${index + 1}`,
            width: window.ShalomModel.MEDIA_WIDTHS.content,
            lazy: index > 0,
            priority: index === 0,
          })
        );
        grid.append(figure);
      }
    });
    gallery.append(grid);
    if (mode.edit) {
      const tools = el("div", "editor-actions");
      tools.append(addControl("Agregar foto", "images", "assets/capilla-1.jpg", {
        className: "text-action text-action-accent",
        icon: "+",
        showLabel: true,
        label: "Agregar foto",
      }));
      gallery.append(tools);
    }

    article.append(back, layout, gallery);
    root.append(article);
  },
});
