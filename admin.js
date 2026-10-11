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

function isMobileAdmin() {
  return window.matchMedia("(max-width: 860px)").matches;
}

function thumbMoveControls() {
  const wrap = document.createElement("div");
  wrap.className = "thumb-move";
  const up = document.createElement("button");
  up.type = "button";
  up.className = "thumb-move-btn";
  up.dataset.move = "up";
  up.setAttribute("aria-label", "Subir posición");
  up.title = "Subir";
  up.innerHTML =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 9.5 8 6l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const down = document.createElement("button");
  down.type = "button";
  down.className = "thumb-move-btn";
  down.dataset.move = "down";
  down.setAttribute("aria-label", "Bajar posición");
  down.title = "Bajar";
  down.innerHTML =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 6.5 8 10l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  wrap.append(up, down);
  wrap.addEventListener("pointerdown", (event) => event.stopPropagation());
  return wrap;
}

function updateThumbMoveState(grid) {
  const items = [...grid.querySelectorAll(":scope > .thumb-wrap")];
  items.forEach((wrap, index) => {
    const up = wrap.querySelector('.thumb-move-btn[data-move="up"]');
    const down = wrap.querySelector('.thumb-move-btn[data-move="down"]');
    if (up) up.disabled = index === 0;
    if (down) down.disabled = index === items.length - 1;
  });
}

function moveThumbInGrid(grid, wrap, direction, syncFn) {
  const items = [...grid.querySelectorAll(":scope > .thumb-wrap")];
  const index = items.indexOf(wrap);
  if (index < 0) return;
  if (direction === "up" && index > 0) {
    grid.insertBefore(wrap, items[index - 1]);
  } else if (direction === "down" && index < items.length - 1) {
    grid.insertBefore(wrap, items[index + 1].nextSibling);
  } else {
    return;
  }
  updatePackageOrderBadges(grid);
  updateThumbMoveState(grid);
  syncFn?.(grid);
}

function wireThumbMoveButtons(grid, syncFn) {
  if (grid.dataset.moveWired === "1") return;
  grid.dataset.moveWired = "1";
  grid.addEventListener(
    "click",
    (event) => {
      const btn = event.target.closest(".thumb-move-btn");
      if (!btn || btn.disabled || !grid.contains(btn)) return;
      event.preventDefault();
      event.stopPropagation();
      const wrap = btn.closest(".thumb-wrap");
      if (!wrap || !grid.contains(wrap)) return;
      moveThumbInGrid(grid, wrap, btn.dataset.move, syncFn);
    },
    true
  );
  updateThumbMoveState(grid);
}

function packageThumb(page, template, jobs, order) {
  const wrap = document.createElement("div");
  wrap.className = `thumb-wrap${page.hidden ? " is-hidden" : ""}`;
  wrap.draggable = !isMobileAdmin();
  wrap.dataset.packageId = page.id;

  const link = shotThumb(
    engine.pageLabel(template, page),
    `#/edit/paquete/${page.id}`,
    template,
    page,
    `paquete/${page.id}`,
    jobs
  );

  const orderBadge = document.createElement("span");
  orderBadge.className = "thumb-order";
  orderBadge.textContent = String(order);
  orderBadge.title = `Orden ${order} en el carrusel`;

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

  actions.addEventListener("pointerdown", (event) => event.stopPropagation());
  link.addEventListener("click", (event) => {
    if (wrap.dataset.didDrag === "1") {
      event.preventDefault();
      wrap.dataset.didDrag = "0";
    }
  });

  wrap.append(link, actions, orderBadge, thumbMoveControls());
  return wrap;
}

function updatePackageOrderBadges(grid) {
  [...grid.querySelectorAll(".thumb-wrap")].forEach((wrap, index) => {
    const badge = wrap.querySelector(".thumb-order");
    if (badge) {
      badge.textContent = String(index + 1);
      badge.title = `Orden ${index + 1} en el carrusel`;
    }
  });
  updateThumbMoveState(grid);
}

function syncPackageOrderFromGrid(grid, template) {
  const list = engine.pages(state, template);
  const orderedIds = [...grid.querySelectorAll(".thumb-wrap")].map((wrap) => wrap.dataset.packageId);
  const next = orderedIds.map((id) => list.find((item) => item.id === id)).filter(Boolean);
  if (next.length !== list.length) return false;
  const unchanged = next.every((item, index) => item.id === list[index]?.id);
  if (unchanged) return false;
  state.packages = next;
  updatePackageOrderBadges(grid);
  scheduleSave();
  return true;
}

function wirePackageReorder(grid, template) {
  let dragId = "";
  wireThumbMoveButtons(grid, () => syncPackageOrderFromGrid(grid, template));

  grid.addEventListener("dragstart", (event) => {
    if (isMobileAdmin()) {
      event.preventDefault();
      return;
    }
    const wrap = event.target.closest(".thumb-wrap");
    if (!wrap || !grid.contains(wrap)) return;
    if (event.target.closest(".thumb-actions, .thumb-move")) {
      event.preventDefault();
      return;
    }
    dragId = wrap.dataset.packageId || "";
    wrap.dataset.didDrag = "0";
    wrap.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragId);
  });

  grid.addEventListener("dragend", (event) => {
    const wrap = event.target.closest(".thumb-wrap");
    wrap?.classList.remove("is-dragging");
    grid.querySelectorAll(".thumb-wrap.is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
    syncPackageOrderFromGrid(grid, template);
    dragId = "";
  });

  grid.addEventListener("dragover", (event) => {
    if (isMobileAdmin()) return;
    const target = event.target.closest(".thumb-wrap");
    if (!dragId || !target || target.dataset.packageId === dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    grid.querySelectorAll(".thumb-wrap.is-drop-target").forEach((node) => {
      if (node !== target) node.classList.remove("is-drop-target");
    });
    target.classList.add("is-drop-target");

    const source = grid.querySelector(`.thumb-wrap[data-package-id="${dragId}"]`);
    if (!source || source === target) return;
    const items = [...grid.children];
    const from = items.indexOf(source);
    const to = items.indexOf(target);
    if (from < 0 || to < 0 || from === to) return;
    if (from < to) grid.insertBefore(source, target.nextSibling);
    else grid.insertBefore(source, target);
    source.dataset.didDrag = "1";
    updatePackageOrderBadges(grid);
  });

  grid.addEventListener("drop", (event) => {
    event.preventDefault();
    syncPackageOrderFromGrid(grid, template);
  });
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

function createCapillaForm(template, onCreated) {
  const form = document.createElement("form");
  form.className = "create-form create-form-modal";
  const input = document.createElement("input");
  input.name = "name";
  input.required = true;
  input.placeholder = "Nombre de la nueva capilla";
  input.autocomplete = "off";
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Crear capilla";
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

function newCapillaButton(template) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "dash-new-btn";
  button.textContent = "Nueva capilla";
  button.addEventListener("click", () => {
    let dialog;
    const form = createCapillaForm(template, (page) => {
      dialog?.close();
      location.hash = `#/edit/capilla/${page.id}`;
    });
    dialog = openDialog({
      title: "Nueva capilla",
      body: form,
      hideConfirm: true,
      hideCancel: true,
    });
  });
  return button;
}

function capillaThumb(page, template, jobs, order) {
  const wrap = document.createElement("div");
  wrap.className = `thumb-wrap${page.hidden ? " is-hidden" : ""}`;
  wrap.draggable = !isMobileAdmin();
  wrap.dataset.packageId = page.id;

  const link = shotThumb(
    engine.pageLabel(template, page),
    `#/edit/capilla/${page.id}`,
    template,
    page,
    `capilla/${page.id}`,
    jobs
  );

  const orderBadge = document.createElement("span");
  orderBadge.className = "thumb-order";
  orderBadge.textContent = String(order);
  orderBadge.title = `Orden ${order}`;

  const actions = document.createElement("div");
  actions.className = "thumb-actions";
  actions.append(
    iconButton("delete", "Eliminar capilla", () => {
      openDialog({
        title: "Eliminar capilla",
        body: `¿Eliminar «${page.name}»? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        tone: "danger",
        onConfirm() {
          const list = engine.pages(state, template);
          const index = list.findIndex((item) => item.id === page.id);
          if (index < 0) return;
          list.splice(index, 1);
          if (state.miniatures) delete state.miniatures[`capilla/${page.id}`];
          if (state.miniatureStamps) delete state.miniatureStamps[`capilla/${page.id}`];
          scheduleSave();
          renderCapillas();
        },
      });
    }),
    iconButton("duplicate", "Duplicar capilla", () => {
      const list = engine.pages(state, template);
      const name = model.nextDuplicateName(page.name, list, "Capilla");
      const copy = engine.clonePage(template, page, name, state);
      list.push(copy);
      scheduleSave();
      renderCapillas();
    }),
    iconButton(page.hidden ? "show" : "hide", page.hidden ? "Mostrar en el sitio" : "Ocultar del sitio", () => {
      const hiding = !page.hidden;
      openDialog({
        title: hiding ? "Ocultar capilla" : "Mostrar capilla",
        body: hiding
          ? `¿Ocultar «${page.name}» del sitio público? Seguirá disponible en el admin.`
          : `¿Volver a mostrar «${page.name}» en el sitio público?`,
        confirmLabel: hiding ? "Ocultar" : "Mostrar",
        onConfirm() {
          page.hidden = hiding;
          scheduleSave();
          renderCapillas();
        },
      });
    })
  );

  actions.addEventListener("pointerdown", (event) => event.stopPropagation());
  link.addEventListener("click", (event) => {
    if (wrap.dataset.didDrag === "1") {
      event.preventDefault();
      wrap.dataset.didDrag = "0";
    }
  });

  wrap.append(link, actions, orderBadge, thumbMoveControls());
  return wrap;
}

function syncCapillaOrderFromGrid(grid, template) {
  const list = engine.pages(state, template);
  const orderedIds = [...grid.querySelectorAll(".thumb-wrap")].map((wrap) => wrap.dataset.packageId);
  const next = orderedIds.map((id) => list.find((item) => item.id === id)).filter(Boolean);
  if (next.length !== list.length) return false;
  const unchanged = next.every((item, index) => item.id === list[index]?.id);
  if (unchanged) return false;
  state.capillas = next;
  updatePackageOrderBadges(grid);
  scheduleSave();
  return true;
}

function wireCapillaReorder(grid, template) {
  let dragId = "";
  wireThumbMoveButtons(grid, () => syncCapillaOrderFromGrid(grid, template));

  grid.addEventListener("dragstart", (event) => {
    if (isMobileAdmin()) {
      event.preventDefault();
      return;
    }
    const wrap = event.target.closest(".thumb-wrap");
    if (!wrap || !grid.contains(wrap)) return;
    if (event.target.closest(".thumb-actions, .thumb-move")) {
      event.preventDefault();
      return;
    }
    dragId = wrap.dataset.packageId || "";
    wrap.dataset.didDrag = "0";
    wrap.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragId);
  });

  grid.addEventListener("dragend", () => {
    grid.querySelectorAll(".thumb-wrap.is-dragging, .thumb-wrap.is-drop-target").forEach((node) => {
      node.classList.remove("is-dragging", "is-drop-target");
    });
    syncCapillaOrderFromGrid(grid, template);
    dragId = "";
  });

  grid.addEventListener("dragover", (event) => {
    if (isMobileAdmin()) return;
    const target = event.target.closest(".thumb-wrap");
    if (!dragId || !target || target.dataset.packageId === dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    grid.querySelectorAll(".thumb-wrap.is-drop-target").forEach((node) => {
      if (node !== target) node.classList.remove("is-drop-target");
    });
    target.classList.add("is-drop-target");
    const source = grid.querySelector(`.thumb-wrap[data-package-id="${dragId}"]`);
    if (!source || source === target) return;
    const items = [...grid.children];
    const from = items.indexOf(source);
    const to = items.indexOf(target);
    if (from < 0 || to < 0 || from === to) return;
    if (from < to) grid.insertBefore(source, target.nextSibling);
    else grid.insertBefore(source, target);
    source.dataset.didDrag = "1";
    updatePackageOrderBadges(grid);
  });

  grid.addEventListener("drop", (event) => {
    event.preventDefault();
    syncCapillaOrderFromGrid(grid, template);
  });
}

function renderCapillas() {
  mountShell("capillas", (main) => {
    const template = engine.get("capilla");
    const generation = ++shotGeneration;
    const jobs = [];
    sectionHead(main, "Capillas", newCapillaButton(template));
    const grid = document.createElement("div");
    grid.className = "page-grid packages-sortable";
    engine.pages(state, template).forEach((page, index) => {
      grid.append(capillaThumb(page, template, jobs, index + 1));
    });
    if (!grid.childElementCount) {
      const empty = document.createElement("p");
      empty.className = "dash-lede";
      empty.textContent = "Aún no hay capillas. Cree la primera con el botón Nueva capilla.";
      main.append(empty);
    } else {
      main.append(grid);
      wireCapillaReorder(grid, template);
    }
    refreshMiniatures(jobs, generation);
  });
}

function createServicioForm(template, onCreated) {
  const form = document.createElement("form");
  form.className = "create-form create-form-modal";
  const input = document.createElement("input");
  input.name = "name";
  input.required = true;
  input.placeholder = "Nombre del nuevo servicio";
  input.autocomplete = "off";
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Crear servicio";
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

function newServicioButton(template) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "dash-new-btn";
  button.textContent = "Nuevo servicio";
  button.addEventListener("click", () => {
    let dialog;
    const form = createServicioForm(template, (page) => {
      dialog?.close();
      location.hash = `#/edit/servicio/${page.id}`;
    });
    dialog = openDialog({
      title: "Nuevo servicio",
      body: form,
      hideConfirm: true,
      hideCancel: true,
    });
  });
  return button;
}

function servicioThumb(page, template, jobs, order) {
  const wrap = document.createElement("div");
  wrap.className = `thumb-wrap${page.hidden ? " is-hidden" : ""}`;
  wrap.draggable = !isMobileAdmin();
  wrap.dataset.packageId = page.id;

  const link = shotThumb(
    engine.pageLabel(template, page),
    `#/edit/servicio/${page.id}`,
    template,
    page,
    `servicio/${page.id}`,
    jobs
  );

  const orderBadge = document.createElement("span");
  orderBadge.className = "thumb-order";
  orderBadge.textContent = String(order);
  orderBadge.title = `Orden ${order}`;

  const actions = document.createElement("div");
  actions.className = "thumb-actions";
  actions.append(
    iconButton("delete", "Eliminar servicio", () => {
      openDialog({
        title: "Eliminar servicio",
        body: `¿Eliminar «${page.name}»? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        tone: "danger",
        onConfirm() {
          const list = engine.pages(state, template);
          const index = list.findIndex((item) => item.id === page.id);
          if (index < 0) return;
          list.splice(index, 1);
          if (state.miniatures) delete state.miniatures[`servicio/${page.id}`];
          if (state.miniatureStamps) delete state.miniatureStamps[`servicio/${page.id}`];
          scheduleSave();
          renderServiciosCatalog();
        },
      });
    }),
    iconButton("duplicate", "Duplicar servicio", () => {
      const list = engine.pages(state, template);
      const name = model.nextDuplicateName(page.name, list, "Servicio");
      const copy = engine.clonePage(template, page, name, state);
      list.push(copy);
      scheduleSave();
      renderServiciosCatalog();
    }),
    iconButton(page.hidden ? "show" : "hide", page.hidden ? "Mostrar en el sitio" : "Ocultar del sitio", () => {
      const hiding = !page.hidden;
      openDialog({
        title: hiding ? "Ocultar servicio" : "Mostrar servicio",
        body: hiding
          ? `¿Ocultar «${page.name}» del sitio público? Seguirá disponible en el admin.`
          : `¿Volver a mostrar «${page.name}» en el sitio público?`,
        confirmLabel: hiding ? "Ocultar" : "Mostrar",
        onConfirm() {
          page.hidden = hiding;
          scheduleSave();
          renderServiciosCatalog();
        },
      });
    })
  );

  actions.addEventListener("pointerdown", (event) => event.stopPropagation());
  link.addEventListener("click", (event) => {
    if (wrap.dataset.didDrag === "1") {
      event.preventDefault();
      wrap.dataset.didDrag = "0";
    }
  });

  wrap.append(link, actions, orderBadge, thumbMoveControls());
  return wrap;
}

function syncServicioOrderFromGrid(grid, template) {
  const list = engine.pages(state, template);
  const orderedIds = [...grid.querySelectorAll(".thumb-wrap")].map((wrap) => wrap.dataset.packageId);
  const next = orderedIds.map((id) => list.find((item) => item.id === id)).filter(Boolean);
  if (next.length !== list.length) return false;
  const unchanged = next.every((item, index) => item.id === list[index]?.id);
  if (unchanged) return false;
  state.serviciosCatalog = next;
  updatePackageOrderBadges(grid);
  scheduleSave();
  return true;
}

function wireServicioReorder(grid, template) {
  let dragId = "";
  wireThumbMoveButtons(grid, () => syncServicioOrderFromGrid(grid, template));

  grid.addEventListener("dragstart", (event) => {
    if (isMobileAdmin()) {
      event.preventDefault();
      return;
    }
    const wrap = event.target.closest(".thumb-wrap");
    if (!wrap || !grid.contains(wrap)) return;
    if (event.target.closest(".thumb-actions, .thumb-move")) {
      event.preventDefault();
      return;
    }
    dragId = wrap.dataset.packageId || "";
    wrap.dataset.didDrag = "0";
    wrap.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragId);
  });

  grid.addEventListener("dragend", () => {
    grid.querySelectorAll(".thumb-wrap.is-dragging, .thumb-wrap.is-drop-target").forEach((node) => {
      node.classList.remove("is-dragging", "is-drop-target");
    });
    syncServicioOrderFromGrid(grid, template);
    dragId = "";
  });

  grid.addEventListener("dragover", (event) => {
    if (isMobileAdmin()) return;
    const target = event.target.closest(".thumb-wrap");
    if (!dragId || !target || target.dataset.packageId === dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    grid.querySelectorAll(".thumb-wrap.is-drop-target").forEach((node) => {
      if (node !== target) node.classList.remove("is-drop-target");
    });
    target.classList.add("is-drop-target");
    const source = grid.querySelector(`.thumb-wrap[data-package-id="${dragId}"]`);
    if (!source || source === target) return;
    const items = [...grid.children];
    const from = items.indexOf(source);
    const to = items.indexOf(target);
    if (from < 0 || to < 0 || from === to) return;
    if (from < to) grid.insertBefore(source, target.nextSibling);
    else grid.insertBefore(source, target);
    source.dataset.didDrag = "1";
    updatePackageOrderBadges(grid);
  });

  grid.addEventListener("drop", (event) => {
    event.preventDefault();
    syncServicioOrderFromGrid(grid, template);
  });
}

function renderServiciosCatalog() {
  mountShell("servicios-catalog", (main) => {
    const template = engine.get("servicio");
    const generation = ++shotGeneration;
    const jobs = [];
    sectionHead(main, "Servicios", newServicioButton(template));
    const grid = document.createElement("div");
    grid.className = "page-grid packages-sortable";
    engine.pages(state, template).forEach((page, index) => {
      grid.append(servicioThumb(page, template, jobs, index + 1));
    });
    if (!grid.childElementCount) {
      const empty = document.createElement("p");
      empty.className = "dash-lede";
      empty.textContent = "Aún no hay servicios. Cree el primero con el botón Nuevo servicio.";
      main.append(empty);
    } else {
      main.append(grid);
      wireServicioReorder(grid, template);
    }
    refreshMiniatures(jobs, generation);
  });
}

const SHOT_WIDTH = 1200;
const SHOT_HEIGHT = 840;
const SHOT_VERSION = "6";
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
  doc.querySelectorAll(".package-intro, .package-sections, .package-close").forEach((node) => node.remove());
  [...doc.querySelectorAll(".hero-copy")].slice(1).forEach((node) => node.remove());
  doc.querySelectorAll("body > .pkg-lead, .editor-note").forEach((node) => node.remove());

  // Inicio ya no tiene hero: la apertura es `.about`. No borrar esa sección.
  if (doc.querySelector(".hero")) {
    doc.querySelectorAll(".about, .coaches, .contact").forEach((node) => node.remove());
  } else if (doc.querySelector(".about")) {
    doc.querySelectorAll(".coaches, .contact").forEach((node) => node.remove());
  }

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

const ADMIN_NAV = [
  { id: "inicio", label: "Dashboard", href: "#/", area: "dashboard", featured: true },
  { id: "paginas", label: "Páginas", href: "#/paginas", area: "paginas" },
  { id: "paquetes", label: "Paquetes", href: "#/paquetes", area: "paquetes" },
  { id: "capillas", label: "Capillas", href: "#/capillas", area: "capillas" },
  { id: "servicios-catalog", label: "Servicios", href: "#/servicios-catalog", area: "servicios" },
  { id: "articulos", label: "Artículos", href: "#/articulos", area: "articulos" },
  { id: "comentarios", label: "Comentarios", href: "#/comentarios", area: "comentarios" },
];

function navItem(label, href, active) {
  const link = document.createElement("a");
  link.className = `dash-nav-link${active ? " is-active" : ""}`;
  link.href = href;
  link.textContent = label;
  return link;
}

function adminBentoTile(item, active) {
  const link = document.createElement("a");
  link.className = `bento-tile admin-bento-tile admin-bento-tile-${item.area}${item.featured ? " is-featured" : ""}${active ? " is-active" : ""}`;
  link.href = item.href;
  link.style.gridArea = item.area;
  const label = document.createElement("span");
  label.className = "bento-tile-label";
  label.textContent = item.label;
  link.append(label);
  return link;
}

function createAdminBentoMenu(section) {
  const dialog = document.createElement("dialog");
  dialog.className = "bento-menu admin-bento-menu";
  dialog.id = "admin-bento-menu";
  dialog.setAttribute("aria-label", "Menú de administración");

  const panel = document.createElement("div");
  panel.className = "bento-menu-panel";

  const bar = document.createElement("header");
  bar.className = "bento-menu-bar";
  const logo = document.createElement("a");
  logo.className = "logo";
  logo.href = "#/";
  logo.setAttribute("aria-label", "Shalom Admin, inicio");
  logo.innerHTML = '<img src="assets/logo-shalom.png" alt="" width="204" height="60" />';
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "icon-btn bento-close";
  closeBtn.setAttribute("aria-label", "Cerrar menú");
  closeBtn.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  bar.append(logo, closeBtn);

  const grid = document.createElement("nav");
  grid.className = "bento-grid admin-bento-grid";
  grid.setAttribute("aria-label", "Administración");
  ADMIN_NAV.forEach((item) => {
    grid.append(adminBentoTile(item, section === item.id));
  });

  const userWrap = document.createElement("div");
  userWrap.className = "admin-bento-user";
  userWrap.append(userMenu("admin-bento-user-menu"));

  panel.append(bar, grid, userWrap);
  dialog.append(panel);
  return dialog;
}

function wireAdminBento(root) {
  const toggle = root.querySelector(".dash-bento-toggle");
  const menu = root.querySelector(".admin-bento-menu");
  if (!toggle || !menu || menu.dataset.wired === "1") return;
  menu.dataset.wired = "1";

  const setExpanded = (open) => {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };

  const openMenu = () => {
    if (menu.open) return;
    if (typeof menu.showModal === "function") menu.showModal();
    else menu.setAttribute("open", "");
    setExpanded(true);
  };

  const closeMenu = () => {
    if (!menu.open) return;
    if (typeof menu.close === "function") menu.close();
    else menu.removeAttribute("open");
    setExpanded(false);
  };

  toggle.addEventListener("click", () => {
    if (menu.open) closeMenu();
    else openMenu();
  });
  menu.querySelector(".bento-close")?.addEventListener("click", closeMenu);
  menu.addEventListener("click", (event) => {
    if (event.target === menu) closeMenu();
  });
  menu.addEventListener("close", () => setExpanded(false));
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });
  window.matchMedia("(max-width: 860px)").addEventListener("change", (event) => {
    if (!event.matches) closeMenu();
  });
}

function mountShell(section, build) {
  document.body.classList.add("admin-shell");
  document.body.classList.remove("admin-editing");

  const shell = document.createElement("div");
  shell.className = "dash-shell";

  const aside = document.createElement("aside");
  aside.className = "dash-aside";

  const head = document.createElement("div");
  head.className = "dash-aside-head";
  const brand = document.createElement("a");
  brand.className = "dash-brand";
  brand.href = "#/";
  brand.setAttribute("aria-label", "Shalom Admin, inicio");
  brand.innerHTML =
    '<img src="assets/logo-shalom.png" alt="SHALOM Servicios Funerarios" width="204" height="60" /><span class="dash-brand-mark" aria-hidden="true">|</span><span class="dash-brand-admin">Admin</span>';

  const actions = document.createElement("div");
  actions.className = "dash-aside-actions";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "bento-toggle dash-bento-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "admin-bento-menu");
  toggle.setAttribute("aria-label", "Abrir menú");
  toggle.innerHTML = '<span class="bento-toggle-icon" aria-hidden="true"><i></i><i></i><i></i></span>';
  actions.append(toggle);
  head.append(brand, actions);

  const nav = document.createElement("nav");
  nav.className = "dash-nav";
  nav.setAttribute("aria-label", "Administración");
  ADMIN_NAV.forEach((item) => {
    nav.append(navItem(item.label, item.href, section === item.id));
  });

  aside.append(head, nav, userMenu("dash-logout"));

  const main = document.createElement("main");
  main.className = "dash-main";
  build(main);

  shell.append(aside, main);
  app.replaceChildren(shell);

  document.querySelector("#admin-bento-menu")?.remove();
  const bento = createAdminBentoMenu(section);
  app.append(bento);
  wireAdminBento(app);
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

function pagesOverflowMenu() {
  const wrap = document.createElement("div");
  wrap.className = "pages-menu";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "pages-menu-btn";
  button.setAttribute("aria-label", "Más opciones");
  button.setAttribute("aria-haspopup", "menu");
  button.setAttribute("aria-expanded", "false");
  button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="4.5" r="1.6" fill="currentColor"/><circle cx="10" cy="10" r="1.6" fill="currentColor"/><circle cx="10" cy="15.5" r="1.6" fill="currentColor"/></svg>';

  const menu = document.createElement("div");
  menu.className = "pages-menu-panel";
  menu.setAttribute("role", "menu");
  menu.hidden = true;

  const reloadBtn = document.createElement("button");
  reloadBtn.type = "button";
  reloadBtn.setAttribute("role", "menuitem");
  reloadBtn.textContent = "Recargar";
  reloadBtn.addEventListener("click", () => {
    close();
    reloadPagesSection();
  });

  menu.append(reloadBtn);
  wrap.append(button, menu);

  function close() {
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
    wrap.classList.remove("is-open");
  }

  function open() {
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
    wrap.classList.add("is-open");
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menu.hidden) open();
    else close();
  });

  document.addEventListener("click", (event) => {
    if (!wrap.contains(event.target)) close();
  });

  return wrap;
}

async function reloadPagesSection() {
  setSaveStatus("saving");
  try {
    await engine.reload();
    const content = await model.loadContent({ preferLocal: true });
    state = content;
    engine.prepare(state);
    state.miniatureStamps ||= {};
    engine.list().forEach((template) => {
      if (template.dashboard === false) return;
      delete state.miniatureStamps[template.id];
    });
    renderPages();
    setSaveStatus("saved");
  } catch (error) {
    setSaveStatus("error");
    console.error(error);
  }
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
    sectionHead(main, "Páginas", pagesOverflowMenu());
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

function commentStatusLabel(status) {
  if (status === "approved") return "Publicado";
  if (status === "archived") return "Archivado";
  return "Pendiente";
}

function formatCommentDate(value) {
  const date = new Date(Number(value) || 0);
  if (Number.isNaN(date.getTime()) || !value) return "";
  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function setCommentStatus(id, status) {
  const response = await fetch(`/api/comments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "No se pudo actualizar.");
  return payload.comment;
}

function renderComments() {
  mountShell("comentarios", (main) => {
    sectionHead(main, "Comentarios");
    const lede = document.createElement("p");
    lede.className = "dash-lede";
    lede.textContent =
      "Los visitantes dejan comentarios en Servicios. Autorice los que deben mostrarse en la página o archívelos.";
    main.append(lede);

    const filters = document.createElement("div");
    filters.className = "comments-admin-filters";
    const tabs = [
      { id: "pending", label: "Pendientes" },
      { id: "approved", label: "Publicados" },
      { id: "archived", label: "Archivados" },
      { id: "all", label: "Todos" },
    ];
    let active = "pending";
    const list = document.createElement("div");
    list.className = "comments-admin-list";
    let cache = [];

    const paint = () => {
      filters.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.filter === active);
      });
      const rows =
        active === "all" ? cache : cache.filter((item) => item.status === active);
      list.replaceChildren();
      if (!rows.length) {
        const empty = document.createElement("p");
        empty.className = "dash-lede";
        empty.textContent = "No hay comentarios en esta vista.";
        list.append(empty);
        return;
      }
      rows.forEach((item) => {
        const card = document.createElement("article");
        card.className = "comments-admin-card";
        const meta = document.createElement("div");
        meta.className = "comments-admin-meta";
        const name = document.createElement("strong");
        name.textContent = item.name || "Sin nombre";
        const badge = document.createElement("span");
        badge.className = `comments-admin-badge is-${item.status || "pending"}`;
        badge.textContent = commentStatusLabel(item.status);
        const when = document.createElement("time");
        when.textContent = formatCommentDate(item.createdAt);
        meta.append(name, badge, when);
        const body = document.createElement("p");
        body.textContent = item.message || "";
        const actions = document.createElement("div");
        actions.className = "comments-admin-actions";
        if (item.status !== "approved") {
          const approve = document.createElement("button");
          approve.type = "button";
          approve.className = "dash-new-btn";
          approve.textContent = "Autorizar";
          approve.addEventListener("click", async () => {
            approve.disabled = true;
            try {
              const updated = await setCommentStatus(item.id, "approved");
              const idx = cache.findIndex((row) => row.id === item.id);
              if (idx >= 0) cache[idx] = updated;
              paint();
            } catch (error) {
              approve.disabled = false;
              alert(error.message || "No se pudo autorizar.");
            }
          });
          actions.append(approve);
        }
        if (item.status !== "archived") {
          const archive = document.createElement("button");
          archive.type = "button";
          archive.className = "comments-admin-archive";
          archive.textContent = "Archivar";
          archive.addEventListener("click", async () => {
            archive.disabled = true;
            try {
              const updated = await setCommentStatus(item.id, "archived");
              const idx = cache.findIndex((row) => row.id === item.id);
              if (idx >= 0) cache[idx] = updated;
              paint();
            } catch (error) {
              archive.disabled = false;
              alert(error.message || "No se pudo archivar.");
            }
          });
          actions.append(archive);
        }
        card.append(meta, body, actions);
        list.append(card);
      });
    };

    tabs.forEach((tab) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.filter = tab.id;
      btn.textContent = tab.label;
      btn.addEventListener("click", () => {
        active = tab.id;
        paint();
      });
      filters.append(btn);
    });

    main.append(filters, list);
    list.textContent = "Cargando…";
    fetch("/api/comments/all", { credentials: "same-origin" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "error");
        cache = Array.isArray(payload.comments) ? payload.comments : [];
        paint();
      })
      .catch(() => {
        list.textContent = "No se pudieron cargar los comentarios.";
      });
  });
}

function renderPackages() {
  mountShell("paquetes", (main) => {
    const template = engine.get("paquete");
    const generation = ++shotGeneration;
    const jobs = [];
    sectionHead(main, "Paquetes", newPackageButton(template));
    const grid = document.createElement("div");
    grid.className = "page-grid packages-sortable";
    engine.pages(state, template).forEach((page, index) => {
      grid.append(packageThumb(page, template, jobs, index + 1));
    });
    if (!grid.childElementCount) {
      const empty = document.createElement("p");
      empty.className = "dash-lede";
      empty.textContent = "Aún no hay paquetes. Cree el primero con el botón Nuevo paquete.";
      main.append(empty);
    } else {
      main.append(grid);
      wirePackageReorder(grid, template);
    }
    refreshMiniatures(jobs, generation);
  });
}

function createArticuloForm(template, onCreated) {
  const form = document.createElement("form");
  form.className = "create-form create-form-modal";
  const input = document.createElement("input");
  input.name = "title";
  input.required = true;
  input.placeholder = "Título del nuevo artículo";
  input.autocomplete = "off";
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Crear artículo";
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

function newArticuloButton(template) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "dash-new-btn";
  button.textContent = "Nuevo artículo";
  button.addEventListener("click", () => {
    let dialog;
    const form = createArticuloForm(template, (page) => {
      dialog?.close();
      location.hash = `#/articulos/${page.id}`;
    });
    dialog = openDialog({
      title: "Nuevo artículo",
      body: form,
      hideConfirm: true,
      hideCancel: true,
    });
  });
  return button;
}

async function uploadArticuloImage(file) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/upload", {
    method: "POST",
    credentials: "same-origin",
    body: form,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "No se pudo subir la imagen");
  return payload.url;
}

function formatArticuloListDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value || "";
  return date.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

function renderArticulos() {
  mountShell("articulos", (main) => {
    const template = engine.get("articulo");
    sectionHead(main, "Artículos", newArticuloButton(template));
    const lede = document.createElement("p");
    lede.className = "dash-lede";
    lede.textContent = "Estos artículos aparecen como tarjetas a pantalla completa en la página Nosotros.";
    main.append(lede);
    const list = document.createElement("div");
    list.className = "articulos-admin-list";
    const pages = engine.pages(state, template);
    if (!pages.length) {
      const empty = document.createElement("p");
      empty.className = "dash-lede";
      empty.textContent = "Aún no hay artículos. Cree el primero con el botón Nuevo artículo.";
      main.append(empty);
      return;
    }
    pages.forEach((page) => {
      const card = document.createElement("article");
      card.className = `articulos-admin-card${page.hidden ? " is-hidden" : ""}`;
      const cover = document.createElement("div");
      cover.className = "articulos-admin-cover";
      if (page.images?.[0]?.src) {
        const img = document.createElement("img");
        img.src = page.images[0].src;
        img.alt = "";
        cover.append(img);
      }
      const body = document.createElement("div");
      body.className = "articulos-admin-body";
      const title = document.createElement("h2");
      title.textContent = page.title || "Sin título";
      const meta = document.createElement("p");
      meta.textContent = [
        formatArticuloListDate(page.date),
        `${page.images?.length || 0} imagen${(page.images?.length || 0) === 1 ? "" : "es"}`,
        page.hidden ? "Oculto" : "Publicado",
      ].filter(Boolean).join(" · ");
      const actions = document.createElement("div");
      actions.className = "articulos-admin-actions";
      const edit = document.createElement("a");
      edit.className = "dash-new-btn";
      edit.href = `#/articulos/${page.id}`;
      edit.textContent = "Editar";
      const hide = document.createElement("button");
      hide.type = "button";
      hide.className = "comments-admin-archive";
      hide.textContent = page.hidden ? "Mostrar" : "Ocultar";
      hide.addEventListener("click", () => {
        page.hidden = !page.hidden;
        scheduleSave();
        renderArticulos();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "comments-admin-archive";
      remove.textContent = "Eliminar";
      remove.addEventListener("click", () => {
        openDialog({
          title: "Eliminar artículo",
          body: `¿Eliminar «${page.title}»? Esta acción no se puede deshacer.`,
          confirmLabel: "Eliminar",
          tone: "danger",
          onConfirm() {
            const listPages = engine.pages(state, template);
            const index = listPages.findIndex((item) => item.id === page.id);
            if (index >= 0) listPages.splice(index, 1);
            scheduleSave();
            renderArticulos();
          },
        });
      });
      actions.append(edit, hide, remove);
      body.append(title, meta, actions);
      card.append(cover, body);
      list.append(card);
    });
    main.append(list);
  });
}

function renderArticuloEditor(page) {
  document.body.classList.add("admin-editing");
  document.body.classList.remove("admin-shell");
  page.images = Array.isArray(page.images) ? page.images : [];
  const maxImages = window.ShalomModel.ARTICULO_MAX_IMAGES || 20;
  const sheet = document.createElement("div");
  sheet.className = "editor-sheet articulo-editor";

  const form = document.createElement("form");
  form.className = "articulo-form";
  form.innerHTML = `
    <label>Título
      <input name="title" type="text" required maxlength="140" />
    </label>
    <label>Fecha
      <input name="date" type="date" required />
    </label>
    <div class="articulo-rte">
      <div class="articulo-rte-label">Texto</div>
      <div class="articulo-rte-toolbar" role="toolbar" aria-label="Formato">
        <button type="button" data-cmd="bold"><b>B</b></button>
        <button type="button" data-cmd="italic"><i>I</i></button>
        <button type="button" data-cmd="insertUnorderedList">• Lista</button>
        <button type="button" data-cmd="insertOrderedList">1. Lista</button>
        <button type="button" data-cmd="createLink">Enlace</button>
      </div>
      <div class="articulo-rte-body" contenteditable="true" role="textbox" aria-multiline="true"></div>
    </div>
    <div class="articulo-images">
      <div class="articulo-images-head">
        <strong>Imágenes</strong>
        <span class="articulo-images-count"></span>
      </div>
      <div class="articulo-images-grid"></div>
      <label class="articulo-upload-btn">
        Agregar imágenes
        <input type="file" accept="image/*" multiple hidden />
      </label>
      <p class="dash-lede articulo-images-hint">Máximo ${maxImages}. Se optimizan automáticamente a WebP.</p>
    </div>
  `;

  const titleInput = form.querySelector('input[name="title"]');
  const dateInput = form.querySelector('input[name="date"]');
  const rte = form.querySelector(".articulo-rte-body");
  const grid = form.querySelector(".articulo-images-grid");
  const count = form.querySelector(".articulo-images-count");
  const fileInput = form.querySelector('input[type="file"]');

  titleInput.value = page.title || "";
  dateInput.value = page.date || "";
  rte.innerHTML = page.body || "<p></p>";

  const paintImages = () => {
    grid.replaceChildren();
    count.textContent = `${page.images.length} / ${maxImages}`;
    page.images.forEach((image, index) => {
      const item = document.createElement("div");
      item.className = "articulo-image-item";
      const img = document.createElement("img");
      img.src = image.src;
      img.alt = image.alt || "";
      const alt = document.createElement("input");
      alt.type = "text";
      alt.placeholder = "Texto alternativo";
      alt.value = image.alt || "";
      alt.addEventListener("input", () => {
        page.images[index].alt = alt.value;
        scheduleSave();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "articulo-image-remove";
      remove.textContent = "Quitar";
      remove.addEventListener("click", () => {
        page.images.splice(index, 1);
        paintImages();
        scheduleSave();
      });
      item.append(img, alt, remove);
      grid.append(item);
    });
  };
  paintImages();

  form.querySelectorAll(".articulo-rte-toolbar button").forEach((button) => {
    button.addEventListener("click", () => {
      const cmd = button.dataset.cmd;
      if (cmd === "createLink") {
        const url = window.prompt("URL del enlace");
        if (url) document.execCommand(cmd, false, url);
      } else {
        document.execCommand(cmd, false, null);
      }
      rte.focus();
      page.body = window.ShalomModel.sanitizeArticuloHtml(rte.innerHTML);
      scheduleSave();
    });
  });

  const persistText = () => {
    page.title = titleInput.value.trim() || "Nuevo artículo";
    page.date = dateInput.value || page.date;
    page.body = window.ShalomModel.sanitizeArticuloHtml(rte.innerHTML);
    scheduleSave();
  };
  titleInput.addEventListener("input", persistText);
  dateInput.addEventListener("change", persistText);
  rte.addEventListener("input", persistText);

  fileInput.addEventListener("change", async () => {
    const files = [...(fileInput.files || [])];
    fileInput.value = "";
    if (!files.length) return;
    const room = maxImages - page.images.length;
    if (room <= 0) {
      window.alert(`Solo se permiten ${maxImages} imágenes por artículo.`);
      return;
    }
    for (const file of files.slice(0, room)) {
      try {
        const url = await uploadArticuloImage(file);
        page.images.push({ src: url, alt: "" });
      } catch (error) {
        window.alert(error.message || "No se pudo subir la imagen");
        break;
      }
    }
    paintImages();
    scheduleSave();
  });

  sheet.append(form);
  app.replaceChildren(editorBar(page.title || "Artículo"), sheet);
  const back = app.querySelector(".admin-back");
  if (back) {
    back.href = "#/articulos";
    back.setAttribute("aria-label", "Volver a Artículos");
  }
}

function editorBar(title) {
  const bar = document.createElement("div");
  bar.className = "admin-bar";
  const back = document.createElement("a");
  const onPackage = location.hash.includes("/edit/paquete/");
  const onCapilla = location.hash.includes("/edit/capilla/");
  const onServicio = location.hash.includes("/edit/servicio/");
  const onArticulo = location.hash.startsWith("#/articulos/");
  back.href = onPackage
    ? "#/paquetes"
    : onCapilla
      ? "#/capillas"
      : onServicio
        ? "#/servicios-catalog"
        : onArticulo
          ? "#/articulos"
          : "#/paginas";
  back.className = "admin-back";
  back.setAttribute(
    "aria-label",
    onPackage
      ? "Volver a Paquetes"
      : onCapilla
        ? "Volver a Capillas"
        : onServicio
          ? "Volver a Servicios"
          : onArticulo
            ? "Volver a Artículos"
            : "Volver a Páginas"
  );
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

function collectionHome(template) {
  if (template?.pagesKey === "capillas") return "#/capillas";
  if (template?.pagesKey === "serviciosCatalog") return "#/servicios-catalog";
  if (template?.pagesKey === "articulos") return "#/articulos";
  return "#/paquetes";
}

function route() {
  const hash = location.hash || "#/";
  if (hash === "#/" || hash === "#" || hash === "#/inicio") return renderHome();
  if (hash === "#/paginas") return renderPages();
  if (hash === "#/paquetes") return renderPackages();
  if (hash === "#/capillas") return renderCapillas();
  if (hash === "#/servicios-catalog") return renderServiciosCatalog();
  if (hash === "#/articulos") return renderArticulos();
  if (hash === "#/comentarios") return renderComments();
  const articuloMatch = hash.match(/^#\/articulos\/([a-z0-9-]+)$/);
  if (articuloMatch) {
    const template = engine.get("articulo");
    const page = engine.pages(state, template).find((item) => item.id === articuloMatch[1]);
    if (!page) {
      location.hash = "#/articulos";
      return;
    }
    return renderArticuloEditor(page);
  }
  if (hash === "#/edit/plantilla") {
    location.hash = "#/paquetes";
    return;
  }
  if (hash === "#/edit/paquete") {
    location.hash = "#/paquetes";
    return;
  }
  if (hash === "#/edit/capilla") {
    location.hash = "#/capillas";
    return;
  }
  if (hash === "#/edit/servicio") {
    location.hash = "#/servicios-catalog";
    return;
  }
  if (hash === "#/edit/articulo" || hash.startsWith("#/edit/articulo/")) {
    const id = hash.match(/^#\/edit\/articulo\/([a-z0-9-]+)$/)?.[1];
    location.hash = id ? `#/articulos/${id}` : "#/articulos";
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
    location.hash = collectionHome(template);
    return;
  }
  if (template.id === "articulo") {
    location.hash = `#/articulos/${match[2]}`;
    return;
  }
  const page = engine.pages(state, template).find((item) => item.id === match[2]);
  if (!page) {
    location.hash = collectionHome(template);
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
    return engine.load().then(() => model.loadContent({ preferLocal: true }));
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
