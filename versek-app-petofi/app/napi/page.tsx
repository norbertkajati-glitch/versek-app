"use client";
import { useState } from "react";
import BookOfDay from "@/components/BookOfDay";
import { useApp } from "@/components/AppProvider";
import { dateAt, fmt, pickForDay } from "@/lib/util";

export default function Napi() {
  const [sel, setSel] = useState(0);
  const { classics } = useApp();
  const t = dateAt(0), y = t.getFullYear(), m = t.getMonth(), first = new Date(y, m, 1, 12), days = new Date(y, m + 1, 0).getDate(), lead = (first.getDay() + 6) % 7;
  return (
    <section className="wrap">
      <h1 style={{ marginBottom: 8 }}>Napi versajánló</h1>
      <p className="muted" style={{ margin: "0 0 20px" }}>{fmt(t, { year: "numeric", month: "long" })}. Minden napnak megvan a maga verse, az évszakhoz illők gyakrabban jönnek. Kattints egy napra.</p>
      <div className="reader" style={{ marginBottom: 32 }}><BookOfDay key={sel} initial={sel} /></div>
      <div className="cal">
        {["H", "K", "Sze", "Cs", "P", "Szo", "V"].map((w) => <div key={w} className="wd">{w}</div>)}
        {Array.from({ length: lead }, (_, i) => <div key={"p" + i} className="pad" />)}
        {Array.from({ length: days }, (_, k) => {
          const i = k + 1, d = new Date(y, m, i, 12), p = pickForDay(d, classics), o = i - t.getDate();
          return (
            <button key={i} className={"day" + (o === 0 ? " today" : "") + (o < 0 ? " past" : "")} onClick={() => { setSel(o); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <b>{i}</b><span>{p.title}</span><small>{p.by}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
