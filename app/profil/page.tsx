"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Loading } from "@/components/bits";
import { sb } from "@/lib/supabase";
import { THEMES } from "@/lib/data";

async function squareJpeg(file: File, size = 256): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const im = new Image();
  await new Promise((ok, bad) => { im.onload = ok; im.onerror = bad; im.src = url; });
  const c = document.createElement("canvas"), m = Math.min(im.width, im.height);
  c.width = c.height = size;
  c.getContext("2d")!.drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, size, size);
  URL.revokeObjectURL(url);
  return new Promise((ok) => c.toBlob((b) => ok(b!), "image/jpeg", 0.85));
}

function ProfilInner() {
  const { ready, session, profile, refreshProfile, signOut } = useApp();
  const router = useRouter();
  const q = useSearchParams();
  const [f, setF] = useState({ nickname: "", age: "", city: "", bio: "", show_age: false, newsletter: false, themes: [] as string[] });
  const [err, setErr] = useState(""), [ok, setOk] = useState(""), [busy, setBusy] = useState(false);
  const [pw, setPw] = useState(""), [pwMsg, setPwMsg] = useState("");
  const [delSure, setDelSure] = useState(false);

  useEffect(() => { if (ready && !session) router.replace("/belepes"); }, [ready, session, router]);
  useEffect(() => {
    if (profile) setF({ nickname: profile.nickname, age: profile.age ? String(profile.age) : "", city: profile.city || "", bio: profile.bio || "", show_age: profile.show_age, newsletter: profile.newsletter, themes: profile.themes || [] });
  }, [profile]);

  if (!session || !profile) return <section className="wrap narrow"><Loading /></section>;
  const u = profile, uid = session.user.id;
  const since = new Date(u.created_at).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" });

  async function save(e: React.FormEvent) {
    e.preventDefault(); setOk("");
    const n = f.nickname.trim(), age = f.age.trim();
    const bad = n.length < 2 ? "A becenév legalább 2 karakter legyen." : age && (+age < 16 || +age > 120 || !/^\d+$/.test(age)) ? "Az életkor 16 és 120 között lehet, vagy hagyd üresen." : "";
    if (bad) { setErr(bad); return; }
    if (n.toLowerCase() !== u.nickname.toLowerCase()) {
      const { data: free } = await sb().rpc("nickname_available", { n });
      if (free === false) { setErr("Ez a becenév már foglalt."); return; }
    }
    setBusy(true); setErr("");
    const { error } = await sb().from("profiles").update({ nickname: n, age: age ? +age : null, city: f.city.trim() || null, bio: f.bio.trim() || null, show_age: f.show_age, newsletter: f.newsletter, themes: f.themes }).eq("id", uid);
    setBusy(false);
    if (error) { setErr("Nem sikerült menteni."); return; }
    await refreshProfile(); setOk("Elmentve.");
  }
  async function pic(file?: File) {
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const blob = await squareJpeg(file);
      const path = `${uid}/avatar.jpg`;
      const { error } = await sb().storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = sb().storage.from("avatars").getPublicUrl(path);
      await sb().from("profiles").update({ avatar_url: data.publicUrl + "?v=" + Date.now() }).eq("id", uid);
      await refreshProfile();
    } catch { setErr("A kép feltöltése nem sikerült. Próbálj egy másik képet."); }
    setBusy(false);
  }
  async function nopic() {
    await sb().storage.from("avatars").remove([`${uid}/avatar.jpg`]);
    await sb().from("profiles").update({ avatar_url: null }).eq("id", uid);
    refreshProfile();
  }
  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setPwMsg("Legalább 8 karakter legyen."); return; }
    const { error } = await sb().auth.updateUser({ password: pw });
    setPwMsg(error ? "Nem sikerült megváltoztatni." : "Az új jelszó beállítva."); if (!error) setPw("");
  }
  async function deleteAccount() {
    if (!delSure) { setDelSure(true); return; }
    await sb().storage.from("avatars").remove([`${uid}/avatar.jpg`]);
    const { error } = await sb().rpc("delete_my_account");
    if (error) { setErr("A fiók törlése nem sikerült."); return; }
    await signOut();
  }

  return (
    <section className="wrap narrow">
      {q.get("uj") && <div className="ok" style={{ marginBottom: 18 }}>Üdv a Versekben, {u.nickname}! A fiókod kész. Itt beállíthatod a profilodat, vagy <Link href="/feltoltes">feltöltheted az első versedet</Link>.</div>}
      <div className="phead"><Avatar name={u.nickname} url={u.avatar_url} cls="pav big" />
        <div><h1 style={{ margin: 0 }}>{u.nickname}</h1><p className="lead" style={{ margin: "4px 0 0" }}>Tag vagy {since} óta{u.age && u.show_age ? ` · ${u.age} éves` : ""}{u.city ? ` · ${u.city}` : ""}</p></div>
      </div>
      {u.bio && <p className="pbio">{u.bio}</p>}
      <p><Link href={`/tag/${uid}`}>Így látják mások a profilodat</Link></p>

      <form className="panel regf" noValidate onSubmit={save}>
        <h2 style={{ margin: 0 }}>Profilom</h2>
        <p className="muted" style={{ margin: "-8px 0 0" }}>Itt minden választható. Csak azt add meg, amit szívesen megmutatsz.</p>
        <div className="picrow"><Avatar name={u.nickname} url={u.avatar_url} cls="pav big" />
          <div><label className="filebtn">Profilkép választása<input type="file" accept="image/*" onChange={(e) => pic(e.target.files?.[0])} /></label>{u.avatar_url && <> <button type="button" className="mini" onClick={nopic}>Kép törlése</button></>}
            <small style={{ display: "block", marginTop: 6 }}>Ha nem töltesz fel képet, a beceneved kezdőbetűje látszik.</small></div>
        </div>
        <label>Becenév<input type="text" required minLength={2} maxLength={40} value={f.nickname} onChange={(e) => setF({ ...f, nickname: e.target.value })} /></label>
        <div className="two">
          <label>Életkor <span className="opt">(nem kötelező)</span><input type="number" min={16} max={120} inputMode="numeric" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></label>
          <label>Település <span className="opt">(nem kötelező)</span><input type="text" maxLength={40} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></label>
        </div>
        <label className="check"><input type="checkbox" checked={f.show_age} onChange={(e) => setF({ ...f, show_age: e.target.checked })} /> <span>Az életkorom látszódjon a profilomon.</span></label>
        <label>Pár szó magadról <span className="opt">(nem kötelező)</span><textarea maxLength={200} style={{ minHeight: 80 }} placeholder="Mit szeretsz olvasni, írsz-e verset…" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></label>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend>Kedvenc témáid <span className="opt">(nem kötelező)</span></legend>
          <div className="chips">{THEMES.map((t) => { const on = f.themes.includes(t); return <button key={t} type="button" className="chip" aria-pressed={on} onClick={() => setF({ ...f, themes: on ? f.themes.filter((x) => x !== t) : [...f.themes, t] })}>{t}</button>; })}</div>
        </fieldset>
        <label className="check"><input type="checkbox" checked={f.newsletter} onChange={(e) => setF({ ...f, newsletter: e.target.checked })} /> <span>Kérek havi hírlevelet a közös felolvasásokról.</span></label>
        <div className="err" role="alert">{err}</div>{ok && <div className="ok">{ok}</div>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="cta" type="submit" disabled={busy}>Mentés</button>
          <Link className="cta ghost" href="/feltoltes">Vers feltöltése</Link>
          <button type="button" className="cta ghost" onClick={signOut}>Kijelentkezés</button>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>Belépési adatok: {session.user.email} · Szabályzat elfogadva ({u.terms_version})</p>
      </form>

      <form className="panel regf" noValidate onSubmit={changePw}>
        <h2 style={{ margin: 0 }}>{q.get("jelszo") ? "Új jelszó megadása" : "Jelszó módosítása"}</h2>
        <label>Új jelszó<input type="password" minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        {pwMsg && <div className="muted">{pwMsg}</div>}
        <div><button className="cta ghost" type="submit">Jelszó mentése</button></div>
      </form>

      <div className="panel regf">
        <h2 style={{ margin: 0 }}>Fiók törlése</h2>
        <p className="muted" style={{ margin: 0 }}>A fiókoddal együtt törlődnek a verseid, hozzászólásaid, tintáid, üzeneteid és gyűjteményeid. Ez nem vonható vissza.</p>
        <div><button type="button" className="cta ghost danger" onClick={deleteAccount}>{delSure ? "Igen, végleg törlöm a fiókomat" : "Fiók törlése"}</button></div>
      </div>
    </section>
  );
}

export default function Profil() { return <Suspense fallback={<Loading />}><ProfilInner /></Suspense>; }
