"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { Avatar, Loading, PoemCard } from "@/components/bits";
import { sb } from "@/lib/supabase";

type Pub = { id: string; nickname: string; avatar_url: string | null; city: string | null; bio: string | null; themes: string[]; created_at: string; age: number | null };

export default function Tag() {
  const { id } = useParams<{ id: string }>();
  const { community, session } = useApp();
  const [u, setU] = useState<Pub | null | undefined>(undefined);
  useEffect(() => { sb().from("public_profiles").select("*").eq("id", id).maybeSingle().then(({ data }) => setU((data as Pub) || null)); }, [id]);
  if (u === undefined) return <section className="wrap narrow"><Loading /></section>;
  if (!u) return <section className="wrap narrow"><h1>Nincs ilyen tag</h1></section>;
  const ps = community.filter((p) => p.authorId === id);
  return (
    <section className="wrap">
      <div className="phead"><Avatar name={u.nickname} url={u.avatar_url} cls="pav big" />
        <div><h1 style={{ margin: 0 }}>{u.nickname}</h1>
          <p className="lead" style={{ margin: "4px 0 0" }}>Tag {new Date(u.created_at).toLocaleDateString("hu-HU", { year: "numeric", month: "long" })} óta{u.age ? ` · ${u.age} éves` : ""}{u.city ? ` · ${u.city}` : ""}</p></div>
      </div>
      {u.bio && <p className="pbio">{u.bio}</p>}
      {!!u.themes?.length && <p className="muted">Kedvenc témái: {u.themes.join(", ")}</p>}
      {session && session.user.id !== id && <p><Link className="cta ghost" href={`/eloszoba?kivel=${id}`}>Privát üzenet</Link></p>}
      <h2 style={{ marginTop: 28 }}>Versei</h2>
      {ps.length ? <div className="grid">{ps.map((p) => <PoemCard key={p.key} p={p} />)}</div> : <p className="muted">Még nem töltött fel verset.</p>}
    </section>
  );
}
