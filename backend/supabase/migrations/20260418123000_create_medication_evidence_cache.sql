create table if not exists public.medication_evidence_cache (
  lookup_key text primary key,
  rxcui text not null,
  source text not null,
  raw_payload jsonb not null,
  parsed_evidence jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists medication_evidence_cache_rxcui_idx
on public.medication_evidence_cache (rxcui);

alter table public.medication_evidence_cache enable row level security;

create policy "hackathon_medication_evidence_cache_select"
on public.medication_evidence_cache
for select
to anon, authenticated
using (true);

create policy "hackathon_medication_evidence_cache_insert"
on public.medication_evidence_cache
for insert
to anon, authenticated
with check (true);

create policy "hackathon_medication_evidence_cache_update"
on public.medication_evidence_cache
for update
to anon, authenticated
using (true)
with check (true);
