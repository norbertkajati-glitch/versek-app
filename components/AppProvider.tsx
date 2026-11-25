"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { sb } from "@/lib/supabase";
import { CLASSIC_POEMS, fromDb, seasonOf, type DbPoem, type Poem } from "@/lib/util";
import type { Season } from "@/lib/data";
import CollectionDialog from "./CollectionDialog";

export type Profile = {
  id: string; nickname: string; over16: boolean; terms_version: string; terms_accepted_at: string;
  age: number | null; show_age: boolean; city: string | null; bio: string | null; themes: string[];
  newsletter: boolean; avatar_url: string | null; last_seen_at: string; prev_seen_at: string; created_at: string;
};
export type Collection = { id: string; name: string; created_at: string; keys: string[] };
export type PublicName = { id: string; nickname: string; avatar_url: string | null };
type InkCount = { total: number; week: number };

type Ctx = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  prevSeen: Date;
  seasonPref: "auto" | Season;
  setSeasonPref: (s: "auto" | Season) => void;
  season: Season;
  theme: "light" | "dark";
  toggleTheme: () => void;
  community: Poem[];
  poemsLoaded: boolean;
  reloadPoems: () => Promise<void>;
  all: Poem[];
  byKey: (k: string) => Poem | undefined;
  inks: Record<string, InkCount>;
  myInks: Set<string>;
  toggleInk: (k: string) => Promise<void>;
  collections: Collection[];
  reloadCollections: () => Promise<void>;
  openCollect: (keys: string[]) => void;
  names: (ids: string[]) => Promise<Record<string, PublicName>>;
  newCount: number;
};

const C = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(C); if (!c) throw new Error("no ctx"); return c; };

const LS = "versek";
const readLS = (): Record<string, unknown> => { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch { return {}; } };
const writeLS = (patch: Record<string, unknown>) => { try { localStorage.setItem(LS, JSON.stringify({ ...readLS(), ...patch })); } catch { /* privát mód */ } };

export default function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prevSeen, setPrevSeen] = useState<Date>(() => new Date(Date.now() - 864e5));
  const [seasonPref, setSeasonPrefS] = useState<"auto" | Season>("auto");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [community, setCommunity] = useState<Poem[]>([]);
  const [poemsLoaded, setPoemsLoaded] = useState(false);
  const [inks, setInks] = useState<Record<string, InkCount>>({});
  const [myInks, setMyInks] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<Collection[]>([]);
  const [dlgKeys, setDlgKeys] = useState<string[] | null>(null);
  const nameCache = useRef<Record<string, PublicName>>({});

  const season: Season = seasonPref === "auto" ? seasonOf(new Date()) : seasonPref;
  const uid = session?.user.id;

  // megjelenés: localStorage-ból
  useEffect(() => {
    const s = readLS();
    if (typeof s.season === "string") setSeasonPrefS(s.season as "auto" | Season);
    if (s.theme === "dark") setTheme("dark");
    // vendégeknek az utolsó látogatás a böngészőben
    const last = typeof s.lastVisit === "string" ? new Date(s.lastVisit) : null;
    if (last && !isNaN(+last)) setPrevSeen(last);
    const lastTouch = typeof s.lastTouch === "string" ? new Date(s.lastTouch) : null;
    if (!lastTouch || Date.now() - +lastTouch > 30 * 60e3) writeLS({ lastVisit: (lastTouch || new Date()).toISOString() });
    writeLS({ lastTouch: new Date().toISOString() });
  }, []);
  useEffect(() => {
    document.documentElement.dataset.season = season;
    document.documentElement.dataset.theme = theme;
  }, [season, theme]);
  const setSeasonPref = (s: "auto" | Season) => { setSeasonPrefS(s); writeLS({ season: s }); };
  const toggleTheme = () => setTheme((t) => { const n = t === "dark" ? "light" : "dark"; writeLS({ theme: n }); return n; });

  // bejelentkezés
  useEffect(() => {
    const c = sb();
    c.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = c.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!uid) { setProfile(null); return; }
    const { data } = await sb().from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile((data as Profile) || null);
  }, [uid]);

  useEffect(() => {
    if (!uid) { setProfile(null); setMyInks(new Set()); setCollections([]); return; }
    (async () => {
      const { data: p } = await sb().rpc("touch_seen");
      if (p) setPrevSeen(new Date(p as string));
      await refreshProfile();
    })();
  }, [uid, refreshProfile]);

  const reloadPoems = useCallback(async () => {
    const { data } = await sb().from("poems").select("id,author_id,author_name,title,body,themes,created_at").order("created_at", { ascending: false }).limit(1000);
    setCommunity(((data as DbPoem[]) || []).map(fromDb));
    setPoemsLoaded(true);
  }, []);
  const reloadInks = useCallback(async () => {
    const { data } = await sb().from("ink_counts").select("poem_key,total,week");
    const m: Record<string, InkCount> = {};
    (data || []).forEach((r: { poem_key: string; total: number; week: number }) => { m[r.poem_key] = { total: r.total, week: r.week }; });
    setInks(m);
  }, []);
  useEffect(() => { reloadPoems(); reloadInks(); }, [reloadPoems, reloadInks]);
  useEffect(() => {
    if (!uid) return;
    sb().from("inks").select("poem_key").eq("user_id", uid).then(({ data }) => setMyInks(new Set((data || []).map((r: { poem_key: string }) => r.poem_key))));
  }, [uid]);

  const toggleInk = useCallback(async (k: string) => {
    if (!uid) { router.push("/regisztracio?ok=tinta"); return; }
    const had = myInks.has(k);
    const d = had ? -1 : 1;
    setMyInks((s) => { const n = new Set(s); had ? n.delete(k) : n.add(k); return n; });
    setInks((m) => ({ ...m, [k]: { total: Math.max(0, (m[k]?.total || 0) + d), week: Math.max(0, (m[k]?.week || 0) + d) } }));
    const { error } = had
      ? await sb().from("inks").delete().eq("poem_key", k).eq("user_id", uid)
      : await sb().from("inks").insert({ poem_key: k });
    if (error) reloadInks();
  }, [uid, myInks, router, reloadInks]);

  const reloadCollections = useCallback(async () => {
    if (!uid) { setCollections([]); return; }
    const { data } = await sb().from("collections").select("id,name,created_at,collection_items(poem_key,added_at)").order("created_at");
    setCollections(((data || []) as { id: string; name: string; created_at: string; collection_items: { poem_key: string; added_at: string }[] }[]).map((c) => ({
      id: c.id, name: c.name, created_at: c.created_at,
      keys: [...c.collection_items].sort((a, b) => a.added_at.localeCompare(b.added_at)).map((i) => i.poem_key),
    })));
  }, [uid]);
  useEffect(() => { reloadCollections(); }, [reloadCollections]);

  const openCollect = (keys: string[]) => { if (!uid) { router.push("/regisztracio?ok=gyujtemeny"); return; } setDlgKeys(keys); };

  const names = useCallback(async (ids: string[]) => {
    const need = [...new Set(ids)].filter((i) => i && !nameCache.current[i]);
    if (need.length) {
      const { data } = await sb().from("public_profiles").select("id,nickname,avatar_url").in("id", need);
      (data || []).forEach((r: PublicName) => { nameCache.current[r.id] = r; });
      need.forEach((i) => { if (!nameCache.current[i]) nameCache.current[i] = { id: i, nickname: "Törölt felhasználó", avatar_url: null }; });
    }
    const out: Record<string, PublicName> = {};
    ids.forEach((i) => { if (nameCache.current[i]) out[i] = nameCache.current[i]; });
    return out;
  }, []);

  const signOut = async () => { await sb().auth.signOut(); setSession(null); router.push("/belepes"); };

  const all = useMemo(() => [...CLASSIC_POEMS, ...community], [community]);
  const byKey = useCallback((k: string) => all.find((p) => p.key === k), [all]);
  const newCount = useMemo(() => community.filter((p) => p.createdAt && new Date(p.createdAt) > prevSeen && p.authorId !== uid).length, [community, prevSeen, uid]);

  const v: Ctx = {
    ready, session, profile, refreshProfile, signOut, prevSeen, seasonPref, setSeasonPref, season, theme, toggleTheme,
    community, poemsLoaded, reloadPoems, all, byKey, inks, myInks, toggleInk, collections, reloadCollections, openCollect, names, newCount,
  };
  return (
    <C.Provider value={v}>
      {children}
      {dlgKeys && <CollectionDialog keys={dlgKeys} onClose={() => setDlgKeys(null)} />}
    </C.Provider>
  );
}
