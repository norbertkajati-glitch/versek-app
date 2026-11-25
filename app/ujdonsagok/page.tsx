"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp, type PublicName } from "@/components/AppProvider";
import { Loading, PoemCard, Quill } from "@/components/bits";
import { sb } from "@/lib/supabase";
import { ago } from "@/lib/util";

type Rx = { key: string; ink: number; com: number; quote?: { uid: string; body: string } };

export default function Ujdonsagok() {
  const { prevSeen, community, byKey, session, names, poemsLoaded } = useApp();
  const [rx, setRx] = useState<Rx[] | null>(null);
  const [nm, setNm] = useState<Record<string, PublicName>>({});
  const uid = session?.user.id;
  const since = prevSeen.toISOString();

  useEffect(() => {
    (async () => {
      const [{ data: ik }, { data: cm }] = await Promise.all([
        sb().from("inks").select("poem_key,created_at").gt("created_at", since).limit(5000),
        sb().from("comments").select("poem_key,user_id,body,created_at").gt("created_at", since).order("created_at", { ascending: false }).limit(2000),
      ]);
      const m: Record<string, Rx> = {};
      const get = (k: string) => (m[k] = m[k] || { key: k, ink: 0, com: 0 });
      (ik || []).forEach((r: { poem_key: string }) => { get(r.poem_key).ink++; });
      (cm || []).forEach((r: { poem_key: string; user_id: string; body: string }) => { const x = get(r.poem_key); x.com++; if (!x.quote) x.quote = { uid: r.user_id, body: r.body }; });
      const list = Object.values(m).sort((a, b) => b.ink - a.ink || b.com - a.com);
      setRx(list);
      setNm(await names(list.filter((x) => x.quote).map((x) => x.quote!.uid)));
    })();
  }, [since, names]);

  const nw = community.filter((p) => p.createdAt && p.createdAt > since && p.authorId !== uid);
  const tot = (rx || []).reduce((a, x) => a + x.ink, 0), com = (rx || []).reduce((a, x) => a + x.com, 0);
  const mineRx = (rx || []).filter((x) => byKey(x.key)?.authorId === uid && uid);
  const when = prevSeen.toLocaleString("hu-HU", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const row = (x: Rx) => { const p = byKey(x.key); if (!p) return null; return (
    <div key={x.key} className="rx">
      <div><Link href={`/vers/${p.key}`}>{p.title}</Link><span className="muted"> · {p.by}</span>
        {x.quote && <p className="qt">„{x.quote.body.length > 160 ? x.quote.body.slice(0, 160) + "…" : x.quote.body}”<span> {nm[x.quote.uid]?.nickname || ""}</span></p>}</div>
      <div className="rnum"><span className="inkc"><Quill /> +{x.ink}</span><span className="muted">{x.com} hozzászólás</span></div>
    </div>
  ); };

  return (
    <section className="wrap">
      <h1 style={{ marginBottom: 8 }}>Újdonságok</h1>
      <p className="muted" style={{ margin: "0 0 22px" }}>{session ? "Utoljára" : "Ebben a böngészőben utoljára"} {when}-kor jártál itt. Azóta {nw.length} új vers érkezett, {tot} tinta és {com} hozzászólás.</p>
      <div className="stats"><div><b>{nw.length}</b><span>új vers</span></div><div><b>{tot}</b><span>új tinta</span></div><div><b>{com}</b><span>hozzászólás</span></div></div>
      {mineRx.length > 0 && <><h2 style={{ marginTop: 30 }}>A te verseidre érkezett</h2><div className="rlist">{mineRx.map(row)}</div></>}
      <h2 style={{ marginTop: 30 }}>Új versek</h2>
      {!poemsLoaded ? <Loading /> : nw.length ? <div className="grid">{nw.map((p) => <PoemCard key={p.key} p={p} by={p.by + " · " + ago(p.createdAt!)} />)}</div> : <p className="muted">Azóta nem érkezett új vers. <Link href="/kozosseg">Nézz körül a Közösségben</Link>.</p>}
      <h2 style={{ marginTop: 36 }}>Reakciók</h2>
      {!rx ? <Loading /> : rx.length ? <div className="rlist">{rx.map(row)}</div> : <p className="muted">Azóta nem érkezett tinta vagy hozzászólás.</p>}
    </section>
  );
}
