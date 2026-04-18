create table if not exists public.user_medications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  input_name text not null,
  display_name text not null,
  normalized_name text not null,
  rxcui text not null,
  rxaui text,
  source text not null,
  search_score double precision,
  created_at timestamptz not null default now(),
  unique (user_id, rxcui)
);

alter table public.user_medications enable row level security;

create policy "hackathon_user_medications_select"
on public.user_medications
for select
to anon, authenticated
using (true);

create policy "hackathon_user_medications_insert"
on public.user_medications
for insert
to anon, authenticated
with check (true);

create policy "hackathon_user_medications_delete"
on public.user_medications
for delete
to anon, authenticated
using (true);
