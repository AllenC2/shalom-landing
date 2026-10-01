import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "data", "content.json");
const TEMPLATES = path.join(ROOT, "templates");

export { ROOT, CONTENT, TEMPLATES };

export async function readContent() {
  try {
    const raw = await readFile(CONTENT, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") return {};
    throw error;
  }
}

export async function writeContent(body) {
  const parsed = typeof body === "string" ? JSON.parse(body) : body;
  await mkdir(path.dirname(CONTENT), { recursive: true });
  await writeFile(CONTENT, JSON.stringify(parsed, null, 2), "utf8");
  return parsed;
}

export async function listTemplates() {
  const { readdir } = await import("node:fs/promises");
  try {
    const names = await readdir(TEMPLATES);
    return names.filter((name) => name.endsWith(".js")).sort();
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
}
