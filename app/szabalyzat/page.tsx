import { DraftNote, TermsBody } from "@/components/Terms";
import { TERMS_VER } from "@/lib/data";
export const metadata = { title: "Felhasználói szabályzat" };
export default function Szabalyzat() {
  return <section className="wrap narrow terms"><h1 style={{ marginBottom: 6 }}>Felhasználói szabályzat</h1><p className="muted">{TERMS_VER}</p><DraftNote /><TermsBody /></section>;
}
