let siteContent = null;
let packages = {};
let templatesReady = false;

function useContent(content) {
  siteContent = content;
  const visible = content.packages.filter((pkg) => !pkg.hidden);
  packages = Object.fromEntries(visible.map((pkg) => [pkg.id, pkg]));
  renderCards();
  fillInicio();
  fillProgramSelect();
}

function cardMark() {
  const mark = document.createElement("span");
  mark.className = "mark";
  mark.setAttribute("aria-hidden", "true");
  mark.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.7" /><path d="M6 12c2.2-4 9.8-4 12 0M6 12c2.2 4 9.8 4 12 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>';
  return mark;
}

function renderCards() {
  const scroller = document.querySelector("#scroller");
  if (!scroller || !siteContent) return;
  scroller.replaceChildren(...siteContent.packages.filter((pkg) => !pkg.hidden).map((pkg) => {
    const article = document.createElement("article");
    article.className = `card ${window.ShalomModel.packageCardClass(pkg)}`;
    article.dataset.href = `#/${pkg.id}`;

    const top = document.createElement("div");
    top.className = "card-top";
    const tags = document.createElement("div");
    tags.className = "tags";
    pkg.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.append(span);
    });
    top.append(tags, cardMark());

    const title = document.createElement("h2");
    title.append(document.createTextNode(pkg.name), document.createElement("br"));
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = pkg.price;
    title.append(price);

    const blurb = document.createElement("p");
    blurb.textContent = pkg.blurb;

    const photo = document.createElement("div");
    photo.className = "photo";
    const image = window.ShalomModel.createImage(pkg.image, {
      alt: pkg.alt || pkg.name,
      width: window.ShalomModel.MEDIA_WIDTHS.card,
    });
    const more = document.createElement("a");
    more.className = "more";
    more.href = `#/${pkg.id}`;
    more.append(document.createTextNode("Más información"));
    const arrow = document.createElement("span");
    arrow.className = "more-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.innerHTML = '<svg viewBox="0 0 16 16"><path d="M4 8h8M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>';
    more.append(arrow);
    photo.append(image, more);

    article.append(top, title, blurb, photo);
    return article;
  }));
}

function fillInicio() {
  if (!siteContent) return;
  const inicio = siteContent.inicio;
  const about = document.querySelector("#home-view .about");
  if (about) {
    about.classList.add("about-hero");
    const brand = about.querySelector(".about-brand");
    if (brand) brand.textContent = inicio.about.brand || "Servicios Funerarios Shalom";
    const title = about.querySelector(".about-title, h1, h2");
    if (title) title.textContent = inicio.about.title;
    const lede = about.querySelector(".lede");
    if (lede) lede.textContent = inicio.about.lede;
    const photo = about.querySelector(".about-photo img");
    if (photo) {
      window.ShalomModel.bindImage(photo, inicio.about.image || "assets/about-equipo.webp", {
        alt: inicio.about.alt || "Equipo de Servicios Funerarios Shalom",
        width: window.ShalomModel.MEDIA_WIDTHS.hero,
        lazy: false,
        priority: true,
      });
    }
    const packages = about.querySelector(".about-cta-packages");
    if (packages) packages.textContent = inicio.about.ctaPackages || "Ver paquetes";
    const whatsapp = about.querySelector(".about-cta-whatsapp");
    if (whatsapp) {
      const label = inicio.about.ctaWhatsapp || "Enviar un Whatsapp";
      const icon = whatsapp.querySelector("svg");
      whatsapp.replaceChildren();
      if (icon) whatsapp.append(icon);
      whatsapp.append(document.createTextNode(label));
      whatsapp.href = inicio.about.whatsappHref || "https://wa.me/523313383886";
    }
  }

  const incluye = document.querySelector("#incluye");
  if (incluye) {
    const incluyeEyebrow = incluye.querySelector(".eyebrow");
    if (incluyeEyebrow) {
      incluyeEyebrow.textContent = inicio.incluye.eyebrow || "";
      incluyeEyebrow.hidden = !inicio.incluye.eyebrow;
    }
    incluye.querySelector("h2").textContent = inicio.incluye.title;
    const scroller = incluye.querySelector("#chapel-scroller, .chapel-scroller");
    if (scroller) {
      const chapels = (siteContent.capillas || []).filter((item) => !item.hidden);
      const cards = chapels.map((item) => {
        const card = document.createElement("article");
        card.className = "chapel-card";
        card.dataset.href = `#/${item.id}`;

        const photo = document.createElement("div");
        photo.className = "chapel-card-photo";
        photo.append(
          window.ShalomModel.createImage(item.image, {
            alt: item.alt || item.name,
            width: window.ShalomModel.MEDIA_WIDTHS.card,
          })
        );

        const body = document.createElement("div");
        body.className = "chapel-card-body";
        const name = document.createElement("h3");
        name.textContent = item.name;
        const place = document.createElement("p");
        place.className = "chapel-card-place";
        place.textContent = [item.colonia, item.municipio].filter(Boolean).join(" · ");
        body.append(name, place);

        const cta = document.createElement("a");
        cta.className = "chapel-card-cta";
        cta.href = `#/${item.id}`;
        cta.textContent = item.cta || "Contratar";

        card.append(photo, body, cta);
        return card;
      });
      const moreCard = document.createElement("article");
      moreCard.className = "chapel-card is-more-services";
      moreCard.dataset.action = "more-services";
      moreCard.setAttribute("role", "button");
      moreCard.tabIndex = 0;
      moreCard.setAttribute("aria-label", "Más servicios");
      const moreIcon = document.createElement("span");
      moreIcon.className = "more-services-icon";
      moreIcon.setAttribute("aria-hidden", "true");
      moreIcon.innerHTML =
        '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
      const moreTitle = document.createElement("h3");
      moreTitle.textContent = "Más servicios";
      moreCard.append(moreIcon, moreTitle);
      cards.push(moreCard);
      scroller.replaceChildren(...cards);
    }
  }

  const contact = document.querySelector("#contact .section-copy");
  if (contact) {
    const data = inicio.contact || {};
    const eyebrow = contact.querySelector(".eyebrow");
    if (eyebrow) {
      eyebrow.textContent = data.eyebrow || "";
      eyebrow.hidden = !data.eyebrow;
    }
    const title = contact.querySelector("h2");
    if (title) title.textContent = data.title || "";
    const lede = contact.querySelector(".lede");
    if (lede) {
      lede.textContent = data.lede || "";
      lede.hidden = !data.lede;
    }
    const meta = contact.querySelector(".contact-meta");
    const points = data.points || [];
    if (!points.length) {
      meta?.replaceChildren();
      meta?.setAttribute("hidden", "");
    } else {
      meta?.removeAttribute("hidden");
      meta?.replaceChildren(...points.map((point) => {
        const item = document.createElement("li");
        item.textContent = point;
        return item;
      }));
    }
  }

  const footText = document.querySelector(".foot .foot-text, .foot p");
  if (footText) footText.textContent = inicio.footer || "";
  const footPhone = document.querySelector(".foot .foot-phone");
  if (footPhone) {
    const phone = inicio.contact?.phone || "";
    footPhone.textContent = phone;
    footPhone.href = inicio.contact?.phoneHref || "tel:+523313383886";
    footPhone.hidden = !phone;
  }
}

function fillProgramSelect() {
  const select = document.querySelector('select[name="program"]');
  if (!select) return;
  const current = select.value;
  const placeholder = new Option("Elegir uno", "");
  select.replaceChildren(placeholder, ...Object.values(packages).map((pkg) => new Option(pkg.name, pkg.id)));
  if (packages[current]) select.value = current;
}

let contentReady = false;
let drag = null;

function activeMoreServicesModal() {
  return (
    document.querySelector("#generated-view:not([hidden]) .more-services-modal") ||
    document.querySelector("#home-view:not([hidden]) .more-services-modal") ||
    document.querySelector("#more-services-modal, .more-services-modal")
  );
}

function fillMoreServicesList(root = document) {
  const list = root.querySelector("#more-services-list, .more-services-list");
  if (!list) return;
  const services = (siteContent?.serviciosCatalog || []).filter((item) => !item.hidden);
  if (!services.length) {
    const empty = document.createElement("p");
    empty.className = "more-services-empty";
    empty.textContent = "Pronto publicaremos más servicios.";
    list.replaceChildren(empty);
    return;
  }
  list.replaceChildren(
    ...services.map((item) => {
      const link = document.createElement("a");
      link.className = "more-services-item";
      link.href = `#/${item.id}`;

      const photo = document.createElement("figure");
      photo.className = "more-services-item-photo";
      photo.append(
        window.ShalomModel.createImage(item.image || "assets/capilla-1.jpg", {
          alt: item.alt || item.name || "Servicio",
          width: window.ShalomModel.MEDIA_WIDTHS.thumb,
        })
      );

      const body = document.createElement("div");
      body.className = "more-services-item-body";
      const title = document.createElement("h4");
      title.textContent = item.name || "";
      body.append(title);

      const tags = (item.features || []).filter(Boolean);
      if (tags.length) {
        const tagsWrap = document.createElement("div");
        tagsWrap.className = "more-services-item-tags";
        tags.forEach((tag) => {
          const pill = document.createElement("span");
          pill.textContent = tag;
          tagsWrap.append(pill);
        });
        body.append(tagsWrap);
      }

      const place = [item.colonia, item.municipio].filter(Boolean).join(" · ");
      if (place) {
        const location = document.createElement("p");
        location.className = "more-services-item-place";
        location.textContent = place;
        body.append(location);
      }

      link.append(photo, body);
      link.addEventListener("click", (event) => {
        const modal = link.closest(".more-services-modal");
        if (modal?.classList.contains("is-arming")) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        closeMoreServicesModal();
      });
      return link;
    })
  );
}

let moreServicesArmTimer = 0;

function armMoreServicesModal(modal, ms = 450) {
  if (!modal) return;
  modal.classList.add("is-arming");
  clearTimeout(moreServicesArmTimer);
  moreServicesArmTimer = window.setTimeout(() => {
    modal.classList.remove("is-arming");
    moreServicesArmTimer = 0;
  }, ms);
}

function openMoreServicesModal() {
  const modal = activeMoreServicesModal();
  if (!modal || modal.open) return;
  wireMoreServicesModal(modal);
  fillMoreServicesList(modal);
  armMoreServicesModal(modal);
  // Defer so the mobile synthetic click from the tap doesn't hit a list item.
  window.setTimeout(() => {
    const current = activeMoreServicesModal();
    if (!current || current.open) return;
    armMoreServicesModal(current);
    if (typeof current.showModal === "function") current.showModal();
    else current.setAttribute("open", "");
  }, 0);
}

function closeMoreServicesModal() {
  clearTimeout(moreServicesArmTimer);
  moreServicesArmTimer = 0;
  document.querySelectorAll(".more-services-modal").forEach((modal) => {
    modal.classList.remove("is-arming");
    if (!modal.open && !modal.hasAttribute("open")) return;
    if (typeof modal.close === "function") modal.close();
    else modal.removeAttribute("open");
  });
}

function wireMoreServicesModal(modal = activeMoreServicesModal()) {
  if (!modal || modal.dataset.wired === "1") return;
  modal.dataset.wired = "1";
  modal.querySelector(".more-services-modal-close")?.addEventListener("click", closeMoreServicesModal);
  modal.addEventListener("click", (event) => {
    if (modal.classList.contains("is-arming")) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.target === modal) closeMoreServicesModal();
  });
}

function openCard(card) {
  if (card?.dataset?.action === "more-services") {
    openMoreServicesModal();
    return;
  }
  const href = card?.dataset?.href;
  if (href) location.hash = href;
}

const views = document.querySelector("#views");
views?.addEventListener("pointerdown", (event) => {
  if (event.button != null && event.button !== 0) return;
  if (event.target.closest("a, button")) return;
  const scroller = event.target.closest(".scroller");
  const card = event.target.closest("article.card, article.chapel-card, .comment-card");
  if (!scroller || !card || !scroller.contains(card)) return;
  drag = {
    id: event.pointerId,
    x: event.clientX,
    left: scroller.scrollLeft,
    moved: false,
    card,
    scroller,
  };
  scroller.setPointerCapture(event.pointerId);
});

views?.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  if (Math.abs(dx) > 6) {
    if (!drag.moved) drag.scroller.classList.add("is-dragging");
    drag.moved = true;
  }
  if (drag.moved) drag.scroller.scrollLeft = drag.left - dx;
});

function endDrag(event) {
  if (!drag || event.pointerId !== drag.id) return;
  const { moved, card, scroller } = drag;
  scroller.classList.remove("is-dragging");
  if (scroller.hasPointerCapture?.(event.pointerId)) {
    scroller.releasePointerCapture(event.pointerId);
  }
  drag = null;
  if (!moved && card && (card.dataset.href || card.dataset.action)) openCard(card);
}

views?.addEventListener("pointerup", endDrag);
views?.addEventListener("pointercancel", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  drag.scroller.classList.remove("is-dragging");
  drag = null;
});

views?.addEventListener("click", (event) => {
  const scroller = event.target.closest(".scroller");
  if (!scroller || event.target.closest("a.more, a.chapel-card-cta")) return;
  const card = event.target.closest("article.card, article.chapel-card");
  if (!card || !scroller.contains(card)) return;
  if (!card.dataset.href && card.dataset.action !== "more-services") return;
  event.preventDefault();
}, true);

// Pause testimonials autoplay while the user is interacting with the scroller.
views?.addEventListener("pointerdown", (event) => {
  const scroller = event.target.closest(".comments-scroller");
  const list = scroller?.closest(".comments-slider, .comments-list");
  if (!list) return;
  stopCommentsAutoplay(list);
}, true);

views?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const moreCard = event.target.closest?.(".chapel-card.is-more-services");
  if (!moreCard) return;
  event.preventDefault();
  openMoreServicesModal();
});

wireMoreServicesModal();

const form = document.querySelector("#trial-form");
const formError = document.querySelector("#form-error");
const formSuccess = document.querySelector("#form-success");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const email = String(data.get("email") || "");
  const valid =
    String(data.get("name") || "").trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    data.get("program") &&
    String(data.get("note") || "").trim();

  formError.hidden = valid;
  formSuccess.hidden = true;
  if (!valid) {
    formError.textContent = "Escriba su nombre, un correo válido, el servicio y un mensaje.";
    formError.hidden = false;
    return;
  }

  const submit = form.querySelector('button[type="submit"]');
  if (submit) submit.disabled = true;
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        program: data.get("program"),
        note: data.get("note"),
        company: data.get("company"),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      formError.textContent = payload.error || "No se pudo enviar el mensaje.";
      formError.hidden = false;
      return;
    }
    form.reset();
    formSuccess.hidden = false;
  } catch {
    formError.textContent = "No se pudo enviar el mensaje. Inténtelo de nuevo.";
    formError.hidden = false;
  } finally {
    if (submit) submit.disabled = false;
  }
});

let activeId = "";
let pendingProgram = "";

function setCta(pkg) {
  const link = document.querySelector("#pkg-cta");
  if (!link) return;
  const href = pkg.ctaHref || "#contact";
  link.href = href;
  if (/^https?:\/\//i.test(href)) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  } else {
    link.removeAttribute("target");
    link.removeAttribute("rel");
  }
  const arrow = link.querySelector(".more-arrow");
  link.replaceChildren(document.createTextNode(`${pkg.cta || "Comprar ahora"} `), arrow);
}

function renderPackage(id) {
  const pkg = packages[id];
  activeId = id;

  const image = document.querySelector("#pkg-image");
  window.ShalomModel.bindImage(image, pkg.image, {
    alt: pkg.alt,
    width: window.ShalomModel.MEDIA_WIDTHS.hero,
    lazy: false,
    priority: true,
  });
  document.querySelector("#pkg-kicker").textContent = pkg.kicker;
  document.querySelector("#pkg-title").textContent = pkg.name;
  document.querySelector("#pkg-lead").textContent = pkg.lead;
  document.querySelector("#pkg-price").textContent = pkg.price;

  const was = document.querySelector("#pkg-was");
  was.hidden = !pkg.compare;
  was.textContent = pkg.compare ? `Precio original ${pkg.compare}` : "";
  setCta(pkg);
  const buy = document.querySelector("#pkg-buy");
  buy.classList.remove("is-gold", "is-luxury");
  const buyMod = window.ShalomModel.packageBuyModifier(pkg);
  if (buyMod) buy.classList.add(buyMod);

  const intro = pkg.paragraphs.filter(Boolean).map((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  });
  const note = document.createElement("p");
  note.className = "package-note";
  note.textContent = pkg.note;
  document.querySelector("#pkg-intro").replaceChildren(...intro, note);

  document.querySelector("#pkg-sections").replaceChildren(
    ...pkg.sections.map((section) => {
      const article = document.createElement("article");
      article.className = "package-section";
      const title = document.createElement("h2");
      title.textContent = section.title;
      const text = document.createElement("p");
      text.textContent = section.text;
      article.append(title, text);
      if (section.items) {
        const list = document.createElement("ul");
        section.items.filter(Boolean).forEach((item) => {
          const entry = document.createElement("li");
          entry.textContent = item;
          list.append(entry);
        });
        article.append(list);
      }
      return article;
    })
  );

  const kicker = document.createElement("p");
  kicker.className = "eyebrow";
  kicker.textContent = pkg.name;
  const heading = document.createElement("h2");
  heading.textContent = pkg.closing;
  const facts = document.createElement("dl");
  facts.className = "package-facts";
  pkg.facts.forEach((fact) => {
    const group = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = fact.label;
    const detail = document.createElement("dd");
    detail.textContent = fact.value;
    group.append(term, detail);
    facts.append(group);
  });
  document.querySelector("#pkg-close").replaceChildren(kicker, heading, facts);
}

document.querySelector("#pkg-info").addEventListener("click", () => {
  pendingProgram = activeId;
});

function renderGenerated(found) {
  const view = document.querySelector("#generated-view");
  view.replaceChildren();
  const pageData = found.page || (found.template.blank ? found.template.blank() : {});
  if (!found.page && found.template.key && siteContent) {
    siteContent[found.template.key] = pageData;
  }
  found.template.render(view, pageData, { edit: false });
  document.querySelector("#home-view").hidden = true;
  document.querySelector("#package-view").hidden = true;
  view.hidden = false;
  document.title = `${window.ShalomTemplates.pageLabel(found.template, pageData)} — Shalom`;
  if (found.template.id === "paquetes") renderCards();
  if (found.template.id === "servicios") wireCommentsSection(view);
  const moreModal = view.querySelector(".more-services-modal");
  if (moreModal) wireMoreServicesModal(moreModal);
  const page = view.querySelector(".page-nosotros, .page-servicios");
  if (page) {
    page.classList.remove("is-ready");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => page.classList.add("is-ready"));
    });
  }
}

document.querySelector("#generated-view").addEventListener("click", (event) => {
  const card = event.target.closest("article.card[data-href]");
  if (!card || event.target.closest("a.more")) return;
  event.preventDefault();
  location.hash = card.dataset.href;
});

function isPaquetesHash(hash = location.hash) {
  return hash === "#/paquetes" || hash === "#paquetes";
}

function setSheetMode(mode) {
  const sheet = document.querySelector(".sheet");
  if (!sheet) return;
  sheet.classList.toggle("is-paquetes", mode === "paquetes");
  sheet.classList.toggle("is-nosotros", mode === "nosotros");
}

const COMMENTS_AUTO_MIN = 5;
const COMMENTS_AUTO_MS = 15_000;

function stopCommentsAutoplay(listEl) {
  if (!listEl?._commentsAutoplay) return;
  clearInterval(listEl._commentsAutoplay);
  listEl._commentsAutoplay = 0;
}

function commentCard(item) {
  const card = document.createElement("blockquote");
  card.className = "comment-card";
  const mark = document.createElement("span");
  mark.className = "comment-card-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "“";
  const message = document.createElement("p");
  message.textContent = item.message || "";
  const cite = document.createElement("cite");
  cite.textContent = item.name || "Familia";
  card.append(mark, message, cite);
  return card;
}

function mountCommentsSlider(listEl, comments) {
  stopCommentsAutoplay(listEl);
  const sorted = [...comments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  listEl.classList.add("comments-slider");
  listEl.replaceChildren();

  const scroller = document.createElement("div");
  scroller.className = "scroller comments-scroller";
  scroller.tabIndex = 0;
  scroller.setAttribute("aria-label", "Testimonios");
  sorted.forEach((item) => scroller.append(commentCard(item)));
  listEl.append(scroller);

  if (sorted.length <= 1) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const autoplay = sorted.length >= COMMENTS_AUTO_MIN && !reduceMotion;
  const nav = document.createElement("div");
  nav.className = "comments-slider-nav";

  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "icon-btn comments-slider-btn";
  prev.setAttribute("aria-label", "Testimonio anterior");
  prev.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 9 12l6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const next = document.createElement("button");
  next.type = "button";
  next.className = "icon-btn comments-slider-btn";
  next.setAttribute("aria-label", "Testimonio siguiente");
  next.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const status = document.createElement("p");
  status.className = "comments-slider-status";
  status.setAttribute("aria-live", "polite");

  const cardStep = () => {
    const card = scroller.querySelector(".comment-card");
    if (!card) return scroller.clientWidth * 0.8;
    const styles = getComputedStyle(scroller);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return card.getBoundingClientRect().width + gap;
  };

  const maxScroll = () => Math.max(0, scroller.scrollWidth - scroller.clientWidth);

  const paint = () => {
    const max = maxScroll();
    const atStart = scroller.scrollLeft <= 4;
    const atEnd = scroller.scrollLeft >= max - 4;
    prev.disabled = !autoplay && atStart;
    next.disabled = !autoplay && atEnd;
    const step = Math.max(cardStep(), 1);
    const index = Math.round(scroller.scrollLeft / step) + 1;
    const total = sorted.length;
    status.textContent = `${Math.min(index, total)} / ${total}`;
  };

  const scrollByCards = (direction, fromUser = false) => {
    const max = maxScroll();
    if (max <= 0) return;
    let left = scroller.scrollLeft + direction * cardStep();
    if (autoplay) {
      if (left > max + 2) left = 0;
      if (left < -2) left = max;
    } else {
      left = Math.max(0, Math.min(max, left));
    }
    scroller.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
    if (fromUser && autoplay) restartAutoplay();
  };

  const restartAutoplay = () => {
    stopCommentsAutoplay(listEl);
    listEl._commentsAutoplay = setInterval(() => {
      scrollByCards(1);
    }, COMMENTS_AUTO_MS);
  };

  prev.addEventListener("click", () => scrollByCards(-1, true));
  next.addEventListener("click", () => scrollByCards(1, true));
  scroller.addEventListener("scroll", () => {
    window.clearTimeout(scroller._commentsScrollPaint);
    scroller._commentsScrollPaint = window.setTimeout(paint, 40);
  }, { passive: true });

  nav.append(prev, status, next);
  listEl.append(nav);
  paint();

  if (autoplay) restartAutoplay();
}

async function loadApprovedComments(listEl) {
  if (!listEl) return;
  stopCommentsAutoplay(listEl);
  listEl.classList.remove("comments-slider");
  listEl.replaceChildren();
  const loading = document.createElement("p");
  loading.className = "comments-empty";
  loading.textContent = "Cargando comentarios…";
  listEl.append(loading);
  try {
    const response = await fetch("/api/comments");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "error");
    const comments = Array.isArray(payload.comments) ? payload.comments : [];
    listEl.replaceChildren();
    if (!comments.length) {
      const empty = document.createElement("p");
      empty.className = "comments-empty";
      empty.textContent = "Aún no hay comentarios publicados.";
      listEl.append(empty);
      return;
    }
    mountCommentsSlider(listEl, comments);
  } catch {
    listEl.replaceChildren();
    const error = document.createElement("p");
    error.className = "comments-empty";
    error.textContent = "No se pudieron cargar los comentarios.";
    listEl.append(error);
  }
}

function wireCommentsSection(root) {
  const list = root.querySelector("#comments-list");
  const form = root.querySelector("#comments-form");
  const modal = root.querySelector("#comments-modal");
  const openBtn = root.querySelector("#comments-open");
  const closeBtn = root.querySelector(".comments-modal-close");
  loadApprovedComments(list);

  if (modal && openBtn && modal.dataset.wired !== "1") {
    modal.dataset.wired = "1";
    const openModal = () => {
      if (typeof modal.showModal === "function") modal.showModal();
      else modal.setAttribute("open", "");
      const first = form?.querySelector("input[name='name']");
      if (first) requestAnimationFrame(() => first.focus());
    };
    const closeModal = () => {
      if (typeof modal.close === "function") modal.close();
      else modal.removeAttribute("open");
    };
    openBtn.addEventListener("click", openModal);
    closeBtn?.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
  }

  if (!form || form.dataset.wired === "1") return;
  form.dataset.wired = "1";
  const errorEl = form.querySelector("#comments-error");
  const successEl = form.querySelector("#comments-success");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (errorEl) errorEl.hidden = true;
    if (successEl) successEl.hidden = true;
    if (name.length < 2 || message.length < 8) {
      if (errorEl) {
        errorEl.textContent = "Escriba su nombre y un comentario de al menos unas palabras.";
        errorEl.hidden = false;
      }
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          message,
          company: data.get("company"),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (errorEl) {
          errorEl.textContent = payload.error || "No se pudo enviar el comentario.";
          errorEl.hidden = false;
        }
        return;
      }
      form.reset();
      if (successEl) successEl.hidden = false;
    } catch {
      if (errorEl) {
        errorEl.textContent = "No se pudo enviar el comentario. Inténtelo de nuevo.";
        errorEl.hidden = false;
      }
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

function applyRoute() {
  const id = packageId(location.hash);
  const home = document.querySelector("#home-view");
  const view = document.querySelector("#package-view");
  const generated = document.querySelector("#generated-view");

  if (id) {
    setSheetMode(null);
    renderPackage(id);
    home.hidden = true;
    view.hidden = false;
    if (generated) generated.hidden = true;
    document.title = `${packages[id].name} — Shalom`;
    trackAnalyticsPage(null);
    return;
  }

  if (location.hash === "#paquetes") {
    location.replace("#/paquetes");
    return;
  }

  const slug = String(location.hash || "").match(/^#\/([a-z0-9-]+)$/)?.[1] || "";
  const found = slug && window.ShalomTemplates ? window.ShalomTemplates.findPage(siteContent, slug) : null;
  if (found && found.template.id !== "paquete") {
    if (found.template.id === "articulo" && found.page?.hidden) {
      location.hash = "#/nosotros";
      return;
    }
    if (found.template.id === "articulo" && found.page?.id) lastArticuloId = found.page.id;
    setSheetMode(
      found.template.id === "paquetes" ? "paquetes" : found.template.id === "nosotros" ? "nosotros" : null
    );
    renderGenerated(found);
    trackAnalyticsPage(found.template.id === "nosotros" || slug === "nosotros" ? "nosotros" : null);
    return;
  }
  if (slug && !templatesReady && !found) {
    return;
  }

  setSheetMode(null);
  view.hidden = true;
  if (generated) generated.hidden = true;
  home.hidden = false;
  document.title = "Shalom — Servicios funerarios";
  trackAnalyticsPage("inicio");

  if (pendingProgram) {
    document.querySelector('select[name="program"]').value = pendingProgram;
    pendingProgram = "";
  }
}

function packageId(hash) {
  const id = String(hash || "").match(/^#\/([a-z0-9-]+)$/)?.[1] || "";
  return id && packages[id] ? id : "";
}

let lastArticuloId = "";

function articuloFromHash(hash = location.hash) {
  const id = String(hash || "").match(/^#\/([a-z0-9-]+)$/)?.[1] || "";
  if (!id || !siteContent) return null;
  return (siteContent.articulos || []).find((item) => item.id === id && !item.hidden) || null;
}

function cardImage(id) {
  const link = document.querySelector(`a.more[href="#/${id}"]`);
  return link?.closest(".photo") || null;
}

function clearPhotoName() {
  document.querySelectorAll(".vt-photo").forEach((image) => image.classList.remove("vt-photo"));
}

function clearArticuloVt() {
  document.querySelectorAll(".vt-articulo-media").forEach((node) => {
    node.classList.remove("vt-articulo-media");
  });
  document.documentElement.classList.remove("vt-articulo-active");
}

function settleScroll() {
  const sheet = document.querySelector(".sheet");
  if (!sheet) return;
  if (isPaquetesHash(location.hash) || location.hash === "#/nosotros") {
    sheet.scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  const hash = location.hash || "";
  // Ignore SPA routes like #/servicios — they are not element ids.
  const target =
    !packageId(hash) && /^#[a-zA-Z][\w-]*$/.test(hash) ? document.querySelector(hash) : null;
  const top = target
    ? target.getBoundingClientRect().top - sheet.getBoundingClientRect().top + sheet.scrollTop
    : 0;
  sheet.scrollTo({ top, behavior: "instant" });
}

function armOutgoing(oldHash, newHash) {
  clearPhotoName();
  clearArticuloVt();
  const oldId = packageId(oldHash);
  const newId = packageId(newHash);
  if (oldId) {
    document.querySelector(".package-photo")?.classList.add("vt-photo");
    return;
  }
  if (newId) {
    cardImage(newId)?.classList.add("vt-photo");
    return;
  }

  const fromArticulo = articuloFromHash(oldHash);
  const toArticulo = articuloFromHash(newHash);
  if (fromArticulo) {
    document.querySelector(".articulo-cover")?.classList.add("vt-articulo-media");
    document.documentElement.classList.add("vt-articulo-active");
    return;
  }
  if (toArticulo) {
    const card = document.querySelector(`.nosotros-card[data-articulo-id="${toArticulo.id}"]`);
    card?.querySelector(".nosotros-card-cover")?.classList.add("vt-articulo-media");
    document.documentElement.classList.add("vt-articulo-active");
  }
}

function armIncoming() {
  clearPhotoName();
  document.querySelectorAll(".vt-articulo-media").forEach((node) => {
    node.classList.remove("vt-articulo-media");
  });
  const nextId = packageId(location.hash);
  if (nextId) {
    document.querySelector(".package-photo")?.classList.add("vt-photo");
    return;
  }
  const articulo = articuloFromHash(location.hash);
  if (articulo) {
    document.querySelector(".articulo-cover")?.classList.add("vt-articulo-media");
    document.documentElement.classList.add("vt-articulo-active");
    return;
  }
  if (location.hash === "#/nosotros" && lastArticuloId) {
    document
      .querySelector(`.nosotros-card[data-articulo-id="${lastArticuloId}"] .nosotros-card-cover`)
      ?.classList.add("vt-articulo-media");
    document.documentElement.classList.add("vt-articulo-active");
  }
  const returnsToCards = isPaquetesHash() || location.hash === "#home" || location.hash === "";
  if (activeId && returnsToCards) cardImage(activeId)?.classList.add("vt-photo");
}

function transitionRoute(event) {
  const oldHash = event?.oldURL ? new URL(event.oldURL).hash : "";
  const newHash = location.hash;
  const involvesPackage = packageId(oldHash) || packageId(newHash);
  const involvesArticulo = Boolean(articuloFromHash(oldHash) || articuloFromHash(newHash));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const update = () => {
    applyRoute();
    armIncoming();
  };

  if ((!involvesPackage && !involvesArticulo) || reduce || typeof document.startViewTransition !== "function") {
    update();
    clearPhotoName();
    clearArticuloVt();
    settleScroll();
    return;
  }

  armOutgoing(oldHash, newHash);
  let transition;
  try {
    transition = document.startViewTransition(update);
  } catch (error) {
    update();
    clearPhotoName();
    clearArticuloVt();
    settleScroll();
    return;
  }
  transition.ready.catch(() => {});
  transition.finished.finally(() => {
    clearPhotoName();
    clearArticuloVt();
    settleScroll();
  });
}

window.addEventListener("hashchange", () => {
  if (!contentReady) return;
  closeBentoMenu();
  transitionRoute();
});

const bentoMenu = document.querySelector("#bento-menu");
const bentoToggle = document.querySelector("#bento-toggle");

function setBentoExpanded(open) {
  if (!bentoToggle) return;
  bentoToggle.setAttribute("aria-expanded", open ? "true" : "false");
  bentoToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}

function openBentoMenu() {
  if (!bentoMenu || bentoMenu.open) return;
  if (typeof bentoMenu.showModal === "function") bentoMenu.showModal();
  else bentoMenu.setAttribute("open", "");
  setBentoExpanded(true);
}

function closeBentoMenu() {
  if (!bentoMenu || !bentoMenu.open) return;
  if (typeof bentoMenu.close === "function") bentoMenu.close();
  else bentoMenu.removeAttribute("open");
  setBentoExpanded(false);
}

if (bentoToggle && bentoMenu) {
  bentoToggle.addEventListener("click", () => {
    if (bentoMenu.open) closeBentoMenu();
    else openBentoMenu();
  });

  bentoMenu.querySelector(".bento-close")?.addEventListener("click", closeBentoMenu);

  bentoMenu.addEventListener("click", (event) => {
    if (event.target === bentoMenu) closeBentoMenu();
  });

  bentoMenu.addEventListener("close", () => setBentoExpanded(false));

  bentoMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeBentoMenu());
  });

  window.matchMedia("(max-width: 860px)").addEventListener("change", (event) => {
    if (!event.matches) closeBentoMenu();
  });
}

function markContentReady() {
  contentReady = true;
  document.documentElement.dataset.ready = "1";
  document.body.classList.remove("is-booting");
  document.body.classList.add("is-content-ready");
  const boot = document.querySelector("#boot-skeleton");
  if (boot) boot.hidden = true;
  const views = document.querySelector("#views");
  if (views) views.hidden = false;
}

document.body.classList.add("is-booting");

window.ShalomModel.loadContent()
  .then(async (content) => {
    if (window.ShalomTemplates) await window.ShalomTemplates.load();
    templatesReady = true;
    useContent(content);
    if (window.ShalomTemplates) window.ShalomTemplates.prepare(siteContent);
    applyRoute();
    if (pendingProgram && packages[pendingProgram]) {
      const program = document.querySelector('select[name="program"]');
      if (program) program.value = pendingProgram;
    }
    markContentReady();
  })
  .catch((error) => {
    console.error(error);
    templatesReady = true;
    try {
      useContent(structuredClone(window.SHALOM_DEFAULT));
      if (window.ShalomTemplates) window.ShalomTemplates.prepare(siteContent);
      applyRoute();
    } catch (routeError) {
      console.error(routeError);
    }
    markContentReady();
  });

/* ——— Local analytics (inicio / nosotros) ——— */
const ANALYTICS_PAGES = new Set(["inicio", "nosotros"]);
let analyticsPage = null;
let analyticsVisibleSince = 0;
let analyticsDwellMs = 0;

function analyticsDayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sendAnalytics(payload, useBeacon = false) {
  const body = JSON.stringify(payload);
  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics", blob);
    return;
  }
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function pauseAnalyticsDwell() {
  if (!analyticsPage || !analyticsVisibleSince) return;
  analyticsDwellMs += Math.max(0, Date.now() - analyticsVisibleSince);
  analyticsVisibleSince = 0;
}

function resumeAnalyticsDwell() {
  if (!analyticsPage || document.visibilityState !== "visible") return;
  analyticsVisibleSince = Date.now();
}

function flushAnalyticsDwell(useBeacon = false) {
  pauseAnalyticsDwell();
  if (!analyticsPage || analyticsDwellMs < 2000) {
    analyticsDwellMs = 0;
    return;
  }
  const ms = analyticsDwellMs;
  analyticsDwellMs = 0;
  sendAnalytics({ page: analyticsPage, type: "dwell", ms }, useBeacon);
}

function trackAnalyticsPage(page) {
  if (analyticsPage === page) return;
  flushAnalyticsDwell();
  analyticsPage = ANALYTICS_PAGES.has(page) ? page : null;
  analyticsDwellMs = 0;
  analyticsVisibleSince = 0;
  if (!analyticsPage) return;

  const key = `analytics:pv:${analyticsPage}:${analyticsDayKey()}`;
  try {
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      sendAnalytics({ page: analyticsPage, type: "view" });
    }
  } catch {
    sendAnalytics({ page: analyticsPage, type: "view" });
  }
  resumeAnalyticsDwell();
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    pauseAnalyticsDwell();
    flushAnalyticsDwell(true);
  } else {
    resumeAnalyticsDwell();
  }
});

window.addEventListener("pagehide", () => {
  pauseAnalyticsDwell();
  flushAnalyticsDwell(true);
});
