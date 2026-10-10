import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { clearSession, changePassword, readSession, requireAdmin, verifyLogin, writeSession } from "./auth.js";
import { listTemplates, readContent, ROOT, writeContent } from "./content.js";
import { getPublicMailSettings, setMailSettings } from "./settings.js";
import { checkContactRateLimit, parseContactPayload, sendContactEmail } from "./mail.js";
import {
  checkAnalyticsRateLimit,
  getAnalyticsSummary,
  parseAnalyticsEvent,
  recordAnalyticsEvent,
} from "./analytics.js";
import {
  checkCommentRateLimit,
  createComment,
  listAllComments,
  listApprovedComments,
  parseCommentPayload,
  updateCommentStatus,
} from "./comments.js";

const PORT = Number(process.env.PORT || 3000);
const UPLOADS = path.join(ROOT, "assets", "uploads");
const app = new Hono();

app.use("*", async (c, next) => {
  await next();
  c.header("Cache-Control", "no-store");
});

app.get("/api/me", async (c) => {
  const session = await readSession(c);
  if (!session) return c.json({ ok: false }, 401);
  return c.json({ ok: true, user: session.user });
});

app.post("/api/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const username = String(body.username || "");
  const password = String(body.password || "");
  const ok = await verifyLogin(username, password);
  if (!ok) return c.json({ error: "Usuario o contraseña incorrectos" }, 401);
  await writeSession(c, username);
  return c.json({ ok: true });
});

app.post("/api/logout", requireAdmin, async (c) => {
  clearSession(c);
  return c.json({ ok: true });
});

app.post("/api/password", requireAdmin, async (c) => {
  const session = c.get("admin");
  const body = await c.req.json().catch(() => ({}));
  const result = await changePassword(session.user, body.currentPassword, body.newPassword);
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true });
});

app.get("/api/settings/contact-email", requireAdmin, async (c) => {
  return c.json(await getPublicMailSettings());
});

app.put("/api/settings/contact-email", requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const result = await setMailSettings(body);
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({
    ok: true,
    contactEmail: result.contactEmail,
    mailFrom: result.mailFrom,
    hasResendApiKey: result.hasResendApiKey,
  });
});

app.post("/api/contact", async (c) => {
  const limited = checkContactRateLimit(c);
  if (!limited.ok) return c.json({ error: limited.error }, 429);

  const body = await c.req.json().catch(() => ({}));
  const parsed = parseContactPayload(body);
  if (parsed.spam) return c.json({ ok: true });
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);

  const sent = await sendContactEmail(parsed.data);
  if (!sent.ok) return c.json({ error: sent.error }, sent.status || 502);
  return c.json({ ok: true });
});

app.post("/api/analytics", async (c) => {
  const limited = checkAnalyticsRateLimit(c);
  if (!limited.ok) return c.json({ error: limited.error }, 429);
  const body = await c.req.json().catch(() => ({}));
  const parsed = parseAnalyticsEvent(body);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  await recordAnalyticsEvent(parsed.event);
  return c.json({ ok: true });
});

app.get("/api/analytics", requireAdmin, async (c) => {
  const weeksBack = Number(c.req.query("weeksBack") || 0);
  return c.json(await getAnalyticsSummary(weeksBack));
});

app.get("/api/comments", async (c) => {
  return c.json({ ok: true, comments: await listApprovedComments() });
});

app.post("/api/comments", async (c) => {
  const limited = checkCommentRateLimit(c);
  if (!limited.ok) return c.json({ error: limited.error }, 429);
  const body = await c.req.json().catch(() => ({}));
  const parsed = parseCommentPayload(body);
  if (parsed.spam) return c.json({ ok: true });
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  await createComment(parsed.data);
  return c.json({ ok: true });
});

app.get("/api/comments/all", requireAdmin, async (c) => {
  return c.json({ ok: true, comments: await listAllComments() });
});

app.patch("/api/comments/:id", requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const result = await updateCommentStatus(c.req.param("id"), String(body.status || ""));
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true, comment: result.item });
});

app.post("/api/upload", requireAdmin, async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return c.json({ error: "Seleccione una imagen" }, 400);
  }
  const type = String(file.type || "");
  if (!type.startsWith("image/")) return c.json({ error: "El archivo debe ser una imagen" }, 400);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length) return c.json({ error: "Archivo vacío" }, 400);
  if (buffer.length > 12 * 1024 * 1024) return c.json({ error: "La imagen supera 12 MB" }, 400);

  let output;
  try {
    output = await sharp(buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch {
    return c.json({ error: "No se pudo optimizar la imagen" }, 400);
  }

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
  await mkdir(UPLOADS, { recursive: true });
  await writeFile(path.join(UPLOADS, filename), output);
  return c.json({ url: `assets/uploads/${filename}`, bytes: output.length });
});

app.get("/api/content", async (c) => {
  return c.json(await readContent());
});

app.put("/api/content", requireAdmin, async (c) => {
  const raw = await c.req.text();
  try {
    await writeContent(raw);
  } catch {
    return c.json({ error: "JSON inválido" }, 400);
  }
  return c.body(null, 204);
});

app.get("/api/templates", async (c) => {
  return c.json(await listTemplates());
});

app.get("/admin", requireAdmin, async (c) => {
  const html = await readFile(path.join(ROOT, "admin.html"), "utf8");
  return c.html(html);
});

app.get("/login", async (c) => {
  const html = await readFile(path.join(ROOT, "login.html"), "utf8");
  return c.html(html);
});

app.get("/admin.html", (c) => c.redirect("/admin", 301));
app.get("/login.html", (c) => {
  const next = new URL(c.req.url).searchParams.get("next");
  return c.redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login", 301);
});

app.use("/admin.js", requireAdmin);
app.use("/vendor/html2canvas.min.js", requireAdmin);

app.use("/*", serveStatic({ root: "./" }));

app.notFound((c) => c.text("Not found", 404));

serve({ fetch: app.fetch, port: PORT, hostname: "0.0.0.0" }, (info) => {
  console.log(`Serving Shalom at http://127.0.0.1:${info.port}/`);
});
