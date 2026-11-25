"use client";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { PoemCard } from "@/components/bits";
import { THEMES } from "@/lib/data";

export default function Temak() {
  const { all } = useApp();
  return (
    <section className="wrap"><h1 style={{ marginBottom: 20 }}>Témák</h1>
      {THEMES.map((t) => {
        const ps = all.filter((p) => p.themes.includes(t));
        return (
          <div key={t} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <h2><Link href={`/temak/${encodeURIComponent(t)}`} style={{ color: "var(--ink)" }}>{t}</Link></h2><span className="muted">{ps.length} vers</span>
            </div>
            <div className="grid">{ps.slice(0, 3).map((p) => <PoemCard key={p.key} p={p} />)}</div>
          </div>
        );
      })}
    </section>
  );
}
