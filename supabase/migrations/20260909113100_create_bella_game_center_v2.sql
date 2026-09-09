create table if not exists public.bella_game_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'لاعب',
  total_correct bigint not null default 0,
  total_answers bigint not null default 0,
  games_played bigint not null default 0,
  best_streak integer not null default 0,
  xp_earned bigint not null default 0,
  daily_score integer not null default 0,
  daily_date date not null default current_date,
  weekly_score integer not null default 0,
  week_start date not null default date_trunc('week', current_date)::date,
  updated_at timestamptz not null default now(),
  constraint bella_game_scores_display_name_len check (char_length(display_name) between 1 and 40),
  constraint bella_game_scores_nonnegative check (
    total_correct >= 0 and total_answers >= 0 and games_played >= 0 and best_streak >= 0 and xp_earned >= 0 and daily_score >= 0 and weekly_score >= 0
  )
);

alter table public.bella_game_scores enable row level security;

revoke all on table public.bella_game_scores from anon, authenticated;
grant select on table public.bella_game_scores to anon, authenticated;
grant insert, update on table public.bella_game_scores to authenticated;

drop policy if exists bella_game_scores_public_read on public.bella_game_scores;
create policy bella_game_scores_public_read on public.bella_game_scores
for select to anon, authenticated using (true);

drop policy if exists bella_game_scores_insert_own on public.bella_game_scores;
create policy bella_game_scores_insert_own on public.bella_game_scores
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists bella_game_scores_update_own on public.bella_game_scores;
create policy bella_game_scores_update_own on public.bella_game_scores
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index if not exists bella_game_scores_daily_idx on public.bella_game_scores (daily_date desc, daily_score desc);
create index if not exists bella_game_scores_weekly_idx on public.bella_game_scores (week_start desc, weekly_score desc);
create index if not exists bella_game_scores_alltime_idx on public.bella_game_scores (xp_earned desc, total_correct desc);

create or replace function public.bella_submit_game_score(
  p_display_name text,
  p_game text,
  p_correct boolean,
  p_points integer,
  p_streak integer,
  p_session_complete boolean default false
)
returns public.bella_game_scores
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := left(regexp_replace(coalesce(p_display_name, 'لاعب'), '\s+', ' ', 'g'), 40);
  v_points integer := greatest(0, least(coalesce(p_points, 0), 100));
  v_streak integer := greatest(0, least(coalesce(p_streak, 0), 1000));
  v_today date := current_date;
  v_week date := date_trunc('week', current_date)::date;
  v_row public.bella_game_scores;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if char_length(trim(v_name)) = 0 then v_name := 'لاعب'; end if;

  insert into public.bella_game_scores as s (
    user_id, display_name, total_correct, total_answers, games_played, best_streak, xp_earned,
    daily_score, daily_date, weekly_score, week_start, updated_at
  ) values (
    v_uid, v_name,
    case when p_correct then 1 else 0 end,
    1,
    case when p_session_complete then 1 else 0 end,
    v_streak,
    v_points,
    v_points,
    v_today,
    v_points,
    v_week,
    now()
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    total_correct = s.total_correct + case when p_correct then 1 else 0 end,
    total_answers = s.total_answers + 1,
    games_played = s.games_played + case when p_session_complete then 1 else 0 end,
    best_streak = greatest(s.best_streak, v_streak),
    xp_earned = s.xp_earned + v_points,
    daily_score = case when s.daily_date = v_today then s.daily_score + v_points else v_points end,
    daily_date = v_today,
    weekly_score = case when s.week_start = v_week then s.weekly_score + v_points else v_points end,
    week_start = v_week,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.bella_get_game_leaderboard(
  p_scope text default 'weekly',
  p_limit integer default 20
)
returns table (
  rank bigint,
  display_name text,
  score bigint,
  total_correct bigint,
  best_streak integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with scored as (
    select
      display_name,
      case
        when lower(coalesce(p_scope, 'weekly')) = 'daily' and daily_date = current_date then daily_score::bigint
        when lower(coalesce(p_scope, 'weekly')) = 'all' then xp_earned::bigint
        when week_start = date_trunc('week', current_date)::date then weekly_score::bigint
        else 0::bigint
      end as score,
      total_correct,
      best_streak
    from public.bella_game_scores
  )
  select
    row_number() over (order by score desc, total_correct desc, best_streak desc, display_name asc) as rank,
    display_name,
    score,
    total_correct,
    best_streak
  from scored
  where score > 0
  order by score desc, total_correct desc, best_streak desc, display_name asc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

revoke all on function public.bella_submit_game_score(text,text,boolean,integer,integer,boolean) from public, anon;
grant execute on function public.bella_submit_game_score(text,text,boolean,integer,integer,boolean) to authenticated;

revoke all on function public.bella_get_game_leaderboard(text,integer) from public;
grant execute on function public.bella_get_game_leaderboard(text,integer) to anon, authenticated;
