ShalomTemplates.define({
  id: "paquete",
  label: "Plantilla paquete",
  order: 1,
  dashboard: false,
  blueprintKey: "template",
  pagesKey: "packages",
  blank() {
    return structuredClone(window.SHALOM_DEFAULT.template);
  },
  normalize(page) {
    return window.ShalomModel.createPaquete(page);
  },
  clone(source, name, ids) {
    return window.ShalomModel.clonePaquete(source, name, ids);
  },
  pageLabel(page) {
    return page.name;
  },
  render(root, pkg, mode) {
    const { el, text, imageFrame, addControl, removeControl } = ShalomTemplates;
    const theme = window.ShalomModel.packageTheme(pkg);
    const buyMod = window.ShalomModel.packageBuyModifier(pkg);
    const article = el("article", "package");

    const back = el("a", "back");
    back.href = "#/paquetes";
    back.textContent = "Paquetes";

    if (mode.edit) {
      const themes = el("div", "theme-picker");
      const label = el("p", "theme-picker-label");
      label.textContent = "Tema / color";
      const swatches = el("div", "theme-picker-swatches");
      [
        ["sand", "Blanco"],
        ["gold", "Dorado"],
        ["luxury", "Café"],
      ].forEach(([id, name]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `theme-swatch theme-swatch-${id}${theme === id ? " is-active" : ""}`;
        button.dataset.theme = id;
        button.setAttribute("aria-pressed", theme === id ? "true" : "false");
        button.textContent = name;
        swatches.append(button);
      });
      themes.append(label, swatches);
      article.append(themes);
    }

    const layout = el("div", "package-layout");
    const buy = el("div", `package-buy${buyMod ? ` ${buyMod}` : ""}`);
    const prices = el("div", "pkg-prices");
    prices.append(
      text("p", "pkg-price", "price", pkg.price),
      text("p", "pkg-was", "compare", pkg.compare)
    );
    const cta = el("a", "submit pkg-cta");
    const href = pkg.ctaHref || "#contact";
    cta.href = href;
    if (mode.edit) {
      cta.addEventListener("click", (event) => event.preventDefault());
    } else if (/^https?:\/\//i.test(href)) {
      cta.target = "_blank";
      cta.rel = "noopener noreferrer";
    }
    cta.append(text("span", "pkg-cta-label", "cta", pkg.cta || "Comprar ahora"));
    const arrow = el("span", "more-arrow");
    arrow.setAttribute("aria-hidden", "true");
    arrow.innerHTML = '<svg viewBox="0 0 16 16"><path d="M4 8h8M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>';
    cta.append(arrow);

    buy.append(
      text("p", "eyebrow", "kicker", pkg.kicker),
      text("h1", "", "name", pkg.name),
      text("p", "pkg-lead", "lead", pkg.lead, { multiline: true }),
      prices,
      cta
    );
    if (mode.edit) {
      const hrefRow = el("div", "pkg-cta-href");
      const hrefLabel = el("span", "pkg-cta-href-label");
      hrefLabel.textContent = "Enlace del botón";
      hrefRow.append(hrefLabel, text("span", "pkg-cta-href-field", "ctaHref", pkg.ctaHref || "#contact"));
      buy.append(hrefRow);
    }
    layout.append(
      imageFrame("figure", "package-photo", "image", pkg.image, pkg.alt, "alt", {
        width: window.ShalomModel.MEDIA_WIDTHS.hero,
        lazy: false,
        priority: true,
      }),
      buy
    );

    const intro = el("div", "package-intro");
    pkg.paragraphs.forEach((paragraph, index) => {
      if (mode.edit) {
        const row = el("div", "edit-row");
        row.append(
          text("div", "edit-row-field", `paragraphs.${index}`, paragraph, { multiline: true }),
          removeControl("×", `paragraphs.${index}`, {
            className: "icon-action icon-secondary",
            icon: "×",
            label: "Quitar párrafo",
          })
        );
        intro.append(row);
      } else {
        intro.append(text("p", "", `paragraphs.${index}`, paragraph, { multiline: true }));
      }
    });
    intro.append(text("p", "package-note", "note", pkg.note));
    if (mode.edit) {
      const introTools = el("div", "editor-actions");
      introTools.append(addControl("Agregar párrafo", "paragraphs", "", {
        className: "text-action text-action-accent",
        icon: "+",
        showLabel: true,
        label: "Agregar párrafo",
      }));
      intro.append(introTools);
    }

    const sections = el("div", "package-sections");
    pkg.sections.forEach((section, sectionIndex) => {
      const block = el("article", `package-section${mode.edit ? " is-editable" : ""}`);
      if (mode.edit) {
        block.append(removeControl("−", `sections.${sectionIndex}`, {
          className: "icon-action icon-danger section-remove",
          icon: "−",
          label: "Quitar sección",
        }));
      }
      const list = el("ul");
      section.items.forEach((item, itemIndex) => {
        if (mode.edit) {
          const entry = el("li", "edit-row");
          entry.append(
            text("span", "edit-row-field", `sections.${sectionIndex}.items.${itemIndex}`, item),
            removeControl("×", `sections.${sectionIndex}.items.${itemIndex}`, {
              className: "icon-action icon-secondary",
              icon: "×",
              label: "Quitar elemento",
            })
          );
          list.append(entry);
        } else {
          list.append(text("li", "", `sections.${sectionIndex}.items.${itemIndex}`, item));
        }
      });
      block.append(
        text("h2", "", `sections.${sectionIndex}.title`, section.title),
        text("p", "", `sections.${sectionIndex}.text`, section.text, { multiline: true }),
        list
      );
      if (mode.edit) {
        const tools = el("div", "editor-actions");
        tools.append(addControl("Agregar elemento", `sections.${sectionIndex}.items`, "", {
          className: "text-action text-action-accent",
          icon: "+",
          showLabel: true,
          label: "Agregar elemento",
        }));
        block.append(tools);
      }
      sections.append(block);
    });

    const close = el("div", "package-close");
    const closeKicker = el("p", "eyebrow");
    closeKicker.textContent = pkg.name || "Paquete";
    const facts = el("dl", "package-facts");
    pkg.facts.forEach((fact, index) => {
      const group = el("div");
      group.append(
        text("dt", "", `facts.${index}.label`, fact.label),
        text("dd", "", `facts.${index}.value`, fact.value)
      );
      facts.append(group);
    });
    close.append(closeKicker, text("h2", "", "closing", pkg.closing, { multiline: true }), facts);

    article.prepend(back);
    article.append(layout, intro, sections);
    if (mode.edit) {
      const more = el("div", "editor-actions");
      more.append(addControl("Agregar sección", "sections", { title: "Nueva sección", text: "", items: [] }, {
        className: "text-action text-action-accent",
        icon: "+",
        showLabel: true,
        label: "Agregar sección",
      }));
      article.append(more);
    }
    article.append(close);
    root.append(article);
  },
});
