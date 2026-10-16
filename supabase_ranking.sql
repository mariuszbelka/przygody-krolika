-- Ranking „Puszek i marchewki” – tabela dla nowego projektu Supabase.
-- Wklej w Supabase → SQL Editor → Run.
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  player_name text not null check (char_length(player_name) between 3 and 16),
  score integer not null check (score between 0 and 200000),
  level_label text not null default '' check (char_length(level_label) <= 80),
  created_at timestamptz not null default now()
);
alter table public.scores enable row level security;
-- każdy z linkiem może czytać i dopisywać; nikt (poza Tobą w panelu) nie zmienia ani nie kasuje
drop policy if exists "scores read" on public.scores;
drop policy if exists "scores insert" on public.scores;
create policy "scores read" on public.scores for select to anon using (true);
create policy "scores insert" on public.scores for insert to anon with check (true);
create index if not exists scores_label_score on public.scores (level_label, score desc);
