import { TERMS } from "@/lib/data";
export const DraftNote = () => <p className="draft">Ez a szabályzat tervezet. Élesítés előtt jogásznak kell átnéznie, különösen a szerzői jogi és az adatkezelési részt.</p>;
export const TermsBody = () => <>{TERMS.map(([h, ...ps]) => <div key={h}><h3>{h}</h3>{ps.map((x, i) => <p key={i}>{x}</p>)}</div>)}</>;
