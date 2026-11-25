"use client";
import Link from "next/link";
import { useApp } from "./AppProvider";
import type { Poem } from "@/lib/util";

export const Quill = () => (
  <svg className="q" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.5 3.5C14 4.2 8.6 8.6 6.6 15l-.9 3.2 3.2-.9C15.4 15.3 19.8 9.9 20.5 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M5.7 18.2 3 21M9.5 14.4l6-6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="17.5" cy="19.5" r="1.6" fill="currentColor" />
  </svg>
);

export function InkButton({ k }: { k: string }) {
  const { inks, myInks, toggleInk } = useApp();
  const on = myInks.has(k), n = inks[k]?.total || 0;
  return (
    <button className={"vote ink" + (on ? " on" : "")} aria-pressed={on} aria-label={`Tinta: ${n}`} title="Adj tintát a versnek"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleInk(k); }}>
      <Quill /><span>{n}</span>
    </button>
  );
}

export function ColButton({ k }: { k: string }) {
  const { collections, openCollect } = useApp();
  const inCol = collections.some((c) => c.keys.includes(k));
  return (
    <button className={"vote" + (inCol ? " on" : "")} title="Gyűjteménybe" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openCollect([k]); }}>
      {inCol ? "✓ Gyűjteményben" : "+ Gyűjtemény"}
    </button>
  );
}

export function AddAll({ keys }: { keys: string[] }) {
  const { openCollect } = useApp();
  if (!keys.length) return null;
  return <button className="cta ghost" onClick={() => openCollect(keys)}>Mind a {keys.length} vers gyűjteménybe</button>;
}

export function PoemCard({ p, by, ink = true }: { p: Poem; by?: string; ink?: boolean }) {
  return (
    <Link className="card" href={`/vers/${p.key}`} style={{ textDecoration: "none" }}>
      <h3>{p.title}</h3>
      <div className="ex">{p.text}</div>
      <div className="meta"><span>{by || p.by}</span><span className="acts">{ink && <InkButton k={p.key} />}<ColButton k={p.key} /></span></div>
    </Link>
  );
}

export function Gate({ what }: { what: string }) {
  return (
    <div className="gate">
      <p><b>{what}</b> Regisztrálj, egy perc az egész, és nem kell e-mailes megerősítés.</p>
      <Link className="cta" href="/regisztracio">Regisztráció</Link> <Link className="mini" href="/belepes" style={{ marginLeft: 6 }}>Már van fiókom</Link>
    </div>
  );
}

export function Avatar({ name, url, cls = "pav" }: { name?: string | null; url?: string | null; cls?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (url) return <img className={cls} src={url} alt="" />;
  return <span className={cls + " ini"} aria-hidden="true">{(name || "?")[0]}</span>;
}

export const Loading = ({ t = "Betöltés…" }: { t?: string }) => <p className="loading">{t}</p>;
