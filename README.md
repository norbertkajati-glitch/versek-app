# Versek

Versek, költők és olvasók egy helyen: napi versajánló, klasszikus költők, közösségi versek tintával és hozzászólásokkal, gyűjtemények letöltéssel, Előszoba chat (közös és privát), közös felolvasások.

Technológia: Next.js (App Router, TypeScript) + Supabase (adatbázis, bejelentkezés, tárhely, élő chat). Hosting: Vercel.

## Beállítás

### 1. Supabase
1. Új projekt a supabase.com-on (régió: Frankfurt / `eu-central-1`).
2. **SQL Editor → New query**: másold be a `supabase/schema.sql` teljes tartalmát, majd **Run**.
3. **Authentication → Sign In / Providers → Email**: kapcsold **ki** a *Confirm email* opciót (a regisztráció megerősítő e-mail nélkül működik).
4. **Authentication → URL Configuration**: *Site URL* legyen a Vercel-cím (pl. `https://versek-app.vercel.app`), a *Redirect URLs* közé is vedd fel.
5. **Project Settings → API**: innen kell a *Project URL* és az *anon public* kulcs. A `service_role` kulcsot soha ne tedd a kódba vagy a Vercelbe.

### 2. Vercel
1. **Add New → Project →** a `versek-app` GitHub repó importálása.
2. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy**. Ezután minden GitHubra feltöltött változás magától élesedik.

### Helyi futtatás
```
cp .env.example .env.local   # majd töltsd ki
npm install
npm run dev
```

## Moderálás
A jelentések a `reports` táblába kerülnek, a Supabase Table Editorban láthatók. Vers elrejtése: a `poems` táblában a `hidden` mező `true`.

## Tudnivalók
- A felhasználói szabályzat (`lib/data.ts`, `TERMS`) tervezet: élesítés előtt jogásznak kell átnéznie.
- A klasszikus versek közkincsek. Most egy válogatás van fent (néhány teljes szöveg, a többi részlet); a teljes életművek betöltése a következő lépés (forrás: MEK, PIM).
- Az évszakos fotók a Wikimedia Commonsról származnak, a forrás és a licenc az oldal alján látható.
