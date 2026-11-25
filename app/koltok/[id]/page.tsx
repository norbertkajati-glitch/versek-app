"use client";
import { useParams, useRouter } from "next/navigation";
import { AddAll, PoemCard } from "@/components/bits";
import { CLASSIC_POEMS, poetById } from "@/lib/util";

export default function Kolto() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const p = poetById(id);
  if (!p) return <section className="wrap"><h1>Nincs ilyen költő</h1></section>;
  const ps = CLASSIC_POEMS.filter((c) => c.poetId === p.id);
  return (
    <section className="wrap">
      <button className="back" onClick={() => router.back()}>← Vissza</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div><h1>{p.name}</h1><p className="muted" style={{ margin: "6px 0 0" }}>{p.yrs} · {p.pl}</p></div>
        <AddAll keys={ps.map((c) => c.key)} />
      </div>
      <div className="bio"><p>{p.bio}</p></div>
      <div className="grid">{ps.map((c) => <PoemCard key={c.key} p={c} />)}</div>
      <div className="panel" style={{ marginTop: 28 }}>
        <h3>{p.name} összes verse</h3>
        <p style={{ margin: "8px 0 0" }}>Most {ps.length} vers olvasható, ebből {ps.filter((c) => c.full).length} teljes szöveggel. A teljes életmű folyamatosan kerül fel, ellenőrzött forrásból, kötetek és évek szerint. A szöveg közkincs, mert a költő több mint 70 éve hunyt el.</p>
      </div>
    </section>
  );
}
