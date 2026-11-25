"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp, type PublicName } from "@/components/AppProvider";
import { Avatar, ColButton, InkButton, Loading } from "@/components/bits";
import { sb } from "@/lib/supabase";
import { ago, asTxt, download, slug } from "@/lib/util";

type Cmt = { id: string; user_id: string; body: string; created_at: string };

export default function Vers() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { byKey, poemsLoaded, session, names, reloadPoems } = useApp();
  const p = byKey(id);
  const [cs, setCs] = useState<Cmt[]>([]);
  const [nm, setNm] = useState<Record<string, PublicName>>({});
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [sure, setSure] = useState(false);
  const uid = session?.user.id;

  const load = useCallback(async () => {
    const { data } = await sb().from("comments").select("id,user_id,body,created_at").eq("poem_key", id).order("created_at");
    const list = (data as Cmt[]) || [];
    setCs(list);
    setNm(await names(list.map((c) => c.user_id)));
  }, [id, names]);
  useEffect(() => { load(); }, [load]);

  if (!p) return <section className="wrap">{poemsLoaded ? <><h1>Nem található a vers</h1><p className="muted">Lehet, hogy a szerzője törölte. <Link href="/">Vissza a kezdőlapra</Link></p></> : <Loading />}</section>;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const x = text.trim(); if (!x) return;
    const { error } = await sb().from("comments").insert({ poem_key: id, body: x });
    if (error) { setMsg("Nem sikerült elküldeni. Próbáld újra."); return; }
    setText(""); setMsg(""); load();
  }
  async function delComment(cid: string) { await sb().from("comments").delete().eq("id", cid); load(); }
  async function report(kind: "poem" | "comment", tid: string) {
    if (!uid) { router.push("/regisztracio"); return; }
    await sb().from("reports").insert({ target_kind: kind, target_id: tid });
    setMsg("Köszönjük, a jelentést a moderátorok átnézik.");
  }
  async function delPoem() {
    if (!sure) { setSure(true); return; }
    await sb().from("poems").delete().eq("id", id);
    await reloadPoems(); router.push("/kozosseg");
  }
  const mine = p.authorId && p.authorId === uid;

  return (
    <section className="wrap"><div className="reader">
      <button className="back" onClick={() => router.back()}>← Vissza</button>
      <article className="book">
        <div className="kicker">{p.themes.join(" · ")}</div>
        <h1>{p.title}</h1>
        {p.poetId && !p.full && <p className="part">Részlet. A teljes szöveg ellenőrzött forrásból hamarosan felkerül.</p>}
        <div className="verse">{p.text}</div>
        <div className="byline">
          {p.poetId ? <Link href={`/koltok/${p.poetId}`}>{p.by}</Link> : p.authorId ? <Link href={`/tag/${p.authorId}`}>{p.by}</Link> : <span>{p.by}</span>}
          <span className="acts">
            <InkButton k={p.key} /><ColButton k={p.key} />
            <button className="mini" title="Letöltés szövegként" onClick={() => download(slug(p.title) + ".txt", asTxt(p.title, [p]), "text/plain")}>Letöltés</button>
            {p.authorId && !mine && <button className="mini" onClick={() => report("poem", p.key)}>Jelentés</button>}
            {mine && <button className="mini danger" onClick={delPoem}>{sure ? "Biztosan törlöd?" : "Törlés"}</button>}
          </span>
        </div>
        <div className="toast" role="status">{msg}</div>
      </article>
      <div className="comments">
        <h2>Hozzászólások <span className="muted" style={{ fontSize: 22 }}>{cs.length}</span></h2>
        {cs.map((c) => (
          <div key={c.id} className="cmt">
            <Avatar name={nm[c.user_id]?.nickname} url={nm[c.user_id]?.avatar_url} cls="av" />
            <div>
              <div className="cn"><Link href={`/tag/${c.user_id}`} style={{ color: "inherit", textDecoration: "none" }}>{nm[c.user_id]?.nickname || "…"}</Link> <span className="muted">· {ago(c.created_at)}</span>
                {c.user_id === uid ? <button className="linkbtn" onClick={() => delComment(c.id)}>törlés</button> : uid && <button className="linkbtn" onClick={() => report("comment", c.id)}>jelentés</button>}
              </div>
              <p style={{ whiteSpace: "pre-line" }}>{c.body}</p>
            </div>
          </div>
        ))}
        {!cs.length && <p className="muted">Még nincs hozzászólás. Légy te az első.</p>}
        {session ? (
          <form id="cform" onSubmit={send}>
            <label htmlFor="c-text" style={{ fontWeight: 500 }}>Írd le, mit adott neked ez a vers</label>
            <textarea id="c-text" required maxLength={600} style={{ minHeight: 110 }} placeholder="Pár szó is elég…" value={text} onChange={(e) => setText(e.target.value)} />
            <div><button className="cta" type="submit">Hozzászólás</button></div>
          </form>
        ) : <p className="muted"><Link href="/regisztracio">Regisztrálj</Link> vagy <Link href="/belepes">lépj be</Link>, hogy hozzászólhass.</p>}
      </div>
    </div></section>
  );
}
