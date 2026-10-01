const app = document.querySelector("#app");
const model = window.ShalomModel;
const engine = window.ShalomTemplates;
let state = null;
let saveTimer = 0;
let statusNode = null;
let currentUser = "";
let statusClearTimer = 0;

const STATUS_ICONS = {
  idle: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="currentColor"/></svg>',
  saving: '<svg class="admin-status-spin" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="28 40"/></svg>',
  saved: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="currentColor"/><path d="M6.2 10.2 8.7 12.6 13.8 7.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  error: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.2 17.2 16.2H2.8L10 3.2Z" fill="currentColor"/><path d="M10 8v3.6M10 14.2h.01" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
};

const STATUS_LABELS = {
  idle: "Listo",
  saving: "Guardando",
  saved: "Guardado",
  error: "Error al guardar",
};

function createStatusNode() {
  const node = document.createElement("span");
  node.className = "admin-status";
  setSaveStatus("idle", node);
  return node;
}

function setSaveStatus(kind, node = statusNode) {
  if (!node) return;
  clearTimeout(statusClearTimer);
  const status = STATUS_ICONS[kind] ? kind : "idle";
  node.dataset.status = status;
  node.innerHTML = STATUS_ICONS[status];
  node.setAttribute("aria-label", STATUS_LABELS[status]);
  node.title = STATUS_LABELS[status];
  if (status === "saved") {
    statusClearTimer = setTimeout(() => {
      if (statusNode === node) setSaveStatus("idle", node);
    }, 1800);
  }
}

function scheduleSave() {
  setSaveStatus("saving");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await model.saveContent(state);
      setSaveStatus("saved");
    } catch (error) {
      setSaveStatus("error");
      console.error(error);
    }
  }, 400);
}

async function logout() {
  await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
  location.href = "/login";
}

function openPasswordModal() {
  const form = document.createElement("form");
  form.className = "create-form create-form-modal password-form";
  form.innerHTML = `
    <label>Contraseña actual
      <input name="current" type="password" autocomplete="current-password" required />
    </label>
    <label>Nueva contraseña
      <input name="next" type="password" autocomplete="new-password" required minlength="8" />
    </label>
    <label>Confirmar nueva
      <input name="confirm" type="password" autocomplete="new-password" required minlength="8" />
    </label>
    <p class="admin-modal-error" hidden></p>
  `;
  const error = form.querySelector(".admin-modal-error");
  const dialog = openDialog({
    title: "Cambiar contraseña",
    body: form,
    confirmLabel: "Guardar",
    async onConfirm() {
      if (!form.reportValidity()) return false;
      const data = new FormData(form);
      const next = String(data.get("next") || "");
      const confirm = String(data.get("confirm") || "");
      if (next !== confirm) {
        error.hidden = false;
        error.textContent = "La confirmación no coincide.";
        return false;
      }
      const response = await fetch("/api/password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.get("current"),
          newPassword: next,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        error.hidden = false;
        error.textContent = payload.error || "No se pudo cambiar la contraseña.";
        return false;
      }
      return true;
    },
  });
  return dialog;
}

function openContactEmailModal() {
  const form = document.createElement("form");
  form.className = "create-form create-form-modal password-form mail-settings-form";
  form.innerHTML = `
    <div class="mail-modal-page is-active" data-page="main">
      <p class="admin-modal-lede">Los envíos del formulario de contacto se mandarán a este correo.</p>
      <label>Correo de contacto
        <input name="contactEmail" type="email" autocomplete="email" placeholder="destino@ejemplo.com" required />
      </label>
    </div>
    <div class="mail-modal-page" data-page="resend" hidden>
      <p class="admin-modal-lede">Credenciales de Resend para el envío de correos.</p>
      <label>Mail From
        <input name="mailFrom" type="text" autocomplete="off" placeholder="Shalom &lt;noreply@tudominio.com&gt;" required />
      </label>
      <label>Resend API key
        <input name="resendApiKey" type="password" autocomplete="off" placeholder="re_..." />
      </label>
      <p class="admin-modal-hint" hidden></p>
    </div>
    <p class="admin-modal-error" hidden></p>
  `;

  const mainPage = form.querySelector('[data-page="main"]');
  const resendPage = form.querySelector('[data-page="resend"]');
  const contactInput = form.querySelector('input[name="contactEmail"]');
  const fromInput = form.querySelector('input[name="mailFrom"]');
  const keyInput = form.querySelector('input[name="resendApiKey"]');
  const hint = form.querySelector(".admin-modal-hint");
  const error = form.querySelector(".admin-modal-error");
  let hasKey = false;
  let page = "main";

  const dialog = openDialog({
    title: "Correo de contacto",
    body: form,
    confirmLabel: "Guardar",
    async onConfirm() {
      error.hidden = true;
      if (page === "resend") {
        if (!fromInput.reportValidity()) return false;
        if (!hasKey && !String(keyInput.value || "").trim()) {
          error.hidden = false;
          error.textContent = "Escriba la API key de Resend.";
          return false;
        }
      } else if (!contactInput.reportValidity()) {
        return false;
      }

      const data = new FormData(form);
      const contactEmail = String(data.get("contactEmail") || "").trim();
      const mailFrom = String(data.get("mailFrom") || "").trim();
      const resendApiKey = String(data.get("resendApiKey") || "").trim();

      if (!contactEmail) {
        showPage("main");
        error.hidden = false;
        error.textContent = "Escriba el correo de contacto.";
        return false;
      }
      if (!mailFrom || (!hasKey && !resendApiKey)) {
        showPage("resend");
        error.hidden = false;
        error.textContent = !mailFrom
          ? "Configure Mail From en ajustes de Resend."
          : "Configure la API key de Resend.";
        return false;
      }

      const response = await fetch("/api/settings/contact-email", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactEmail,
          mailFrom,
          ...(resendApiKey ? { resendApiKey } : {}),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        error.hidden = false;
        error.textContent = payload.error || "No se pudo guardar la configuración.";
        return false;
      }
      return true;
    },
  });

  const heading = dialog.querySelector("h2");
  const titleRow = document.createElement("div");
  titleRow.className = "admin-modal-title-row";
  const titleText = document.createElement("h2");
  titleText.textContent = "Correo de contacto";
  const gearBtn = document.createElement("button");
  gearBtn.type = "button";
  gearBtn.className = "admin-modal-gear";
  gearBtn.setAttribute("aria-label", "Ajustes de Resend");
  gearBtn.title = "Ajustes de Resend";
  gearBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M19.4 13.1v-2.2l1.6-1.3-1.6-2.8-2 .6a7.2 7.2 0 0 0-1.9-1.1l-.4-2.1h-3.2l-.4 2.1a7.2 7.2 0 0 0-1.9 1.1l-2-.6-1.6 2.8 1.6 1.3v2.2l-1.6 1.3 1.6 2.8 2-.6a7.2 7.2 0 0 0 1.9 1.1l.4 2.1h3.2l.4-2.1a7.2 7.2 0 0 0 1.9-1.1l2 .6 1.6-2.8-1.6-1.3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "admin-modal-back";
  backBtn.setAttribute("aria-label", "Volver");
  backBtn.hidden = true;
  backBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.5 9 12l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  titleRow.append(backBtn, titleText, gearBtn);
  heading.replaceWith(titleRow);

  function showPage(next) {
    page = next;
    const onResend = next === "resend";
    mainPage.hidden = onResend;
    resendPage.hidden = !onResend;
    mainPage.classList.toggle("is-active", !onResend);
    resendPage.classList.toggle("is-active", onResend);
    titleText.textContent = onResend ? "Ajustes de Resend" : "Correo de contacto";
    gearBtn.hidden = onResend;
    backBtn.hidden = !onResend;
    error.hidden = true;
    (onResend ? fromInput : contactInput)?.focus();
  }

  gearBtn.addEventListener("click", () => showPage("resend"));
  backBtn.addEventListener("click", () => showPage("main"));

  fetch("/api/settings/contact-email", { credentials: "same-origin" })
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => {
      if (!payload) return;
      if (payload.contactEmail) contactInput.value = payload.contactEmail;
      if (payload.mailFrom) fromInput.value = payload.mailFrom;
      hasKey = Boolean(payload.hasResendApiKey);
      if (hasKey) {
        keyInput.placeholder = "•••••••• (dejar vacío para conservar)";
        keyInput.required = false;
        hint.hidden = false;
        hint.textContent = "Ya hay una API key guardada. Déjela vacía para no cambiarla.";
      } else {
        keyInput.required = true;
      }
    })
    .catch(() => {});

  return dialog;
}

function userMenu(className = "") {
  const wrap = document.createElement("div");
  wrap.className = `user-menu${className ? ` ${className}` : ""}`;

  const pill = document.createElement("button");
  pill.type = "button";
  pill.className = "user-pill";
  pill.setAttribute("aria-haspopup", "menu");
  pill.setAttribute("aria-expanded", "false");
  const mark = document.createElement("span");
  mark.className = "user-pill-mark";
  mark.textContent = (currentUser || "?").slice(0, 1).toUpperCase();
  const name = document.createElement("span");
  name.className = "user-pill-name";
  name.textContent = currentUser || "Usuario";
  const chevron = document.createElement("span");
  chevron.className = "user-pill-chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.innerHTML = '<svg viewBox="0 0 16 16"><path d="M4.5 6.5 8 10l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  pill.append(mark, name, chevron);

  const menu = document.createElement("div");
  menu.className = "user-menu-panel";
  menu.setAttribute("role", "menu");
  menu.hidden = true;

  const passwordBtn = document.createElement("button");
  passwordBtn.type = "button";
  passwordBtn.setAttribute("role", "menuitem");
  passwordBtn.textContent = "Cambiar contraseña";
  passwordBtn.addEventListener("click", () => {
    close();
    openPasswordModal();
  });

  const contactEmailBtn = document.createElement("button");
  contactEmailBtn.type = "button";
  contactEmailBtn.setAttribute("role", "menuitem");
  contactEmailBtn.textContent = "Correo de contacto";
  contactEmailBtn.addEventListener("click", () => {
    close();
    openContactEmailModal();
  });

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.setAttribute("role", "menuitem");
  logoutBtn.textContent = "Cerrar sesión";
  logoutBtn.addEventListener("click", () => {
    close();
    logout();
  });

  menu.append(passwordBtn, contactEmailBtn, logoutBtn);
  wrap.append(pill, menu);

  function close() {
    menu.hidden = true;
    pill.setAttribute("aria-expanded", "false");
    wrap.classList.remove("is-open");
  }

  function open() {
    menu.hidden = false;
    pill.setAttribute("aria-expanded", "true");
    wrap.classList.add("is-open");
  }

  pill.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menu.hidden) open();
    else close();
  });

  document.addEventListener("click", (event) => {
    if (!wrap.contains(event.target)) close();
  });

  return wrap;
}

function createPackageForm(template, onCreated) {
  const form = document.createElement("form");
  form.className = "create-form create-form-modal";
  const input = document.createElement("input");
  input.name = "name";
  input.required = true;
  input.placeholder = "Nombre del nuevo paquete";
  input.autocomplete = "off";
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Crear paquete";
  form.append(input, button);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const page = engine.clonePage(template, engine.source(state, template), input.value, state);
    engine.pages(state, template).push(page);
    scheduleSave();
    onCreated?.(page);
  });
  return form;
}

function openDialog({ title, body, confirmLabel = "Confirmar", tone = "default", onConfirm, hideConfirm = false, hideCancel = false }) {
  const dialog = document.createElement("dialog");
  dialog.className = `admin-modal${tone === "danger" ? " is-danger" : ""}`;
  const card = document.createElement("div");
  card.className = "admin-modal-card";

  const heading = document.createElement("h2");
  heading.textContent = title;
  const copy = document.createElement("div");
  copy.className = "admin-modal-body";
  if (typeof body === "string") {
    const text = document.createElement("p");
    text.textContent = body;
    copy.append(text);
  } else {
    copy.append(body);
  }

  card.append(heading, copy);

  if (!hideCancel || !hideConfirm) {
    const actions = document.createElement("div");
    actions.className = "admin-modal-actions";
    if (!hideCancel) {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "admin-modal-cancel";
      cancel.textContent = "Cancelar";
      cancel.addEventListener("click", () => dialog.close("cancel"));
      actions.append(cancel);
    }
    if (!hideConfirm) {
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = `admin-modal-confirm${tone === "danger" ? " is-danger" : ""}`;
      confirm.textContent = confirmLabel;
      confirm.addEventListener("click", async () => {
        confirm.disabled = true;
        try {
          const result = await onConfirm?.(dialog);
          if (result === false) return;
          dialog.close("confirm");
        } finally {
          confirm.disabled = false;
        }
      });
      actions.append(confirm);
    }
    card.append(actions);
  }

  dialog.append(card);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close("cancel");
  });
  dialog.addEventListener("close", () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
  copy.querySelector("input, textarea, button")?.focus();
  return dialog;
}

function iconButton(kind, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `thumb-action thumb-action-${kind}`;
  button.setAttribute("aria-label", label);
  button.title = label;
  const icons = {
    delete: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    duplicate: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 10.5v-7A1.5 1.5 0 0 1 5 2h7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    hide: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8s2.4-3.5 5.5-3.5S13.5 8 13.5 8 11.1 11.5 8 11.5 2.5 8 2.5 8Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="1.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 13.5 13 3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    show: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8s2.4-3.5 5.5-3.5S13.5 8 13.5 8 11.1 11.5 8 11.5 2.5 8 2.5 8Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="1.6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  };
  button.innerHTML = icons[kind] || "";
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick(event);
  });
  return button;
}

function packageThumb(page, template, jobs) {
  const wrap = document.createElement("div");
  wrap.className = `thumb-wrap${page.hidden ? " is-hidden" : ""}`;

  const link = shotThumb(
    engine.pageLabel(template, page),
    `#/edit/paquete/${page.id}`,
    template,
    page,
    `paquete/${page.id}`,
    jobs
  );

  const actions = document.createElement("div");
  actions.className = "thumb-actions";
  actions.append(
    iconButton("delete", "Eliminar paquete", () => {
      openDialog({
        title: "Eliminar paquete",
        body: `¿Eliminar «${page.name}»? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        tone: "danger",
        onConfirm() {
          const list = engine.pages(state, template);
          const index = list.findIndex((item) => item.id === page.id);
          if (index < 0) return;
          list.splice(index, 1);
          if (state.miniatures) delete state.miniatures[`paquete/${page.id}`];
          if (state.miniatureStamps) delete state.miniatureStamps[`paquete/${page.id}`];
          scheduleSave();
          renderPackages();
        },
      });
    }),
    iconButton("duplicate", "Duplicar paquete", () => {
      const list = engine.pages(state, template);
      const name = model.nextDuplicateName(page.name, list);
      const copy = engine.clonePage(template, page, name, state);
      list.push(copy);
      scheduleSave();
      renderPackages();
    }),
    iconButton(page.hidden ? "show" : "hide", page.hidden ? "Mostrar en el sitio" : "Ocultar del sitio", () => {
      const hiding = !page.hidden;
      openDialog({
        title: hiding ? "Ocultar paquete" : "Mostrar paquete",
        body: hiding
          ? `¿Ocultar «${page.name}» del sitio público? Seguirá disponible en el admin.`
          : `¿Volver a mostrar «${page.name}» en el sitio público?`,
        confirmLabel: hiding ? "Ocultar" : "Mostrar",
        onConfirm() {
          page.hidden = hiding;
          scheduleSave();
          renderPackages();
        },
      });
    })
  );

  wrap.append(link, actions);
  return wrap;
}

function newPackageButton(template) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "dash-new-btn";
  button.textContent = "Nuevo paquete";
  button.addEventListener("click", () => {
    let dialog;
    const form = createPackageForm(template, (page) => {
      dialog?.close();
      location.hash = `#/edit/paquete/${page.id}`;
    });
    dialog = openDialog({
      title: "Nuevo paquete",
      body: form,
      hideConfirm: true,
      hideCancel: true,
    });
  });
  return button;
}

const SHOT_WIDTH = 1200;
const SHOT_HEIGHT = 840;
const SHOT_VERSION = "5";
let shotFrame = null;
let shotGeneration = 0;

function visualStamp(data) {
  const json = JSON.stringify(data, (key, value) => {
    if (key === "miniatures" || key === "miniatureStamps" || key === "revision") return undefined;
    return value;
  });
  let hash = 5381;
  for (let index = 0; index < json.length; index += 1) hash = ((hash << 5) + hash) ^ json.charCodeAt(index);
  return SHOT_VERSION + (hash >>> 0).toString(36);
}

function shotThumb(label, href, template, data, key, jobs) {
  const link = document.createElement("a");
  link.className = "thumb";
  link.href = href;
  const frame = document.createElement("div");
  frame.className = "thumb-frame";
  const image = document.createElement("img");
  image.className = "thumb-shot";
  image.alt = "";
  const stamp = visualStamp(data);
  const saved = state.miniatures?.[key];
  if (saved) image.src = saved;
  if (!saved || state.miniatureStamps?.[key] !== stamp) jobs.push({ template, data, key, stamp, image });
  frame.append(image);
  const caption = document.createElement("p");
  caption.textContent = label;
  link.append(frame, caption);
  return link;
}

function shotDocument() {
  if (shotFrame?.contentDocument?.body) return shotFrame.contentDocument;
  shotFrame = document.createElement("iframe");
  shotFrame.className = "shot-frame";
  shotFrame.setAttribute("aria-hidden", "true");
  shotFrame.tabIndex = -1;
  document.body.append(shotFrame);
  const doc = shotFrame.contentDocument;
  const base = location.href.replace(/[^/]*$/, "");
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><base href="${base}"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&display=swap"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="admin.css"></head><body class="shot-root"></body></html>`);
  doc.close();
  return doc;
}

async function whenShotReady(doc) {
  await Promise.all([...doc.querySelectorAll("link")].map((link) => (link.sheet
    ? null
    : new Promise((resolve) => {
      link.addEventListener("load", resolve, { once: true });
      link.addEventListener("error", resolve, { once: true });
    }))));
  if (doc.fonts) await doc.fonts.ready;
}

function keepOpening(doc) {
  doc.body.style.width = `${SHOT_WIDTH}px`;
  doc.body.style.height = `${SHOT_HEIGHT}px`;
  doc.body.style.overflow = "hidden";
  doc.querySelectorAll(".package-intro, .package-sections, .package-close, .about, .coaches, .contact").forEach((node) => node.remove());
  [...doc.querySelectorAll(".hero-copy")].slice(1).forEach((node) => node.remove());
  doc.querySelectorAll("body > .pkg-lead").forEach((node) => node.remove());

  const layout = doc.querySelector(".package-layout");
  if (!layout) return;
  const article = layout.closest(".package");
  article.style.cssText = `height:${SHOT_HEIGHT}px;overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box;padding:28px 48px 32px;`;
  layout.style.cssText = "flex:1;min-height:0;display:grid;grid-template-columns:1.15fr 0.85fr;gap:22px;align-items:stretch;";
  const photo = doc.querySelector(".package-photo");
  const image = photo?.querySelector("img");
  if (photo) photo.style.cssText = "height:100%;min-height:0;margin:0;overflow:hidden;border-radius:28px;background:#f4f2ed;";
  if (image) image.style.cssText = "width:100%;height:100%;min-height:0;object-fit:cover;display:block;";
}

async function captureMiniature(template, data) {
  const doc = shotDocument();
  await whenShotReady(doc);
  doc.body.className = "shot-root";
  doc.body.replaceChildren();
  template.render(doc.body, data, { edit: false });
  keepOpening(doc);
  await Promise.all([...doc.images].map((image) => {
    if (image.complete) return null;
    return new Promise((resolve) => {
      const done = () => resolve();
      image.addEventListener("load", done, { once: true });
      image.addEventListener("error", done, { once: true });
      setTimeout(done, 2000);
    });
  }));
  await new Promise((resolve) => setTimeout(resolve, 30));
  const canvas = await window.html2canvas(doc.body, {
    width: SHOT_WIDTH,
    height: SHOT_HEIGHT,
    windowWidth: SHOT_WIDTH,
    windowHeight: SHOT_HEIGHT,
    scale: 0.25,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function refreshMiniatures(jobs, generation) {
  if (!jobs.length || typeof window.html2canvas !== "function") return;
  state.miniatures ||= {};
  state.miniatureStamps ||= {};
  let changed = false;
  for (const job of jobs) {
    if (generation !== shotGeneration) return;
    try {
      const url = await captureMiniature(job.template, job.data);
      if (generation !== shotGeneration) return;
      state.miniatures[job.key] = url;
      state.miniatureStamps[job.key] = job.stamp;
      job.image.src = url;
      changed = true;
    } catch (error) {
      /* The next visit tries this miniature again. */
    }
  }
  if (changed && generation === shotGeneration) scheduleSave();
}

function navItem(label, href, active) {
  const link = document.createElement("a");
  link.className = `dash-nav-link${active ? " is-active" : ""}`;
  link.href = href;
  link.textContent = label;
  return link;
}

function mountShell(section, build) {
  document.body.classList.add("admin-shell");
  document.body.classList.remove("admin-editing");

  const shell = document.createElement("div");
  shell.className = "dash-shell";

  const aside = document.createElement("aside");
  aside.className = "dash-aside";
  const brand = document.createElement("a");
  brand.className = "dash-brand";
  brand.href = "#/";
  brand.setAttribute("aria-label", "Shalom, inicio admin");
  brand.innerHTML = '<img src="assets/logo-shalom.png" alt="SHALOM Servicios Funerarios" width="204" height="60" />';
  const nav = document.createElement("nav");
  nav.className = "dash-nav";
  nav.setAttribute("aria-label", "Administración");
  nav.append(
    navItem("Dashboard", "#/", section === "inicio"),
    navItem("Páginas", "#/paginas", section === "paginas"),
    navItem("Paquetes", "#/paquetes", section === "paquetes")
  );
  aside.append(brand, nav, userMenu("dash-logout"));

  const main = document.createElement("main");
  main.className = "dash-main";
  build(main);
  shell.append(aside, main);
  app.replaceChildren(shell);
}

function sectionHead(main, title, extra) {
  const head = document.createElement("div");
  head.className = "dash-head";
  const titleWrap = document.createElement("div");
  titleWrap.className = "admin-title";
  const heading = document.createElement("h1");
  heading.textContent = title;
  statusNode = createStatusNode();
  titleWrap.append(heading, statusNode);
  head.append(titleWrap);
  if (extra) head.append(extra);
  main.append(head);
  return head;
}

function formatDwell(ms) {
  const total = Math.max(0, Math.round(Number(ms) || 0) / 1000);
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function analyticsChart(days, weekLabelText = "") {
  const wrap = document.createElement("div");
  wrap.className = "analytics-chart";

  const label = document.createElement("p");
  label.className = "analytics-week-label";
  label.textContent = weekLabelText || "";

  const plot = document.createElement("div");
  plot.className = "analytics-chart-plot";
  const canvas = document.createElement("canvas");
  plot.append(canvas);
  wrap.append(label, plot);

  let chart = null;
  const ChartLib = window.Chart;
  if (ChartLib && window.ChartDataLabels) {
    ChartLib.register(window.ChartDataLabels);
  }

  function paint(dayList, nextLabel) {
    if (typeof nextLabel === "string") label.textContent = nextLabel;
    const labels = (dayList || []).map((d) => String(d.date || "").slice(8));
    const values = (dayList || []).map((d) => d.views || 0);
    if (!ChartLib) {
      plot.textContent = values.join(", ");
      return;
    }
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = values;
      chart.update();
      return;
    }
    chart = new ChartLib(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: "#c4a35a",
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 36,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title(items) {
                const i = items[0]?.dataIndex ?? 0;
                return dayList?.[i]?.date || "";
              },
              label(item) {
                return `${item.parsed.y} visitas`;
              },
            },
          },
          datalabels: {
            anchor: "end",
            align: "top",
            color: "#141414",
            font: { weight: "700", size: 11, family: "Inter Tight, sans-serif" },
            formatter: (value) => value,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#6b6b6b", font: { size: 11, family: "Inter Tight, sans-serif" } },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grace: "20%",
            ticks: {
              precision: 0,
              color: "#6b6b6b",
              font: { size: 11, family: "Inter Tight, sans-serif" },
            },
            grid: { color: "rgba(20,20,20,0.06)" },
            border: { display: false },
          },
        },
      },
    });
  }

  paint(days, weekLabelText);
  wrap._chartApi = {
    paint,
    destroy() {
      chart?.destroy();
      chart = null;
    },
  };
  return wrap;
}

function analyticsPageCard(label, pageId, stats, weekLabelText) {
  const card = document.createElement("article");
  card.className = "analytics-card";
  const title = document.createElement("h3");
  title.textContent = label;
  const metrics = document.createElement("div");
  metrics.className = "analytics-metrics";
  metrics.innerHTML = `
    <div><span>Visitas totales</span><strong>${stats?.totalViews ?? 0}</strong></div>
    <div><span>Retención media</span><strong>${formatDwell(stats?.avgDwellMs)}</strong></div>
  `;
  const chartLabel = document.createElement("p");
  chartLabel.className = "analytics-subhead";
  chartLabel.textContent = "Visitas por día";
  const chart = analyticsChart(stats?.days || [], weekLabelText);
  card.append(title, metrics, chartLabel, chart);
  card._chartApi = chart._chartApi;
  card._pageId = pageId;
  return card;
}

async function renderAnalyticsBlock(main) {
  const section = document.createElement("section");
  section.className = "analytics-block";

  const head = document.createElement("div");
  head.className = "analytics-block-head";

  const weekNav = document.createElement("div");
  weekNav.className = "analytics-week-nav";
  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "analytics-week-btn";
  prev.setAttribute("aria-label", "Semana anterior");
  prev.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.5 9 12l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const weekTitle = document.createElement("p");
  weekTitle.className = "analytics-week-nav-label";
  weekTitle.textContent = "Cargando…";
  const next = document.createElement("button");
  next.type = "button";
  next.className = "analytics-week-btn";
  next.setAttribute("aria-label", "Semana siguiente");
  next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6.5 15 12l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  weekNav.append(prev, weekTitle, next);
  head.append(weekNav);

  const grid = document.createElement("div");
  grid.className = "analytics-grid";
  const loading = document.createElement("p");
  loading.className = "dash-lede";
  loading.textContent = "Cargando…";
  section.append(head, loading);
  main.append(section);

  let weeksBack = 0;
  let maxWeeksBack = 12;
  let cards = [];

  async function loadWeek(offset) {
    const response = await fetch(`/api/analytics?weeksBack=${offset}`, { credentials: "same-origin" });
    if (!response.ok) throw new Error("No se pudo cargar");
    return response.json();
  }

  function applyWeek(data) {
    weeksBack = data.weeksBack || 0;
    maxWeeksBack = data.maxWeeksBack ?? 12;
    weekTitle.textContent = data.weekLabel || "";
    prev.disabled = weeksBack >= maxWeeksBack;
    next.disabled = weeksBack <= 0;
    cards.forEach((card) => {
      const stats = data.pages?.[card._pageId];
      card._chartApi?.paint(stats?.days || [], data.weekLabel || "");
    });
  }

  try {
    const data = await loadWeek(0);
    loading.remove();
    cards = [
      analyticsPageCard("Inicio", "inicio", data.pages?.inicio, data.weekLabel),
      analyticsPageCard("Nosotros", "nosotros", data.pages?.nosotros, data.weekLabel),
    ];
    grid.append(...cards);
    section.append(grid);
    applyWeek(data);

    prev.addEventListener("click", async () => {
      if (weeksBack >= maxWeeksBack) return;
      prev.disabled = true;
      next.disabled = true;
      try {
        applyWeek(await loadWeek(weeksBack + 1));
      } catch {
        weekTitle.textContent = "No se pudo cargar la semana";
      }
    });
    next.addEventListener("click", async () => {
      if (weeksBack <= 0) return;
      prev.disabled = true;
      next.disabled = true;
      try {
        applyWeek(await loadWeek(weeksBack - 1));
      } catch {
        weekTitle.textContent = "No se pudo cargar la semana";
      }
    });
  } catch {
    loading.textContent = "No se pudo cargar la analítica.";
  }
}

function renderHome() {
  mountShell("inicio", (main) => {
    sectionHead(main, "Dashboard");
    renderAnalyticsBlock(main);
  });
}

function renderPages() {
  mountShell("paginas", (main) => {
    const generation = ++shotGeneration;
    const jobs = [];
    sectionHead(main, "Páginas");
    const grid = document.createElement("div");
    grid.className = "page-grid";
    engine.list().forEach((template) => {
      if (template.dashboard === false) return;
      const source = engine.source(state, template);
      grid.append(shotThumb(template.label, `#/edit/${template.id}`, template, source, template.id, jobs));
    });
    main.append(grid);
    refreshMiniatures(jobs, generation);
  });
}

function renderPackages() {
  mountShell("paquetes", (main) => {
    const template = engine.get("paquete");
    const generation = ++shotGeneration;
    const jobs = [];
    sectionHead(main, "Paquetes", newPackageButton(template));
    const grid = document.createElement("div");
    grid.className = "page-grid";
    engine.pages(state, template).forEach((page) => {
      grid.append(packageThumb(page, template, jobs));
    });
    if (!grid.childElementCount) {
      const empty = document.createElement("p");
      empty.className = "dash-lede";
      empty.textContent = "Aún no hay paquetes. Cree el primero con el botón Nuevo paquete.";
      main.append(empty);
    } else {
      main.append(grid);
    }
    refreshMiniatures(jobs, generation);
  });
}

function editorBar(title) {
  const bar = document.createElement("div");
  bar.className = "admin-bar";
  const back = document.createElement("a");
  const onPackage = location.hash.includes("/edit/paquete/");
  back.href = onPackage ? "#/paquetes" : "#/paginas";
  back.className = "admin-back";
  back.setAttribute("aria-label", onPackage ? "Volver a Paquetes" : "Volver a Páginas");
  back.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.5 9 12l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const titleWrap = document.createElement("div");
  titleWrap.className = "admin-title";
  const heading = document.createElement("h1");
  heading.textContent = title;
  statusNode = createStatusNode();
  titleWrap.append(heading, statusNode);
  bar.append(back, titleWrap);
  return bar;
}

function renderEditor(template, data, { blueprint }) {
  document.body.classList.add("admin-editing");
  document.body.classList.remove("admin-shell");
  const sheet = document.createElement("div");
  sheet.className = "editor-sheet";
  const options = { blueprint };
  template.render(sheet, data, { edit: true });
  engine.activate(sheet, data, {
    onChange: scheduleSave,
    onStructure() {
      renderEditor(template, data, options);
      scheduleSave();
    },
  });
  const title = blueprint || template.singleton ? template.label : engine.pageLabel(template, data);
  app.replaceChildren(editorBar(title), sheet);
}

function route() {
  const hash = location.hash || "#/";
  if (hash === "#/" || hash === "#" || hash === "#/inicio") return renderHome();
  if (hash === "#/paginas") return renderPages();
  if (hash === "#/paquetes") return renderPackages();
  if (hash === "#/edit/plantilla") {
    location.hash = "#/paquetes";
    return;
  }
  if (hash === "#/edit/paquete") {
    location.hash = "#/paquetes";
    return;
  }
  const match = hash.match(/^#\/edit\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/);
  const template = match && engine.get(match[1]);
  if (!template) {
    location.hash = "#/";
    return;
  }
  if (template.singleton) return renderEditor(template, engine.source(state, template), { blueprint: false });
  if (!match[2]) {
    location.hash = "#/paquetes";
    return;
  }
  const page = engine.pages(state, template).find((item) => item.id === match[2]);
  if (!page) {
    location.hash = "#/paquetes";
    return;
  }
  renderEditor(template, page, { blueprint: false });
}

fetch("/api/me", { credentials: "same-origin" })
  .then((response) => {
    if (!response.ok) {
      location.href = `/login?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`;
      return null;
    }
    return response.json();
  })
  .then((me) => {
    if (!me) return null;
    currentUser = me.user || "";
    return engine.load().then(() => model.loadContent());
  })
  .then((content) => {
    if (!content) return;
    state = content;
    engine.prepare(state);
    window.addEventListener("hashchange", route);
    try {
      route();
    } catch (error) {
      app.textContent = error.stack || error.message;
    }
  })
  .catch((error) => {
    app.textContent = error.stack || error.message;
  });
