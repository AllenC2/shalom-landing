import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ANALYTICS_FILE = path.join(ROOT, "data", "analytics.json");

const PAGES = new Set(["inicio", "nosotros"]);
const DAY_KEEP = 90;
const DAY_SHOW = 7;
const MAX_WEEKS_BACK = 12;

const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_HITS = 60;

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function emptyPage() {
  return {
    totalViews: 0,
    dwellMsSum: 0,
    dwellSamples: 0,
    days: {},
  };
}

function emptyStore() {
  return {
    pages: {
      inicio: emptyPage(),
      nosotros: emptyPage(),
    },
  };
}

export async function readAnalytics() {
  try {
    const raw = await readFile(ANALYTICS_FILE, "utf8");
    const data = JSON.parse(raw);
    if (!data?.pages) return emptyStore();
    for (const id of PAGES) {
      data.pages[id] = { ...emptyPage(), ...(data.pages[id] || {}) };
      data.pages[id].days = { ...(data.pages[id].days || {}) };
      delete data.pages[id].heat;
    }
    return data;
  } catch {
    return emptyStore();
  }
}

async function writeAnalytics(data) {
  await mkdir(path.dirname(ANALYTICS_FILE), { recursive: true });
  await writeFile(ANALYTICS_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function pruneDays(days, keep = DAY_KEEP) {
  const keys = Object.keys(days).sort();
  if (keys.length <= keep) return days;
  const drop = keys.slice(0, keys.length - keep);
  const next = { ...days };
  drop.forEach((key) => delete next[key]);
  return next;
}

function clientIp(c) {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return c.req.header("x-real-ip") || "local";
}

export function checkAnalyticsRateLimit(c) {
  const ip = clientIp(c);
  const now = Date.now();
  const row = hits.get(ip) || { count: 0, start: now };
  if (now - row.start > WINDOW_MS) {
    hits.set(ip, { count: 1, start: now });
    return { ok: true };
  }
  row.count += 1;
  hits.set(ip, row);
  if (row.count > MAX_HITS) {
    return { ok: false, error: "Demasiados eventos. Espere un momento." };
  }
  return { ok: true };
}

export function parseAnalyticsEvent(body = {}) {
  const page = String(body.page || "");
  const type = String(body.type || "");
  if (!PAGES.has(page)) return { ok: false, error: "Página no válida" };
  if (!["view", "dwell"].includes(type)) return { ok: false, error: "Tipo no válido" };

  if (type === "view") return { ok: true, event: { page, type: "view" } };

  const ms = Math.round(Number(body.ms) || 0);
  if (ms < 2000 || ms > 60 * 60 * 1000) return { ok: false, error: "Duración no válida" };
  return { ok: true, event: { page, type: "dwell", ms } };
}

export async function recordAnalyticsEvent(event) {
  const data = await readAnalytics();
  const page = data.pages[event.page] || emptyPage();
  const day = todayKey();

  if (event.type === "view") {
    page.totalViews += 1;
    page.days[day] = (page.days[day] || 0) + 1;
    page.days = pruneDays(page.days);
  } else if (event.type === "dwell") {
    page.dwellMsSum += event.ms;
    page.dwellSamples += 1;
  }

  delete page.heat;
  data.pages[event.page] = page;
  await writeAnalytics(data);
  return { ok: true };
}

function lastDays(count, weeksBack = 0) {
  const out = [];
  const now = new Date();
  const endOffset = weeksBack * DAY_SHOW;
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(now.getDate() - endOffset - i);
    out.push(todayKey(d));
  }
  return out;
}

function parseDayKey(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function weekLabel(dayKeys) {
  if (!dayKeys.length) return "";
  const start = parseDayKey(dayKeys[0]);
  const end = parseDayKey(dayKeys[dayKeys.length - 1]);
  const startMonth = MONTHS_ES[start.getMonth()];
  const endMonth = MONTHS_ES[end.getMonth()];
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${start.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${startMonth} – ${endMonth} ${end.getFullYear()}`;
  }
  return `${startMonth} ${start.getFullYear()} – ${endMonth} ${end.getFullYear()}`;
}

export async function getAnalyticsSummary(weeksBack = 0) {
  const offset = Math.max(0, Math.min(MAX_WEEKS_BACK, Number(weeksBack) || 0));
  const data = await readAnalytics();
  const dayKeys = lastDays(DAY_SHOW, offset);
  const pages = {};
  for (const id of PAGES) {
    const page = data.pages[id] || emptyPage();
    pages[id] = {
      totalViews: page.totalViews || 0,
      avgDwellMs: page.dwellSamples
        ? Math.round(page.dwellMsSum / page.dwellSamples)
        : 0,
      dwellSamples: page.dwellSamples || 0,
      days: dayKeys.map((key) => ({ date: key, views: page.days?.[key] || 0 })),
    };
  }
  return {
    pages,
    weeksBack: offset,
    maxWeeksBack: MAX_WEEKS_BACK,
    weekLabel: weekLabel(dayKeys),
    weekStart: dayKeys[0] || "",
    weekEnd: dayKeys[dayKeys.length - 1] || "",
  };
}
