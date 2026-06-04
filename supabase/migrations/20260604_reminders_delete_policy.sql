-- ────────────────────────────────────────────────────────────────────
-- MANNA — Add the missing DELETE row-level-security policy on
-- prayer_reminders, for consistency with the other per-user tables.
--
-- Without this, a user could never delete their own reminder row under
-- RLS. (The cron job uses the service-role key and bypasses RLS, so this
-- only affects user-initiated deletes from the app.)
--
-- Run once in the Supabase SQL editor (or via `supabase db push`).
-- ────────────────────────────────────────────────────────────────────

drop policy if exists "rem delete own" on public.prayer_reminders;

create policy "rem delete own"
  on public.prayer_reminders for delete
  using (auth.uid() = user_id);
