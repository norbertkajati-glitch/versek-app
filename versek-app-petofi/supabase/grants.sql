-- Jogosultságok a Data API-hoz.
-- Az újabb Supabase-projektekben a táblák alapból nem érhetők el az API-n át,
-- ezért ezt külön meg kell adni. A sorszintű szabályok (RLS) továbbra is érvényesek.
grant usage on schema public to anon, authenticated;

grant select on public.poems, public.inks, public.comments, public.messages,
               public.events, public.event_signups to anon;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.poems to authenticated;
grant select, insert, delete on public.inks, public.comments, public.event_signups to authenticated;
grant select, insert, update, delete on public.collections, public.collection_items to authenticated;
grant select, insert on public.messages to authenticated;
grant select on public.events to authenticated;
grant insert on public.reports to authenticated;

grant select on public.public_profiles, public.ink_counts to anon, authenticated;
grant execute on function public.nickname_available(text) to anon, authenticated;
grant execute on function public.touch_seen() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
