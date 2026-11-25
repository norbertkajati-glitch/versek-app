"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Gate } from "@/components/bits";
import { sb } from "@/lib/supabase";
import { THEMES } from "@/lib/data";

export default function Feltoltes() {
  const { session, profile, reloadPoems } = useApp();
  const [title, setTitle] = useState(""), [author, setAuthor] = useState(""), [text, setText] = useState("");
  const [themes, setThemes] = useState<string[]>([]), [own, setOwn] = useState(false);
  const [err, setErr] = useState(""), [done, setDone] = useState<string | null>(null), [busy, setBusy] = useState(false);
  useEffect(() => { if (profile && !author) setAuthor(profile.nickname); }, [profile, author]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !text.trim()) { setErr("A cím, a szerző és a vers szövege kötelező."); return; }
    if (!own) { setErr("Erősítsd meg, hogy a verset te írtad, vagy közkincs."); return; }
    setBusy(true); setErr("");
    const { data, error } = await sb().from("poems").insert({ title: title.trim(), author_name: author.trim(), body: text.replace(/\s+$/, ""), themes }).select("id").single();
    setBusy(false);
    if (error || !data) { setErr("Nem sikerült a feltöltés. Próbáld újra."); return; }
    await reloadPoems();
    setDone(data.id); setTitle(""); setText(""); setThemes([]); setOwn(false);
  }

  return (
    <section className="wrap">
      <h1 style={{ marginBottom: 8 }}>Vers feltöltése</h1>
      <p className="muted" style={{ margin: "0 0 20px" }}>A feltöltött vers a Közösség oldalra kerül, ahol mások olvashatják, tintát adhatnak rá és hozzászólhatnak.</p>
      {!session ? <Gate what="Vers feltöltéséhez fiók kell." /> : (
        <form id="up" onSubmit={submit}>
          <label>Cím<input type="text" required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label>Szerző neve<input type="text" required maxLength={40} placeholder="Ahogy megjelenjen" value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
          <label>A vers<textarea required maxLength={8000} placeholder="Ide írd a versed. A sortörések megmaradnak." value={text} onChange={(e) => setText(e.target.value)} /></label>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600, marginBottom: 8 }}>Témák</legend>
            <div className="chips">{THEMES.map((t) => { const on = themes.includes(t); return <button key={t} type="button" className={"chip" + (on ? " on" : "")} aria-pressed={on} onClick={() => setThemes(on ? themes.filter((x) => x !== t) : [...themes, t])}>{t}</button>; })}</div>
          </fieldset>
          <label className="check"><input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} /> Kijelentem, hogy a verset én írtam, vagy közkincs.</label>
          {err && <div className="err" role="alert">{err}</div>}
          <div><button className="cta" type="submit" disabled={busy}>{busy ? "Feltöltés…" : "Közzététel"}</button></div>
          {done && <div className="ok">Megjelent a Közösség oldalon. <Link href={`/vers/${done}`} style={{ color: "var(--ink)", fontWeight: 600 }}>Megnézem</Link></div>}
        </form>
      )}
    </section>
  );
}
