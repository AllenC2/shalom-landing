import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { ROOT } from "./content.js";

const COMMENTS_FILE = path.join(ROOT, "data", "comments.json");
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_HITS = 8;

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

async function readAll() {
  try {
    const raw = await readFile(COMMENTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeAll(list) {
  await mkdir(path.dirname(COMMENTS_FILE), { recursive: true });
  await writeFile(COMMENTS_FILE, JSON.stringify(list, null, 2), "utf8");
}

export function checkCommentRateLimit(c) {
  if (rateLimited(clientIp(c))) {
    return { ok: false, error: "Demasiados comentarios. Intente en un minuto." };
  }
  return { ok: true };
}

export function parseCommentPayload(body = {}) {
  const name = clean(body.name, 80);
  const message = clean(body.message, 800);
  const company = clean(body.company, 120);
  if (company) return { spam: true };
  if (!name || name.length < 2) return { ok: false, error: "Escriba su nombre." };
  if (!message || message.length < 8) return { ok: false, error: "Escriba un comentario un poco más largo." };
  return { ok: true, data: { name, message } };
}

export async function listApprovedComments() {
  const list = await readAll();
  return list
    .filter((item) => item.status === "approved")
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map(({ id, name, message, createdAt }) => ({ id, name, message, createdAt }));
}

export async function listAllComments() {
  const list = await readAll();
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function createComment(data) {
  const list = await readAll();
  const item = {
    id: `c-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`,
    name: data.name,
    message: data.message,
    status: "pending",
    createdAt: Date.now(),
  };
  list.unshift(item);
  await writeAll(list);
  return item;
}

export async function updateCommentStatus(id, status) {
  if (!["approved", "archived", "pending"].includes(status)) {
    return { ok: false, error: "Estado inválido." };
  }
  const list = await readAll();
  const item = list.find((row) => row.id === id);
  if (!item) return { ok: false, error: "Comentario no encontrado." };
  item.status = status;
  item.updatedAt = Date.now();
  await writeAll(list);
  return { ok: true, item };
}
