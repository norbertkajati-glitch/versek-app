"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { AddAll, Loading, PoemCard } from "@/components/bits";
import { CLASSIC_POEMS, poetById, type Poem } from "@/lib/util";

const norm = (s: string) => s.toLocaleLowerCase("hu-HU").normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function Kolto() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { classics, classicsLoaded, inks } = useApp();
  const [q, setQ] = useState("");
  const p = poetById(id);
  const ps = useMemo(() => classics.filter((c) => c.poetId === id), [classics, id]);
  const featured = useMemo(() => {
    const proto = new Set(CLASSIC_POEMS.filter((c) => c.poetId === id).map((c) => c.title));
    const top = [...ps].sort((a, b) => (inks[b.key]?.total || 0) - (inks[a.key]?.total || 0)).filter((c) => inks[c.key]?.total);
    const rest = ps.filter((c) => proto.has(c.title) && !top.includes(c));
    return [...top, ...rest].slice(0, 6);
  }, [ps, inks, id]);
  const groups = useMemo(() => {
    const n = norm(q.trim());
    const g: [string, Poem[]][] = [];
    ps.filter((c) => !n || norm(c.title).includes(n) || norm(c.text).includes(n)).forEach((c) => {
      const s = c.section || "Versek";
      if (!g.length || g[g.length - 1][0] !== s) g.push([s, []]);
      g[g.length - 1][1].push(c);
    });
    return g;
  }, [ps, q]);
  if (!p) return <section className="wrap"><h1>Nincs ilyen költő</h1></section>;
  const found = groups.reduce((a, [, l]) => a + l.length, 0);
  return (
    <section className="wrap">
      <button className="back" onClick={() => router.back()}>← Vissza</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div><h1>{p.name}</h1><p className="muted" style={{ margin: "6px 0 0" }}>{p.yrs} · {p.pl}</p></div>
        <AddAll keys={ps.map((c) => c.key)} />
      </div>
      <div className="bio"><p>{p.bio}</p></div>
      {!classicsLoaded ? <Loading /> : <>
        {featured.length > 0 && <><h2 style={{ margin: "8px 0 14px" }}>Kedvelt versek</h2><div className="grid">{featured.map((c) => <PoemCard key={c.key} p={c} />)}</div></>}
        <h2 style={{ margin: "32px 0 6px" }}>Összes vers</h2>
        <p className="muted" style={{ margin: "0 0 14px" }}>{ps.length} vers{ps[0]?.source ? `, forrás: ${ps[0].source}` : ""}. A szöveg közkincs, mert a költő több mint 70 éve hunyt el.</p>
        <label className="sr" htmlFor="vk">Keresés a versek között</label>
        <input id="vk" type="text" placeholder="Keresés cím vagy sor alapján…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 420, marginBottom: 8 }} />
        {q && <p className="muted" style={{ margin: "4px 0 0" }}>{found} találat</p>}
        {groups.map(([s, l]) => (
          <div key={s} className="toc">
            <h3>{s}</h3>
            <ol>{l.map((c) => <li key={c.key}><Link href={`/vers/${c.key}`}>{c.title}</Link>{c.written && <small>{c.written}</small>}</li>)}</ol>
          </div>
        ))}
        {!found && <p className="muted">Nincs találat.</p>}
      </>}
    </section>
  );
}
