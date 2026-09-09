revoke all on table public.bella_game_scores from anon, authenticated;

-- Keep RLS enabled as a second line of defense even though clients use RPCs only.
alter table public.bella_game_scores enable row level security;

-- Public leaderboard reads go through the sanitized bella_get_game_leaderboard RPC.
-- Authenticated score writes go through bella_submit_game_score, which binds writes to auth.uid().
revoke all on function public.bella_submit_game_score(text,text,boolean,integer,integer,boolean) from public, anon;
grant execute on function public.bella_submit_game_score(text,text,boolean,integer,integer,boolean) to authenticated;

revoke all on function public.bella_get_game_leaderboard(text,integer) from public;
grant execute on function public.bella_get_game_leaderboard(text,integer) to anon, authenticated;
