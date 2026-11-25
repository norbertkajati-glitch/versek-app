"use client";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, type PublicName } from "@/components/AppProvider";
import { Avatar, Gate, Loading } from "@/components/bits";
import { sb } from "@/lib/supabase";
import { ago, timeHM } from "@/lib/util";

type Msg = { id: string; sender_id: string; recipient_id: string | null; body: string; created_at: string };

function ChatInner() {
  const { session, profile, names } = useApp();
  const router = useRouter();
  const who = useSearchParams().get("kivel") || "";
  const uid = session?.user.id;
  const [lobby, setLobby] = useState<Msg[] | null>(null);
  const [dms, setDms] = useState<Msg[]>([]);
  const [nm, setNm] = useState<Record<string, PublicName>>({});
  const [online, setOnline] = useState<Record<string, string>>({});
  const [people, setPeople] = useState<PublicName[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);

  const addNames = useCallback(async (ids: string[]) => { const r = await names(ids); setNm((o) => ({ ...o, ...r })); }, [names]);

  // betöltés
  useEffect(() => {
    sb().from("messages").select("*").is("recipient_id", null).order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => { const l = ((data as Msg[]) || []).reverse(); setLobby(l); addNames(l.map((m) => m.sender_id)); });
  }, [addNames]);
  useEffect(() => {
    if (!uid) { setDms([]); return; }
    sb().from("messages").select("*").not("recipient_id", "is", null).or(`sender_id.eq.${uid},recipient_id.eq.${uid}`).order("created_at", { ascending: false }).limit(1000)
      .then(({ data }) => { const l = ((data as Msg[]) || []).reverse(); setDms(l); addNames(l.flatMap((m) => [m.sender_id, m.recipient_id!])); });
    sb().from("public_profiles").select("id,nickname,avatar_url").order("nickname").limit(500).then(({ data }) => setPeople(((data as PublicName[]) || []).filter((p) => p.id !== uid)));
  }, [uid, addNames]);
  useEffect(() => { if (who) addNames([who]); }, [who, addNames]);

  // élő üzenetek
  useEffect(() => {
    const ch = sb().channel("uzenetek").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (pl) => {
      const m = pl.new as Msg;
      addNames([m.sender_id]);
      if (m.recipient_id === null) setLobby((l) => (l && !l.some((x) => x.id === m.id) ? [...l, m] : l));
      else setDms((l) => (l.some((x) => x.id === m.id) ? l : [...l, m]));
    }).subscribe();
    return () => { sb().removeChannel(ch); };
  }, [addNames]);

  // jelenlét: ki van most az oldalon
  useEffect(() => {
    if (!uid || !profile) return;
    const ch = sb().channel("jelenlet", { config: { presence: { key: uid } } });
    ch.on("presence", { event: "sync" }, () => {
      const st = ch.presenceState<{ nickname: string }>(); const o: Record<string, string> = {};
      Object.entries(st).forEach(([k, v]) => { o[k] = v[0]?.nickname || ""; });
      setOnline(o);
    }).subscribe((s) => { if (s === "SUBSCRIBED") ch.track({ nickname: profile.nickname }); });
    return () => { sb().removeChannel(ch); };
  }, [uid, profile]);

  const other = (m: Msg) => (m.sender_id === uid ? m.recipient_id! : m.sender_id);
  const convs = useMemo(() => {
    const last: Record<string, Msg> = {};
    dms.forEach((m) => { last[other(m)] = m; });
    return Object.entries(last).sort((a, b) => b[1].created_at.localeCompare(a[1].created_at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dms, uid]);
  const msgs = who ? dms.filter((m) => other(m) === who) : lobby || [];

  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs.length, who]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const x = text.trim(); if (!x || !uid) return;
    setText(""); setErr("");
    const { data, error } = await sb().from("messages").insert({ body: x, recipient_id: who || null }).select("*").single();
    if (error || !data) { setErr("Nem sikerült elküldeni."); setText(x); return; }
    const m = data as Msg;
    if (m.recipient_id) setDms((l) => (l.some((y) => y.id === m.id) ? l : [...l, m]));
    else setLobby((l) => (l && !l.some((y) => y.id === m.id) ? [...l, m] : l));
  }

  const onlineIds = Object.keys(online);
  const others = onlineIds.filter((i) => i !== uid).map((i) => online[i]).filter(Boolean);
  const nameOf = (id: string) => nm[id]?.nickname || online[id] || "…";

  return (
    <section className="wrap">
      <h1 style={{ marginBottom: 6 }}>Előszoba</h1>
      <p className="muted" style={{ margin: "0 0 22px" }}>Közös beszélgetés minden olvasónak, és privát üzenetek egymásnak.</p>
      <div className={"chat" + (who ? " indm" : "")}>
        <aside className="panel clist">
          <Link className={"conv" + (!who ? " on" : "")} href="/eloszoba"><span className="av lob">✿</span><span><b>Előszoba</b><small>{uid ? `${Math.max(onlineIds.length, 1)} olvasó van itt most` : "Közös beszélgetés"}</small></span></Link>
          {uid && <>
            <h3>Privát beszélgetések</h3>
            {convs.map(([id, m]) => (
              <Link key={id} className={"conv" + (who === id ? " on" : "")} href={`/eloszoba?kivel=${id}`}>
                <span className="av">{(nameOf(id))[0]}{online[id] && <i className="dot" />}</span>
                <span><b>{nameOf(id)}</b><small>{(m.sender_id === uid ? "Te: " : "") + m.body}</small></span>
              </Link>
            ))}
            {!convs.length && <p className="muted" style={{ fontSize: 14, margin: "4px 6px" }}>Még nincs privát beszélgetésed.</p>}
            <label htmlFor="newdm" className="muted" style={{ display: "block", marginTop: 14, fontSize: 14 }}>Új beszélgetés</label>
            <select id="newdm" value="" onChange={(e) => e.target.value && router.push(`/eloszoba?kivel=${e.target.value}`)}>
              <option value="">Válassz olvasót…</option>
              {people.filter((p) => !convs.some(([id]) => id === p.id)).map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}
            </select>
          </>}
        </aside>
        <div className="panel cmain">
          <div className="chead">
            {!who ? <><b>Előszoba</b><span className="muted">{uid ? (others.length ? `Itt vannak most: ${others.join(", ")} és te` : "Most csak te vagy itt") : "Olvasni fiók nélkül is lehet"}</span></>
              : <><button className="back" style={{ margin: 0 }} onClick={() => router.push("/eloszoba")}>←</button><b><Link href={`/tag/${who}`} style={{ color: "inherit", textDecoration: "none" }}>{nameOf(who)}</Link></b><span className="muted">{online[who] ? "elérhető" : "nem elérhető"}</span></>}
          </div>
          <div className="msgs" ref={box}>
            {lobby === null && !who ? <Loading /> : msgs.map((m) => {
              const me = m.sender_id === uid;
              return (
                <div key={m.id} className={"msg" + (me ? " me" : "")}>
                  {!me && <Avatar name={nameOf(m.sender_id)} url={nm[m.sender_id]?.avatar_url} cls="av" />}
                  <div className="bub">{!me && !who && <div className="cn">{nameOf(m.sender_id)}</div>}<p>{m.body}</p><time title={new Date(m.created_at).toLocaleString("hu-HU")}>{Date.now() - +new Date(m.created_at) < 864e5 ? timeHM(m.created_at) : ago(m.created_at)}</time></div>
                </div>
              );
            })}
            {(lobby !== null || who) && !msgs.length && <p className="muted">{who ? "Írj elsőként!" : "Még csend van. Köszönj be!"}</p>}
          </div>
          {!uid ? <div style={{ padding: "14px 22px 0" }}><Gate what="Az íráshoz fiók kell, olvasni anélkül is lehet." /></div> : (
            <form id="chatform" onSubmit={send}>
              <label className="sr" htmlFor="chat-in">Üzenet</label>
              <input id="chat-in" type="text" maxLength={500} autoComplete="off" placeholder={who ? "Üzenet neki: " + nameOf(who) : "Írj az Előszobába…"} value={text} onChange={(e) => setText(e.target.value)} />
              <button className="cta" type="submit">Küldés</button>
            </form>
          )}
          {err && <p className="err demo">{err}</p>}
          <p className="muted demo">A beszélgetésekre a <Link href="/szabalyzat">felhasználói szabályzat</Link> vonatkozik. A privát üzeneteket csak ti ketten látjátok.</p>
        </div>
      </div>
    </section>
  );
}

export default function Eloszoba() { return <Suspense fallback={<Loading />}><ChatInner /></Suspense>; }
