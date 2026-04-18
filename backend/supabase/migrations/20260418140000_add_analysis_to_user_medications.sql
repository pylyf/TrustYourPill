-- Store the AI/safety analysis result directly on the medication row
-- so we can skip the slow external API call on subsequent loads.

alter table public.user_medications
  add column if not exists schedule_times text[] not null default '{}',
  add column if not exists dosage_text text,
  add column if not exists analysis jsonb,
  add column if not exists analysis_at timestamptz;

-- Allow updates (needed to patch analysis back onto an existing row)
create policy if not exists "hackathon_user_medications_update"
on public.user_medications
for update
to anon, authenticated
using (true)
with check (true);
