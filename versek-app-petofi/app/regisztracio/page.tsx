"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { DraftNote, TermsBody } from "@/components/Terms";
import { sb } from "@/lib/supabase";
import { TERMS_VER } from "@/lib/data";

export default function Regisztracio() {
  const { session } = useApp();
  const router = useRouter();
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [pass, setPass] = useState("");
  const [o16, setO16] = useState(false), [terms, setTerms] = useState(false);
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { if (session) router.replace("/profil"); }, [session, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim(), em = email.trim();
    const bad = n.length < 2 ? "Adj meg legalább 2 karakteres becenevet." : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em) ? "Ellenőrizd az e-mail-címet." : pass.length < 8 ? "A jelszó legyen legalább 8 karakter." : !o16 ? "A regisztráció 16 éves kortól lehetséges." : !terms ? "A regisztrációhoz el kell fogadnod a felhasználói szabályzatot." : "";
    if (bad) { setErr(bad); return; }
    setBusy(true); setErr("");
    const { data: free } = await sb().rpc("nickname_available", { n });
    if (free === false) { setBusy(false); setErr("Ez a becenév már foglalt. Válassz másikat."); return; }
    const { data, error } = await sb().auth.signUp({ email: em, password: pass, options: { data: { nickname: n, over16: true, terms_version: TERMS_VER } } });
    setBusy(false);
    if (error) {
      const m = error.message.toLowerCase();
      setErr(m.includes("already") ? "Ezzel az e-mail-címmel már van fiók. Lépj be." : m.includes("password") ? "A jelszó túl gyenge. Válassz hosszabbat." : "Nem sikerült a regisztráció. Próbáld újra.");
      return;
    }
    if (!data.session) { setErr("A fiók létrejött, de a Supabase e-mailes megerősítést kér. Kapcsold ki a Confirm email beállítást, vagy erősítsd meg az e-mailt."); return; }
    router.replace("/profil?uj=1");
  }

  return (
    <section className="wrap narrow">
      <h1 style={{ marginBottom: 6 }}>Regisztráció</h1>
      <p className="lead">Csatlakozz az olvasók és költők közösségéhez. Három adat elég, megerősítő e-mailt nem küldünk: a fiókod azonnal használható.</p>
      <form className="panel regf" noValidate onSubmit={submit}>
        <label>Becenév<input type="text" required minLength={2} maxLength={40} autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} /><small>Így látnak a többiek a versed alatt és az Előszobában. Nem kell a teljes neved.</small></label>
        <label>E-mail-cím<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /><small>Nem tesszük közzé. Belépéshez és fontos értesítésekhez kell.</small></label>
        <label>Jelszó<input type="password" required minLength={8} autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} /><small>Legalább 8 karakter.</small></label>
        <details className="terms-box"><summary>A felhasználói szabályzat elolvasása</summary><DraftNote /><TermsBody /></details>
        <label className="check"><input type="checkbox" checked={o16} onChange={(e) => setO16(e.target.checked)} /> <span>Elmúltam 16 éves.</span></label>
        <label className="check"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> <span>Elolvastam és elfogadom a felhasználói szabályzatot.</span></label>
        <div className="err" role="alert">{err}</div>
        <div><button className="cta" type="submit" disabled={busy}>{busy ? "Fiók létrehozása…" : "Fiók létrehozása"}</button> <Link className="mini" href="/belepes" style={{ marginLeft: 8 }}>Már van fiókom</Link></div>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>Profilképet, életkort és bemutatkozást később, a profilodban adhatsz meg, ha szeretnél.</p>
      </form>
    </section>
  );
}
