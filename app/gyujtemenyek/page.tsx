"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Gate } from "@/components/bits";
import { sb } from "@/lib/supabase";
import { asHtml, asTxt, download, slug, type Poem } from "@/lib/util";

export default function Gyujtemenyek() {
  const { session, collections, reloadCollections, byKey, openCollect } = useApp();
  const [sure, setSure] = useState<string | null>(null);
  if (!session) return <section className="wrap"><h1 style={{ marginBottom: 8 }}>Gyűjteményeim</h1><p className="muted" style={{ margin: "8px 0 20px" }}>Tedd egy gyűjteménybe a kedvenc verseidet, és töltsd le egyben.</p><Gate what="A gyűjteményekhez fiók kell." /></section>;
  const rm = async (cid: string, k: string) => { await sb().from("collection_items").delete().eq("collection_id", cid).eq("poem_key", k); reloadCollections(); };
  const del = async (cid: string) => { if (sure !== cid) { setSure(cid); return; } await sb().from("collections").delete().eq("id", cid); setSure(null); reloadCollections(); };
  return (
    <section className="wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
        <div><h1>Gyűjteményeim</h1><p className="muted" style={{ margin: "8px 0 0" }}>Tedd egy gyűjteménybe a kedvenc verseidet, és töltsd le egyben.</p></div>
        <button className="cta" onClick={() => openCollect([])}>Új gyűjtemény</button>
      </div>
      {collections.map((c) => {
        const ps = c.keys.map(byKey).filter(Boolean) as Poem[];
        return (
          <div key={c.id} className="coll">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>{c.name} <span className="muted" style={{ font: "400 16px Jost" }}>{ps.length} vers</span></h2>
              <span className="acts">
                <button className="mini" disabled={!ps.length} onClick={() => download(slug(c.name) + ".txt", asTxt(c.name, ps), "text/plain")}>Letöltés .txt</button>
                <button className="mini" disabled={!ps.length} onClick={() => download(slug(c.name) + ".html", asHtml(c.name, ps), "text/html")}>Letöltés füzetként (.html)</button>
                <button className="mini" onClick={() => del(c.id)}>{sure === c.id ? "Biztosan törlöd?" : "Törlés"}</button>
              </span>
            </div>
            {ps.map((p) => (
              <div key={p.key} className="crow"><span><Link href={`/vers/${p.key}`}>{p.title}</Link> <span className="muted">· {p.by}</span></span><button className="mini" aria-label="Eltávolítás" onClick={() => rm(c.id, p.key)}>×</button></div>
            ))}
            {!ps.length && <p className="muted">Üres. A versek mellett a „+ Gyűjtemény” gombbal adhatsz hozzá, vagy egy költő, téma oldalán egyszerre az összeset.</p>}
          </div>
        );
      })}
      {!collections.length && <p className="muted" style={{ paddingTop: 20 }}>Még nincs gyűjteményed. A versek mellett a „+ Gyűjtemény” gombbal kezdhetsz egyet.</p>}
    </section>
  );
}
