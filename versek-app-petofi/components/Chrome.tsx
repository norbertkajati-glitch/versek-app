"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { Avatar } from "./bits";
import { PHOTOS } from "@/lib/data";
import { bgPhotoFor, photoFor } from "@/lib/util";

const NAV: [string, string][] = [
  ["/", "Felfedezés"], ["/ujdonsagok", "Újdonságok"], ["/napi", "Napi vers"], ["/koltok", "Költők"], ["/temak", "Témák"],
  ["/kozosseg", "Közösség"], ["/gyujtemenyek", "Gyűjteményeim"], ["/eloszoba", "Előszoba"], ["/felolvasasok", "Felolvasások"],
];

export function Header() {
  const path = usePathname() || "/";
  const { session, profile, newCount, season } = useApp();
  const sect = path === "/" ? "/" : "/" + path.split("/")[1];
  const key = sect === "/vers" ? "" : sect;
  const bg = bgPhotoFor(season);
  return (
    <>
      <header><div className="wrap hd">
        <Link className="logo" href="/"><i></i>Versek</Link>
        <nav id="nav">
          {NAV.map(([h, t]) => (
            <Link key={h} href={h} className={key === h ? "on" : ""}>{t}{h === "/ujdonsagok" && newCount > 0 && <span className="badge">{newCount}</span>}</Link>
          ))}
        </nav>
        <div className="hacts">
          {session ? (
            <Link className={"acct on" + (key === "/profil" ? " cur" : "")} href="/profil" title={profile?.nickname || ""}>
              <Avatar name={profile?.nickname} url={profile?.avatar_url} cls="ini" /><span className="sr">{profile?.nickname} fiókja</span>
            </Link>
          ) : (
            <Link className="acct" href="/regisztracio">Regisztráció</Link>
          )}
          <Link className="cta" href="/feltoltes">Vers feltöltése</Link>
        </div>
      </div></header>
      <div className="bgph" aria-hidden="true" style={{ backgroundImage: `url(${bg.f})` }} />
    </>
  );
}

export function Footer() {
  const { theme, toggleTheme, season } = useApp();
  const cur = photoFor(season);
  return (
    <>
      <div className="wrap note">Tesztváltozat. A klasszikus versek közkincsek (szerzőik több mint 70 éve hunytak el). A közösségi versek szerzői joga a feltöltőké. Az évszakos fotók a Wikimedia Commonsról származnak, szabad licenccel (CC0, CC BY, CC BY-SA).</div>
      <div className="wrap photocred foot-links">
        <Link href="/szabalyzat">Felhasználói szabályzat</Link><Link href="/terv">Termékterv</Link><Link href="/regisztracio">Regisztráció</Link>
        <button className="themebtn" type="button" aria-pressed={theme === "dark"} onClick={toggleTheme}>{theme === "dark" ? "☀ Világos megjelenés" : "☾ Éjszakai olvasás"}</button>
      </div>
      <div className="wrap photocred">
        <span>Címlapfotó: <a href={cur.u}>{cur.by}</a>, {cur.lic}, Wikimedia Commons.</span>{" "}
        <details><summary>Minden fotó forrása</summary><ul>{Object.values(PHOTOS).flat().map((p) => <li key={p.f}>{p.alt}: <a href={p.u}>{p.by}</a>, {p.lic}</li>)}</ul></details>
      </div>
    </>
  );
}
