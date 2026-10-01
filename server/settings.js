import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ADMIN_FILE = path.join(ROOT, "data", "admin.json");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM_RE = /^(?:.+<\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*>|[^\s@]+@[^\s@]+\.[^\s@]+)$/;

export async function readAdminData() {
  try {
    const raw = await readFile(ADMIN_FILE, "utf8");
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export async function writeAdminData(patch) {
  const current = await readAdminData();
  const next = { ...current, ...patch };
  await mkdir(path.dirname(ADMIN_FILE), { recursive: true });
  await writeFile(ADMIN_FILE, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

function trim(value) {
  return String(value || "").trim();
}

export function isValidEmail(value) {
  return EMAIL_RE.test(trim(value));
}

export function isValidMailFrom(value) {
  return FROM_RE.test(trim(value));
}

export async function getMailSettings() {
  const data = await readAdminData();
  return {
    contactEmail: trim(data.contactEmail),
    mailFrom: trim(data.mailFrom),
    resendApiKey: trim(data.resendApiKey),
  };
}

export async function getPublicMailSettings() {
  const settings = await getMailSettings();
  return {
    contactEmail: settings.contactEmail,
    mailFrom: settings.mailFrom,
    hasResendApiKey: Boolean(settings.resendApiKey),
  };
}

export async function setMailSettings(input = {}) {
  const current = await getMailSettings();
  const contactEmail = trim(input.contactEmail);
  const mailFrom = trim(input.mailFrom);
  const incomingKey = Object.prototype.hasOwnProperty.call(input, "resendApiKey")
    ? trim(input.resendApiKey)
    : null;

  if (!contactEmail) return { ok: false, error: "Escriba el correo de contacto" };
  if (!isValidEmail(contactEmail)) return { ok: false, error: "El correo de contacto no es válido" };
  if (!mailFrom) return { ok: false, error: "Escriba el correo Remitente (Mail From)" };
  if (!isValidMailFrom(mailFrom)) {
    return { ok: false, error: "Mail From inválido. Use correo@dominio.com o Nombre <correo@dominio.com>" };
  }

  const resendApiKey = incomingKey === null || incomingKey === ""
    ? current.resendApiKey
    : incomingKey;

  if (!resendApiKey) return { ok: false, error: "Escriba la API key de Resend" };

  await writeAdminData({ contactEmail, mailFrom, resendApiKey });
  return {
    ok: true,
    contactEmail,
    mailFrom,
    hasResendApiKey: true,
  };
}
