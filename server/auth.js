import { getSignedCookie, setSignedCookie, deleteCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import { readAdminData, writeAdminData } from "./settings.js";

const COOKIE = "shalom_session";
const MAX_AGE = 60 * 60 * 24 * 14;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

export function authConfig() {
  return {
    user: process.env.ADMIN_USER || "admin",
    passwordHash: process.env.ADMIN_PASSWORD_HASH || "",
    secret: process.env.SESSION_SECRET || "dev-only-change-me",
    secure: process.env.NODE_ENV === "production",
  };
}

async function resolvePasswordHash() {
  const data = await readAdminData();
  const stored = typeof data.passwordHash === "string" ? data.passwordHash : "";
  return stored || authConfig().passwordHash;
}

export async function verifyLogin(username, password) {
  const { user } = authConfig();
  const hash = await resolvePasswordHash();
  if (!hash) return false;
  if (username !== user) return false;
  return bcrypt.compare(password, hash);
}

export async function changePassword(username, currentPassword, nextPassword) {
  const { user } = authConfig();
  if (username !== user) return { ok: false, error: "Usuario no válido" };
  const current = String(currentPassword || "");
  const next = String(nextPassword || "");
  if (next.length < 8) return { ok: false, error: "La nueva contraseña debe tener al menos 8 caracteres" };
  const hash = await resolvePasswordHash();
  if (!hash || !(await bcrypt.compare(current, hash))) {
    return { ok: false, error: "La contraseña actual no es correcta" };
  }
  const passwordHash = await bcrypt.hash(next, 12);
  await writeAdminData({ passwordHash });
  return { ok: true };
}

export async function readSession(c) {
  const { secret } = authConfig();
  const value = await getSignedCookie(c, secret, COOKIE);
  if (!value) return null;
  try {
    const session = JSON.parse(value);
    if (!session?.user || !session?.exp) return null;
    if (Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

export async function writeSession(c, username) {
  const { secret, secure } = authConfig();
  const session = JSON.stringify({
    user: username,
    exp: Date.now() + MAX_AGE * 1000,
  });
  await setSignedCookie(c, COOKIE, session, secret, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure,
    maxAge: MAX_AGE,
  });
}

export function clearSession(c) {
  deleteCookie(c, COOKIE, { path: "/" });
}

export async function requireAdmin(c, next) {
  const session = await readSession(c);
  if (!session) {
    const pathName = new URL(c.req.url).pathname;
    if (pathName.startsWith("/api/")) return c.json({ error: "Unauthorized" }, 401);
    return c.redirect(`/login?next=${encodeURIComponent(pathName)}`);
  }
  c.set("admin", session);
  return next();
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export { requireEnv };
