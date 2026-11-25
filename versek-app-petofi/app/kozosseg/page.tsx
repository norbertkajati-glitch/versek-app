"use client";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { Loading, PoemCard } from "@/components/bits";
import { ago } from "@/lib/util";

export default function Kozosseg() {
  const { community, inks, poemsLoaded } = useApp();
  const ps = [...community].sort((a, b) => (inks[b.key]?.total || 0) - (inks[a.key]?.total || 0) || (b.createdAt || "").localeCompare(a.createdAt || ""));
  return (
    <section className="wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div><h1>Közösség</h1><p className="muted" style={{ margin: "8px 0 0" }}>Bárki feltöltheti a verseit. Adj tintát annak, ami megérintett: a legtöbb tintát kapott versek a kezdőlap elejére kerülnek.</p></div>
        <Link className="cta" href="/feltoltes">Vers feltöltése</Link>
      </div>
      {!poemsLoaded ? <Loading /> : ps.length ? <div className="grid">{ps.map((p) => <PoemCard key={p.key} p={p} by={p.by + " · " + ago(p.createdAt!)} />)}</div> : <p className="muted">Még nincs közösségi vers. Légy te az első!</p>}
    </section>
  );
}
