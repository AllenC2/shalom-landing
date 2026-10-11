import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ROOT } from "./content.js";

const CACHE = path.join(ROOT, "data", "media-cache");
const ALLOWED = new Set([480, 640, 720, 960, 1200, 1600]);
const ASSETS = path.join(ROOT, "assets");

function resolveAsset(src) {
  const raw = String(src || "").trim().replace(/^\/+/, "");
  if (!raw || raw.includes("\0") || raw.includes("..")) return null;
  if (!raw.startsWith("assets/")) return null;
  const absolute = path.resolve(ROOT, raw);
  if (!absolute.startsWith(ASSETS + path.sep) && absolute !== ASSETS) return null;
  return { relative: raw, absolute };
}

export async function serveResizedMedia(c) {
  const src = c.req.query("src") || "";
  const width = Number(c.req.query("w") || 0);
  const target = ALLOWED.has(width) ? width : 0;
  const asset = resolveAsset(src);
  if (!asset) return c.text("Bad request", 400);
  if (!target) return c.redirect(`/${asset.relative}`, 302);

  let input;
  try {
    input = await readFile(asset.absolute);
  } catch {
    return c.text("Not found", 404);
  }

  const key = createHash("sha1").update(`${asset.relative}|${target}|v1`).digest("hex");
  const cached = path.join(CACHE, `${key}.webp`);

  try {
    const hit = await readFile(cached);
    c.header("Content-Type", "image/webp");
    c.header("Cache-Control", "public, max-age=31536000, immutable");
    c.header("X-Media-Cache", "HIT");
    return c.body(hit);
  } catch {
    /* miss */
  }

  let output;
  try {
    output = await sharp(input)
      .rotate()
      .resize({
        width: target,
        height: target,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();
  } catch {
    return c.text("Unsupported image", 415);
  }

  await mkdir(CACHE, { recursive: true });
  writeFile(cached, output).catch(() => {});

  c.header("Content-Type", "image/webp");
  c.header("Cache-Control", "public, max-age=31536000, immutable");
  c.header("X-Media-Cache", "MISS");
  return c.body(output);
}
