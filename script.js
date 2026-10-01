let siteContent = null;
let slides = [];
let packages = {};
let templatesReady = false;

function useContent(content) {
  siteContent = content;
  slides = content.inicio.slides.map((slide) => ({ ...slide }));
  const visible = content.packages.filter((pkg) => !pkg.hidden);
  packages = Object.fromEntries(visible.map((pkg) => [pkg.id, pkg]));
  renderCards();
  fillInicio();
  fillProgramSelect();
}

function setMultiline(node, value) {
  node.replaceChildren();
  String(value || "").split("\n").forEach((line, index) => {
    if (index) node.append(document.createElement("br"));
    node.append(document.createTextNode(line));
  });
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
    article.className = `card ${pkg.featured ? "card-lime" : "card-sand"}`;
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
    const image = document.createElement("img");
    image.src = pkg.image;
    image.alt = pkg.alt || pkg.name;
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
  const about = document.querySelector("#about");
  if (about) {
    about.querySelector(".eyebrow").textContent = inicio.about.eyebrow;
    about.querySelector("h2").textContent = inicio.about.title;
    about.querySelector(".lede").textContent = inicio.about.lede;
    const photo = about.querySelector(".about-photo img");
    if (photo) {
      photo.src = inicio.about.image || "assets/about-equipo.webp";
      photo.alt = inicio.about.alt || "Equipo de Servicios Funerarios Shalom";
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
    incluye.querySelector(".coach-grid").replaceChildren(...inicio.incluye.items.map((item) => {
      const article = document.createElement("article");
      article.className = "coach";
      const index = document.createElement("p");
      index.className = "coach-index";
      index.textContent = item.index;
      article.append(index);
      if (item.title) {
        const title = document.createElement("h3");
        title.textContent = item.title;
        article.append(title);
      }
      if (item.role) {
        const role = document.createElement("p");
        role.className = "role";
        role.textContent = item.role;
        article.append(role);
      }
      const text = document.createElement("p");
      text.textContent = item.text;
      article.append(text);
      return article;
    }));
  }

  const contact = document.querySelector("#contact .section-copy");
  if (contact) {
    contact.querySelector(".eyebrow").textContent = inicio.contact.eyebrow;
    contact.querySelector("h2").textContent = inicio.contact.title;
    contact.querySelector(".lede").textContent = inicio.contact.lede;
    const meta = contact.querySelector(".contact-meta");
    const points = inicio.contact.points || [];
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

  const footer = document.querySelector(".foot p");
  if (footer) footer.textContent = inicio.footer;
}

function fillProgramSelect() {
  const select = document.querySelector('select[name="program"]');
  if (!select) return;
  const current = select.value;
  const placeholder = new Option("Elegir uno", "");
  select.replaceChildren(placeholder, ...Object.values(packages).map((pkg) => new Option(pkg.name, pkg.id)));
  if (packages[current]) select.value = current;
}

useContent(window.ShalomModel.readStoredContent() || structuredClone(window.SHALOM_DEFAULT));

const eyebrow = document.querySelector("#eyebrow");
const headline = document.querySelector("#headline");
const heroCopy = document.querySelector(".hero-copy");
const dots = [...document.querySelectorAll(".dot")];
let slideIndex = 0;

function showSlide(index, animate) {
  slideIndex = index;
  const slide = slides[index];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (animate && !reduce) {
    heroCopy.classList.remove("is-swapping");
    void heroCopy.offsetWidth;
    heroCopy.classList.add("is-swapping");
  }
  eyebrow.textContent = slide.eyebrow || "";
  eyebrow.hidden = !slide.eyebrow;
  setMultiline(headline, slide.title);
  dots.forEach((dot, i) => {
    const on = i === index;
    dot.classList.toggle("is-on", on);
    dot.setAttribute("aria-selected", on ? "true" : "false");
    dot.setAttribute("aria-label", on ? `Mensaje ${i + 1}, seleccionado` : `Mostrar mensaje ${i + 1}`);
  });
}

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => showSlide(index, true));
});
showSlide(0, false);

const scroller = document.querySelector("#scroller");
let drag = null;

function openCard(card) {
  const href = card?.dataset?.href;
  if (href) location.hash = href;
}

scroller.addEventListener("pointerdown", (event) => {
  if (event.button != null && event.button !== 0) return;
  if (event.target.closest("a, button")) return;
  const card = event.target.closest("article.card");
  if (!card || !scroller.contains(card)) return;
  drag = {
    id: event.pointerId,
    x: event.clientX,
    left: scroller.scrollLeft,
    moved: false,
    card,
  };
  scroller.setPointerCapture(event.pointerId);
});

scroller.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  if (Math.abs(dx) > 6) {
    if (!drag.moved) scroller.classList.add("is-dragging");
    drag.moved = true;
  }
  if (drag.moved) scroller.scrollLeft = drag.left - dx;
});

function endDrag(event) {
  if (!drag || event.pointerId !== drag.id) return;
  const { moved, card } = drag;
  scroller.classList.remove("is-dragging");
  if (scroller.hasPointerCapture?.(event.pointerId)) {
    scroller.releasePointerCapture(event.pointerId);
  }
  drag = null;
  if (!moved) openCard(card);
}

scroller.addEventListener("pointerup", endDrag);
scroller.addEventListener("pointercancel", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  scroller.classList.remove("is-dragging");
  drag = null;
});

scroller.addEventListener("click", (event) => {
  if (event.target.closest("a.more")) return;
  const card = event.target.closest("article.card");
  if (!card || !scroller.contains(card) || !card.dataset.href) return;
  event.preventDefault();
}, true);

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
  image.src = pkg.image;
  image.alt = pkg.alt;
  document.querySelector("#pkg-kicker").textContent = pkg.kicker;
  document.querySelector("#pkg-title").textContent = pkg.name;
  document.querySelector("#pkg-lead").textContent = pkg.lead;
  document.querySelector("#pkg-price").textContent = pkg.price;

  const was = document.querySelector("#pkg-was");
  was.hidden = !pkg.compare;
  was.textContent = pkg.compare ? `Precio original ${pkg.compare}` : "";
  setCta(pkg);
  document.querySelector("#pkg-buy").classList.toggle("is-gold", pkg.featured);

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
  found.template.render(view, found.page, { edit: false });
  document.querySelector("#home-view").hidden = true;
  document.querySelector("#package-view").hidden = true;
  view.hidden = false;
  document.title = `${window.ShalomTemplates.pageLabel(found.template, found.page)} — Shalom`;
  const page = view.querySelector(".page-nosotros");
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

function applyRoute() {
  const id = packageId(location.hash);
  const home = document.querySelector("#home-view");
  const view = document.querySelector("#package-view");
  const generated = document.querySelector("#generated-view");

  if (id) {
    renderPackage(id);
    home.hidden = true;
    view.hidden = false;
    if (generated) generated.hidden = true;
    document.title = `${packages[id].name} — Shalom`;
    trackAnalyticsPage(null);
    return;
  }

  const slug = String(location.hash || "").match(/^#\/([a-z0-9-]+)$/)?.[1] || "";
  if (slug === "servicios") {
    location.replace("#servicios");
    return;
  }
  const found = slug && window.ShalomTemplates ? window.ShalomTemplates.findPage(siteContent, slug) : null;
  if (found && found.template.id !== "paquete") {
    renderGenerated(found);
    trackAnalyticsPage(found.template.id === "nosotros" || slug === "nosotros" ? "nosotros" : null);
    return;
  }
  if (slug && !templatesReady && !found) {
    return;
  }

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

function cardImage(id) {
  const link = document.querySelector(`a.more[href="#/${id}"]`);
  return link?.closest(".photo") || null;
}

function clearPhotoName() {
  document.querySelectorAll(".vt-photo").forEach((image) => image.classList.remove("vt-photo"));
}

function settleScroll() {
  const target = !packageId(location.hash) && location.hash.startsWith("#")
    ? document.querySelector(location.hash)
    : null;
  const top = target ? target.getBoundingClientRect().top + window.scrollY : 0;
  window.scrollTo({ top, behavior: "instant" });
}

function armOutgoing(oldHash, newHash) {
  clearPhotoName();
  const oldId = packageId(oldHash);
  const newId = packageId(newHash);
  if (oldId) {
    document.querySelector(".package-photo")?.classList.add("vt-photo");
    return;
  }
  if (newId) cardImage(newId)?.classList.add("vt-photo");
}

function armIncoming() {
  clearPhotoName();
  const nextId = packageId(location.hash);
  if (nextId) {
    document.querySelector(".package-photo")?.classList.add("vt-photo");
    return;
  }
  const returnsToCards = location.hash === "#servicios" || location.hash === "#home" || location.hash === "";
  if (activeId && returnsToCards) cardImage(activeId)?.classList.add("vt-photo");
}

function transitionRoute(event) {
  const oldHash = event?.oldURL ? new URL(event.oldURL).hash : "";
  const newHash = location.hash;
  const involvesPackage = packageId(oldHash) || packageId(newHash);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const update = () => {
    applyRoute();
    armIncoming();
  };

  if (!involvesPackage || reduce || typeof document.startViewTransition !== "function") {
    update();
    clearPhotoName();
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
    settleScroll();
    return;
  }
  transition.ready.catch(() => {});
  transition.finished.finally(() => {
    clearPhotoName();
    settleScroll();
  });
}

window.addEventListener("hashchange", transitionRoute);
applyRoute();

window.ShalomModel.loadContent().then(async (content) => {
  if (window.ShalomTemplates) await window.ShalomTemplates.load();
  templatesReady = true;
  useContent(content);
  if (window.ShalomTemplates) window.ShalomTemplates.prepare(siteContent);
  showSlide(Math.min(slideIndex, Math.max(slides.length - 1, 0)), false);
  applyRoute();
  if (pendingProgram && packages[pendingProgram]) {
    document.querySelector('select[name="program"]').value = pendingProgram;
  }
});

document.documentElement.dataset.ready = "1";

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
