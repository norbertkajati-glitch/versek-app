"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { sb } from "@/lib/supabase";

export default function Belepes() {
  const { session } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState(""), [pass, setPass] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [resetMode, setResetMode] = useState(false), [info, setInfo] = useState("");
  useEffect(() => { if (session) router.replace("/ujdonsagok"); }, [session, router]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(""); setInfo("");
    if (resetMode) {
      const { error } = await sb().auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + "/profil?jelszo=1" });
      setBusy(false);
      if (error) setErr("Nem sikerült elküldeni. Próbáld később."); else setInfo("Ha van ilyen fiók, küldtünk egy levelet a jelszó megváltoztatásához.");
      return;
    }
    const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password: pass });
    setBusy(false);
    if (error) setErr("Hibás e-mail-cím vagy jelszó.");
  }
  return (
    <section className="wrap narrow">
      <h1 style={{ marginBottom: 6 }}>{resetMode ? "Elfelejtett jelszó" : "Belépés"}</h1>
      <form className="panel regf" noValidate onSubmit={submit}>
        <label>E-mail-cím<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {!resetMode && <label>Jelszó<input type="password" required autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} /></label>}
        <div className="err" role="alert">{err}</div>
        {info && <div className="ok">{info}</div>}
        <div><button className="cta" type="submit" disabled={busy}>{resetMode ? "Levél küldése" : "Belépés"}</button> <Link className="mini" href="/regisztracio" style={{ marginLeft: 8 }}>Új fiók</Link></div>
        <p style={{ margin: 0 }}><button type="button" className="linkbtn" onClick={() => { setResetMode(!resetMode); setErr(""); setInfo(""); }}>{resetMode ? "Vissza a belépéshez" : "Elfelejtettem a jelszavam"}</button></p>
      </form>
    </section>
  );
}
