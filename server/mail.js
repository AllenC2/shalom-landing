import { getMailSettings, isValidEmail } from "./settings.js";

const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_HITS = 5;

function clientIp(c) {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return c.req.header("x-real-ip") || "local";
}

function rateLimited(ip) {
  const now = Date.now();
  const row = hits.get(ip) || { count: 0, start: now };
  if (now - row.start > WINDOW_MS) {
    hits.set(ip, { count: 1, start: now });
    return false;
  }
  row.count += 1;
  hits.set(ip, row);
  return row.count > MAX_HITS;
}

function clean(value, max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function parseContactPayload(body = {}) {
  const name = clean(body.name, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 60);
  const program = clean(body.program, 80);
  const note = clean(body.note, 2000);
  const honeypot = clean(body.company, 80);

  if (honeypot) return { ok: false, spam: true };
  if (!name || !email || !program || !note) {
    return { ok: false, error: "Complete nombre, correo, servicio y mensaje." };
  }
  if (!isValidEmail(email)) return { ok: false, error: "Escriba un correo válido." };
  return { ok: true, data: { name, email, phone, program, note } };
}

export async function sendContactEmail(payload) {
  const settings = await getMailSettings();
  if (!settings.contactEmail || !settings.mailFrom || !settings.resendApiKey) {
    return {
      ok: false,
      status: 503,
      error: "El correo de contacto aún no está configurado en el admin.",
    };
  }

  const subject = `Nuevo contacto — ${payload.program}`;
  const text = [
    `Nombre: ${payload.name}`,
    `Correo: ${payload.email}`,
    `Teléfono: ${payload.phone || "—"}`,
    `Servicio: ${payload.program}`,
    "",
    "Mensaje:",
    payload.note,
  ].join("\n");

  const html = `
    <h2>Nuevo contacto desde el sitio</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(payload.phone || "—")}</p>
    <p><strong>Servicio:</strong> ${escapeHtml(payload.program)}</p>
    <p><strong>Mensaje:</strong></p>
    <p>${escapeHtml(payload.note).replace(/\n/g, "<br>")}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: settings.mailFrom,
      to: [settings.contactEmail],
      reply_to: payload.email,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend error", response.status, detail);
    return {
      ok: false,
      status: 502,
      error: "No se pudo enviar el mensaje. Revise la API key y el Mail From en el admin.",
    };
  }

  return { ok: true };
}

export function checkContactRateLimit(c) {
  const ip = clientIp(c);
  if (rateLimited(ip)) {
    return { ok: false, error: "Demasiados intentos. Espere un momento e inténtelo de nuevo." };
  }
  return { ok: true };
}
