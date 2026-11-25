"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "./AppProvider";
import { ColButton, InkButton, useFullPoem } from "./bits";
import { dateAt, fmt, pickForDay } from "@/lib/util";

export default function BookOfDay({ initial = 0 }: { initial?: number }) {
  const [off, setOff] = useState(initial);
  const { classics } = useApp();
  const d = dateAt(off), p = pickForDay(d, classics);
  const full = useFullPoem(p);
  return (
    <article className="book">
      <div className="dnav">
        <button onClick={() => setOff(off - 1)} aria-label="Előző nap">‹</button>
        <div className="dlabel">{off === 0 ? "Mai ajánló" : "Ajánló"} · {fmt(d)}</div>
        <button onClick={() => setOff(off + 1)} aria-label="Következő nap">›</button>
      </div>
      <h2><Link href={`/vers/${p.key}`} style={{ color: "inherit", textDecoration: "none" }}>{p.title}</Link></h2>
      <div className="verse">{full ? full.text : p.text}</div>
      <div className="byline">
        {p.poetId ? <Link href={`/koltok/${p.poetId}`}>{p.by}</Link> : <span>{p.by}</span>}
        <span className="acts"><InkButton k={p.key} /><ColButton k={p.key} /><Link className="mini" href="/napi" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Naptár</Link></span>
      </div>
    </article>
  );
}
