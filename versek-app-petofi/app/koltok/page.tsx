"use client";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { POETS } from "@/lib/data";

export default function Koltok() {
  const { classics } = useApp();
  return (
    <section className="wrap"><h1 style={{ marginBottom: 20 }}>Költők</h1>
      <div className="grid">
        {POETS.map((p) => {
          const n = classics.filter((c) => c.poetId === p.id);
          return (
            <Link key={p.id} className="card" href={`/koltok/${p.id}`} style={{ textDecoration: "none" }}>
              <h3>{p.name}</h3><span className="yrs">{p.yrs} · {p.pl}</span><p className="bsn">{p.bio}</p>
              <div className="meta"><span>{n.length} vers</span></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
