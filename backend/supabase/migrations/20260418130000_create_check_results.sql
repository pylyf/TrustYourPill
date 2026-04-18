create table if not exists public.check_results (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  candidate_rxcui text not null,
  current_medication_rxcuis jsonb not null,
  findings jsonb not null,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists check_results_candidate_rxcui_idx
on public.check_results (candidate_rxcui);

alter table public.check_results enable row level security;

create policy "hackathon_check_results_select"
on public.check_results
for select
to anon, authenticated
using (true);

create policy "hackathon_check_results_insert"
on public.check_results
for insert
to anon, authenticated
with check (true);
