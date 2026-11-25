import { CLASSIC, NAMEDAYS, PHOTOS, POETS, type Season } from "./data";

export type Poem = {
  key: string; // klasszikus: "c1", közösségi: uuid
  title: string;
  text: string;
  by: string;
  poetId?: string;
  authorId?: string;
  themes: string[];
  sz?: Season[];
  full?: boolean;
  createdAt?: string;
};

export type DbPoem = {
  id: string; author_id: string; author_name: string; title: string; body: string; themes: string[]; created_at: string;
};

export const poetById = (id: string) => POETS.find((p) => p.id === id);
export const CLASSIC_POEMS: Poem[] = CLASSIC.map((c) => ({
  key: c.id, title: c.title, text: c.text, by: poetById(c.poet)!.name, poetId: c.poet, themes: c.themes, sz: c.sz, full: !!c.full,
}));
export const fromDb = (p: DbPoem): Poem => ({
  key: p.id, title: p.title, text: p.body, by: p.author_name, authorId: p.author_id, themes: p.themes || [], createdAt: p.created_at,
});

export const seasonOf = (d: Date): Season => {
  const m = d.getMonth() + 1, n = d.getDate();
  if (m === 12 || m <= 2 || (m === 11 && n >= 20)) return "tel";
  if (m <= 5) return "tavasz";
  if (m <= 8) return "nyar";
  return "osz";
};
export const dayNum = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
/** Napi vers: minden dátumhoz determinisztikusan egy klasszikus, az évszakhoz illőt előnyben részesítve. */
export function pickForDay(d: Date): Poem {
  const n = dayNum(d), pool = CLASSIC_POEMS, sz = seasonOf(d), sea = pool.filter((p) => p.sz?.includes(sz));
  return n % 3 !== 2 && sea.length ? sea[n % sea.length] : pool[(n * 7) % pool.length];
}
export const dateAt = (o: number) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return d; };
export const fmt = (d: Date, o?: Intl.DateTimeFormatOptions) => d.toLocaleDateString("hu-HU", o || { month: "long", day: "numeric", weekday: "long" });
export const nameday = (d: Date) => NAMEDAYS[d.getMonth()][d.getDate() - 1] || "";

export function photoFor(sz: Season, d = new Date()) {
  const a = PHOTOS[sz]; return a[dayNum(d) % a.length];
}
export function bgPhotoFor(sz: Season) { const a = PHOTOS[sz]; return a.find((p) => p.bg) || a[0]; }

export function ago(iso: string) {
  const t = new Date(iso), s = (Date.now() - t.getTime()) / 1000;
  if (s < 60) return "most";
  if (s < 3600) return `${Math.floor(s / 60)} perce`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const hm = t.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });
  if (t >= today) return `ma ${hm}`;
  const y = new Date(today); y.setDate(y.getDate() - 1);
  if (t >= y) return `tegnap ${hm}`;
  const days = Math.floor((today.getTime() - t.getTime()) / 864e5) + 1;
  if (days < 7) return `${days} napja`;
  return t.toLocaleDateString("hu-HU", { month: "long", day: "numeric" });
}
export const timeHM = (iso: string) => new Date(iso).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });

export const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "versek";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export const asTxt = (name: string, ps: Poem[]) => name + "\n" + "=".repeat(name.length) + "\n\n" + ps.map((p) => `${p.title}\n${p.by}\n\n${p.text}\n`).join("\n* * *\n\n");
export const asHtml = (name: string, ps: Poem[]) => `<!doctype html><html lang="hu"><head><meta charset="utf-8"><title>${esc(name)}</title><style>body{font:18px/1.7 Georgia,serif;max-width:640px;margin:48px auto;padding:0 20px;color:#1b1416}h1{font-size:40px;margin:0 0 40px}h2{font-size:26px;margin:56px 0 4px;page-break-before:always}h2:first-of-type{page-break-before:auto}p.by{color:#6b5f62;margin:0 0 20px}pre{font:inherit;white-space:pre-wrap}</style></head><body><h1>${esc(name)}</h1>${ps.map((p) => `<h2>${esc(p.title)}</h2><p class="by">${esc(p.by)}</p><pre>${esc(p.text)}</pre>`).join("")}</body></html>`;
export function download(filename: string, data: string, type: string) {
  const blob = new Blob([data], { type: type + ";charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
