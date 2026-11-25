"use client";
import type { ReactNode } from "react";
import { supabaseConfigured } from "@/lib/supabase";
import AppProvider from "./AppProvider";
import { Footer, Header } from "./Chrome";

export default function Shell({ children }: { children: ReactNode }) {
  if (!supabaseConfigured) {
    return (
      <div className="envwarn">
        <h1>Versek</h1>
        <p>Az alkalmazás még nincs összekötve a Supabase-zel. Add meg a <code>NEXT_PUBLIC_SUPABASE_URL</code> és a <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> környezeti változót (helyben a <code>.env.local</code> fájlban, élesben a Vercel beállításainál).</p>
      </div>
    );
  }
  return (
    <AppProvider>
      <Header />
      <main id="app">{children}</main>
      <Footer />
    </AppProvider>
  );
}
