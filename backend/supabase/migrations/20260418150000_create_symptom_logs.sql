create table if not exists public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  symptoms text[] not null default '{}',
  other_text text,
  feeling_good boolean not null default false,
  logged_at timestamptz not null default now()
);

alter table public.symptom_logs enable row level security;

create policy "hackathon_symptom_logs_select"
on public.symptom_logs for select to anon, authenticated using (true);

create policy "hackathon_symptom_logs_insert"
on public.symptom_logs for insert to anon, authenticated with check (true);
