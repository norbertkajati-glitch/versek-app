"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { AddAll, PoemCard } from "@/components/bits";
import { THEMES } from "@/lib/data";

export default function Tema() {
  const { t: raw } = useParams<{ t: string }>();
  const t = decodeURIComponent(raw);
  const router = useRouter();
  const { all } = useApp();
  const ps = all.filter((p) => p.themes.includes(t));
  return (
    <section className="wrap">
      <button className="back" onClick={() => router.back()}>← Vissza</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 16 }}><h1>{t}</h1><AddAll keys={ps.map((p) => p.key)} /></div>
      <div className="chips" style={{ marginBottom: 20 }}>{THEMES.map((x) => <Link key={x} className={"chip" + (x === t ? " on" : "")} href={`/temak/${encodeURIComponent(x)}`}>{x}</Link>)}</div>
      <div className="grid">{ps.map((p) => <PoemCard key={p.key} p={p} />)}</div>
      {!ps.length && <p className="muted">Ebben a témában még nincs vers.</p>}
    </section>
  );
}
