"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { ColButton, InkButton, Quill } from "@/components/bits";
import BookOfDay from "@/components/BookOfDay";
import { POETS, SEASONS, THEMES, type Season } from "@/lib/data";
import { dateAt, nameday, photoFor, seasonOf } from "@/lib/util";

function TodayStrip() {
  const d = dateAt(0), t = dateAt(1), n = nameday(d), first = n.split(",")[0];
  return (
    <>
      <div className="today">
        <span className="tdate">{d.toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</span>
        <span className="tnd"><span className="flw" aria-hidden="true">✿</span> Névnap: <b>{n}</b></span>
        <span className="tnext">Holnap: {nameday(t)}</span>
      </div>
      {first && first !== "Szökőnap" && <p className="greet">Ma {first} napja van. Boldog névnapot!</p>}
    </>
  );
}

export default function Home() {
  const router = useRouter();
  const { season, seasonPref, setSeasonPref, all, collections, session, community, inks, poemsLoaded } = useApp();
  const auto = seasonOf(new Date());
  const ph = photoFor(season);
  const ranked = [...community].sort((a, b) => ((inks[b.key]?.week || 0) - (inks[a.key]?.week || 0)) || ((inks[b.key]?.total || 0) - (inks[a.key]?.total || 0)));
  const top = ranked[0];
  const open = (k: string) => router.push(`/vers/${k}`);
  return (
    <>
      <div className="hero">
        <div className="scene">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ph-img" src={ph.f} alt={ph.alt} /><div className="veil" />
          <div className="wrap">
            <TodayStrip />
            <h1>Versek, költők és olvasók egy helyen</h1>
            <p className="lead">Minden napra egy versajánló, gyűjtemények, közösség és közös felolvasások.</p>
            <div className="seas" role="group" aria-label="Évszakos megjelenés">
              <span>Megjelenés:</span>
              <button className={seasonPref === "auto" ? "on" : ""} onClick={() => setSeasonPref("auto")}>Automatikus ({SEASONS[auto].toLowerCase()})</button>
              {(Object.entries(SEASONS) as [Season, string][]).map(([k, v]) => <button key={k} className={seasonPref === k ? "on" : ""} onClick={() => setSeasonPref(k)}>{v}</button>)}
            </div>
          </div>
        </div>
        <div className="wrap">
          <div className="hgrid">
            <BookOfDay />
            <div className="side">
              <div className="panel"><h3 style={{ marginBottom: 12 }}>Témák</h3><div className="chips">{THEMES.map((t) => <Link key={t} className="chip" href={`/temak/${encodeURIComponent(t)}`}>{t} <b>{all.filter((p) => p.themes.includes(t)).length}</b></Link>)}</div></div>
              <div className="panel"><h3 style={{ marginBottom: 4 }}>Gyűjteményeim</h3>
                <ul className="plist">
                  {collections.slice(0, 3).map((c) => <li key={c.id}><Link href="/gyujtemenyek"><span>{c.name}</span><span className="yrs">{c.keys.length} vers</span></Link></li>)}
                  {!collections.length && <li className="muted" style={{ padding: "10px 0" }}>{session ? "Még nincs gyűjteményed." : <><Link href="/regisztracio" style={{ display: "inline", padding: 0 }}>Regisztrálj</Link>, és gyűjtsd össze a kedvenceidet.</>}</li>}
                </ul>
              </div>
              <div className="panel"><h3 style={{ marginBottom: 4 }}>Költők</h3>
                <ul className="plist">{POETS.slice(0, 4).map((p) => <li key={p.id}><Link href={`/koltok/${p.id}`}><span>{p.name}</span><span className="yrs">{p.yrs}</span></Link></li>)}</ul>
                <Link href="/koltok" style={{ color: "var(--red)", fontWeight: 600, fontSize: 15 }}>Mind a {POETS.length} költő</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <section className="wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h2>A legtöbb tintát kapott versek</h2><Link href="/kozosseg" style={{ color: "var(--red)" }}>Összes közösségi vers</Link>
        </div>
        {!poemsLoaded ? <p className="loading">Betöltés…</p> : !top ? (
          <p className="muted">Még nincs közösségi vers. <Link href="/feltoltes">Töltsd fel az elsőt!</Link></p>
        ) : (
          <div className="top">
            <div className="card feat" role="button" tabIndex={0} onClick={() => open(top.key)} onKeyDown={(e) => e.key === "Enter" && open(top.key)}>
              <div className="kicker"><Quill /> A hét verse</div><h2>{top.title}</h2><div className="verse">{top.text}</div>
              <div className="meta"><span>{top.by}</span><span className="acts"><InkButton k={top.key} /><ColButton k={top.key} /></span></div>
            </div>
            <ol className="rank">
              {ranked.slice(1, 6).map((p, i) => (
                <li key={p.key} role="button" tabIndex={0} onClick={() => open(p.key)} onKeyDown={(e) => e.key === "Enter" && open(p.key)}>
                  <span className="rn">{["II", "III", "IV", "V", "VI"][i]}.</span>
                  <span><b>{p.title}</b><i>{p.text.split("\n")[0]}</i><small>{p.by}</small></span>
                  <span className="rv"><InkButton k={p.key} /></span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </>
  );
}
