"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { useApp } from "./AppProvider";

export default function CollectionDialog({ keys, onClose }: { keys: string[]; onClose: () => void }) {
  const { collections, reloadCollections, byKey } = useApp();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const one = keys.length === 1 ? byKey(keys[0]) : null;

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  async function toggle(cid: string, on: boolean) {
    setBusy(true);
    if (on) await sb().from("collection_items").upsert(keys.map((k) => ({ collection_id: cid, poem_key: k })), { ignoreDuplicates: true });
    else await sb().from("collection_items").delete().eq("collection_id", cid).in("poem_key", keys);
    await reloadCollections(); setBusy(false);
  }
  async function create() {
    const n = name.trim(); if (!n) return;
    setBusy(true);
    const { data } = await sb().from("collections").insert({ name: n }).select("id").single();
    if (data && keys.length) await sb().from("collection_items").insert(keys.map((k) => ({ collection_id: data.id, poem_key: k })));
    setName(""); await reloadCollections(); setBusy(false);
  }

  return (
    <div id="dlg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dbox" role="dialog" aria-modal="true" aria-label="Gyűjteménybe">
        <h3>{keys.length === 0 ? "Új gyűjtemény" : one ? "Gyűjteménybe: " + one.title : keys.length + " vers gyűjteménybe"}</h3>
        {keys.length > 0 && (
          <div className="ckl">
            {collections.map((c) => {
              const has = keys.every((k) => c.keys.includes(k));
              return (
                <label key={c.id}><input type="checkbox" disabled={busy} checked={has} onChange={(e) => toggle(c.id, e.target.checked)} /> {c.name} <span className="muted">({c.keys.length})</span></label>
              );
            })}
          </div>
        )}
        <div className="row">
          <input type="text" placeholder="Új gyűjtemény neve" maxLength={40} value={name} autoFocus onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") create(); }} />
          <button className="cta" disabled={busy} onClick={create}>Létrehozás</button>
        </div>
        <div style={{ textAlign: "right" }}><button className="cta ghost" onClick={onClose}>Kész</button></div>
      </div>
    </div>
  );
}
