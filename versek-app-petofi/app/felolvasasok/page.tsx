"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { Loading } from "@/components/bits";
import { sb } from "@/lib/supabase";

type Ev = { id: string; starts_at: string; title: string; details: string; event_signups: { user_id: string }[] };

export default function Felolvasasok() {
  const { session } = useApp();
  const router = useRouter();
  const [evs, setEvs] = useState<Ev[] | null>(null);
  const uid = session?.user.id;
  const load = useCallback(async () => {
    const { data } = await sb().from("events").select("id,starts_at,title,details,event_signups(user_id)").gte("starts_at", new Date(Date.now() - 864e5).toISOString()).order("starts_at");
    setEvs((data as Ev[]) || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function toggle(e: Ev) {
    if (!uid) { router.push("/regisztracio"); return; }
    const going = e.event_signups.some((s) => s.user_id === uid);
    if (going) await sb().from("event_signups").delete().eq("event_id", e.id).eq("user_id", uid);
    else await sb().from("event_signups").insert({ event_id: e.id });
    load();
  }
  return (
    <section className="wrap">
      <h1 style={{ marginBottom: 8 }}>Közös felolvasások</h1>
      <p className="muted" style={{ margin: "0 0 16px" }}>Online és személyes estek, ahol a közösség tagjai felolvassák a saját és kedvenc verseiket. Jelentkezz felolvasónak!</p>
      {!evs ? <Loading /> : !evs.length ? <p className="muted">Most nincs meghirdetett felolvasás.</p> : evs.map((e) => {
        const d = new Date(e.starts_at), going = !!uid && e.event_signups.some((s) => s.user_id === uid);
        return (
          <div key={e.id} className="ev">
            <div className="date">{String(d.getDate()).padStart(2, "0")}<small>{d.toLocaleDateString("hu-HU", { month: "short", weekday: "long" })}</small></div>
            <div><h3>{e.title}</h3><div className="muted" style={{ fontSize: 15, marginTop: 4 }}>{d.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })} · {e.details} · {e.event_signups.length} jelentkező</div></div>
            <button className={"cta" + (going ? "" : " ghost")} onClick={() => toggle(e)}>{going ? "Jelentkeztél ✓" : "Jelentkezem felolvasónak"}</button>
          </div>
        );
      })}
    </section>
  );
}
