-- Bella v17: owner content studio, AI review queue and advanced owner controls.
alter table public.bella_app_config
  add column if not exists leaderboard_enabled boolean not null default true,
  add column if not exists content_ai_enabled boolean not null default true,
  add column if not exists wisdom_game_enabled boolean not null default true,
  add column if not exists proverb_game_enabled boolean not null default true,
  add column if not exists rumor_list_enabled boolean not null default true,
  add column if not exists box_game_enabled boolean not null default true,
  add column if not exists kuwait_quiz_enabled boolean not null default true;

create table if not exists public.bella_content_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('rumor','wisdom','proverb','kuwait','box')),
  prompt text not null check (char_length(prompt) between 2 and 500),
  answer text not null default '' check (char_length(answer) <= 240),
  explanation text not null default '' check (char_length(explanation) <= 600),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options)='array'),
  category text not null default 'عام' check (char_length(category) <= 80),
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  source text not null default 'manual' check (source in ('manual','ai')),
  status text not null default 'draft' check (status in ('draft','pending','approved','rejected')),
  enabled boolean not null default false,
  generation_meta jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists bella_content_kind_prompt_unique on public.bella_content_items(kind,lower(btrim(prompt)));
create index if not exists bella_content_public_idx on public.bella_content_items(kind,status,enabled,updated_at desc);
create index if not exists bella_content_review_idx on public.bella_content_items(status,source,created_at desc);
alter table public.bella_content_items enable row level security;

drop policy if exists bella_content_public_or_owner_select on public.bella_content_items;
create policy bella_content_public_or_owner_select on public.bella_content_items for select using (
  (status='approved' and enabled=true) or exists(select 1 from public.bella_owner_singleton o where o.slot=1 and o.user_id=(select auth.uid()))
);
drop policy if exists bella_content_owner_insert on public.bella_content_items;
create policy bella_content_owner_insert on public.bella_content_items for insert to authenticated with check (
  exists(select 1 from public.bella_owner_singleton o where o.slot=1 and o.user_id=(select auth.uid()))
);
drop policy if exists bella_content_owner_update on public.bella_content_items;
create policy bella_content_owner_update on public.bella_content_items for update to authenticated using (
  exists(select 1 from public.bella_owner_singleton o where o.slot=1 and o.user_id=(select auth.uid()))
) with check (
  exists(select 1 from public.bella_owner_singleton o where o.slot=1 and o.user_id=(select auth.uid()))
);
drop policy if exists bella_content_owner_delete on public.bella_content_items;
create policy bella_content_owner_delete on public.bella_content_items for delete to authenticated using (
  exists(select 1 from public.bella_owner_singleton o where o.slot=1 and o.user_id=(select auth.uid()))
);
grant select on public.bella_content_items to anon,authenticated;
grant insert,update,delete on public.bella_content_items to authenticated;

create or replace function public.bella_content_touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin
  new.updated_at=now();
  if auth.uid() is not null then new.updated_by=auth.uid(); end if;
  return new;
end;
$$;
drop trigger if exists bella_content_touch on public.bella_content_items;
create trigger bella_content_touch before update on public.bella_content_items for each row execute function public.bella_content_touch_updated_at();

drop function if exists public.bella_public_config();
create function public.bella_public_config()
returns table(live_web_enabled boolean,games_enabled boolean,radar_enabled boolean,maintenance_enabled boolean,announcement text,leaderboard_enabled boolean,content_ai_enabled boolean,wisdom_game_enabled boolean,proverb_game_enabled boolean,rumor_list_enabled boolean,box_game_enabled boolean,kuwait_quiz_enabled boolean,updated_at timestamptz)
language sql stable security definer set search_path='' as $$
  select c.live_web_enabled,c.games_enabled,c.radar_enabled,c.maintenance_enabled,c.announcement,c.leaderboard_enabled,c.content_ai_enabled,c.wisdom_game_enabled,c.proverb_game_enabled,c.rumor_list_enabled,c.box_game_enabled,c.kuwait_quiz_enabled,c.updated_at from public.bella_app_config c where c.id=1;
$$;
revoke all on function public.bella_public_config() from public;
grant execute on function public.bella_public_config() to anon,authenticated;

drop function if exists public.bella_owner_config();
create function public.bella_owner_config()
returns table(live_web_enabled boolean,games_enabled boolean,radar_enabled boolean,maintenance_enabled boolean,announcement text,ai_daily_limit integer,leaderboard_enabled boolean,content_ai_enabled boolean,wisdom_game_enabled boolean,proverb_game_enabled boolean,rumor_list_enabled boolean,box_game_enabled boolean,kuwait_quiz_enabled boolean,today_ai_used integer,today_chat_used integer,today_live_web_used integer,updated_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_bella_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  return query select c.live_web_enabled,c.games_enabled,c.radar_enabled,c.maintenance_enabled,c.announcement,c.ai_daily_limit,c.leaderboard_enabled,c.content_ai_enabled,c.wisdom_game_enabled,c.proverb_game_enabled,c.rumor_list_enabled,c.box_game_enabled,c.kuwait_quiz_enabled,coalesce(u.requests,0),coalesce(u.chat_requests,0),coalesce(u.live_web_requests,0),c.updated_at from public.bella_app_config c left join public.bella_ai_daily_usage u on u.usage_day=current_date where c.id=1;
end;
$$;
revoke all on function public.bella_owner_config() from public,anon;
grant execute on function public.bella_owner_config() to authenticated;

create or replace function public.bella_owner_update_config_v2(p_live_web_enabled boolean,p_games_enabled boolean,p_radar_enabled boolean,p_maintenance_enabled boolean,p_announcement text,p_ai_daily_limit integer,p_leaderboard_enabled boolean,p_content_ai_enabled boolean,p_wisdom_game_enabled boolean,p_proverb_game_enabled boolean,p_rumor_list_enabled boolean,p_box_game_enabled boolean,p_kuwait_quiz_enabled boolean)
returns table(live_web_enabled boolean,games_enabled boolean,radar_enabled boolean,maintenance_enabled boolean,announcement text,ai_daily_limit integer,leaderboard_enabled boolean,content_ai_enabled boolean,wisdom_game_enabled boolean,proverb_game_enabled boolean,rumor_list_enabled boolean,box_game_enabled boolean,kuwait_quiz_enabled boolean,today_ai_used integer,today_chat_used integer,today_live_web_used integer,updated_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare clean_announcement text:=left(trim(coalesce(p_announcement,'')),500); clean_limit integer:=greatest(0,least(coalesce(p_ai_daily_limit,0),100000));
begin
  if not public.is_bella_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  update public.bella_app_config set live_web_enabled=coalesce(p_live_web_enabled,live_web_enabled),games_enabled=coalesce(p_games_enabled,games_enabled),radar_enabled=coalesce(p_radar_enabled,radar_enabled),maintenance_enabled=coalesce(p_maintenance_enabled,maintenance_enabled),announcement=clean_announcement,ai_daily_limit=clean_limit,leaderboard_enabled=coalesce(p_leaderboard_enabled,leaderboard_enabled),content_ai_enabled=coalesce(p_content_ai_enabled,content_ai_enabled),wisdom_game_enabled=coalesce(p_wisdom_game_enabled,wisdom_game_enabled),proverb_game_enabled=coalesce(p_proverb_game_enabled,proverb_game_enabled),rumor_list_enabled=coalesce(p_rumor_list_enabled,rumor_list_enabled),box_game_enabled=coalesce(p_box_game_enabled,box_game_enabled),kuwait_quiz_enabled=coalesce(p_kuwait_quiz_enabled,kuwait_quiz_enabled),updated_at=now(),updated_by=auth.uid() where id=1;
  return query select * from public.bella_owner_config();
end;
$$;
revoke all on function public.bella_owner_update_config_v2(boolean,boolean,boolean,boolean,text,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean) from public,anon;
grant execute on function public.bella_owner_update_config_v2(boolean,boolean,boolean,boolean,text,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean) to authenticated;

create or replace function public.bella_owner_grant_xp(p_user_id uuid,p_amount integer,p_reason text default null) returns table(xp integer,level integer)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); amount integer:=greatest(1,least(coalesce(p_amount,0),5000)); old_xp integer; new_xp integer; new_level integer; why text:=nullif(left(trim(coalesce(p_reason,'')),240),'');
begin
  if not public.is_bella_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  if p_user_id is null or not exists(select 1 from public.bella_profiles p where p.user_id=p_user_id) then raise exception 'user not found' using errcode='22023'; end if;
  select p.xp into old_xp from public.bella_profiles p where p.user_id=p_user_id for update;
  new_xp:=greatest(0,coalesce(old_xp,0)+amount); new_level:=greatest(1,floor(new_xp/100.0)::integer+1);
  update public.bella_profiles set xp=new_xp,level=greatest(level,new_level),updated_at=now() where user_id=p_user_id;
  insert into public.bella_admin_audit(actor_user_id,target_user_id,action,old_value,new_value,reason) values(actor,p_user_id,'grant_xp',jsonb_build_object('xp',old_xp),jsonb_build_object('xp',new_xp,'amount',amount),why);
  return query select new_xp,new_level;
end;
$$;
revoke all on function public.bella_owner_grant_xp(uuid,integer,text) from public,anon;
grant execute on function public.bella_owner_grant_xp(uuid,integer,text) to authenticated;

create or replace function public.bella_owner_reset_ai_usage(p_reason text default null) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); old_usage jsonb;
begin
  if not public.is_bella_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  select to_jsonb(u) into old_usage from public.bella_ai_daily_usage u where u.usage_day=current_date;
  delete from public.bella_ai_daily_usage where usage_day=current_date;
  insert into public.bella_admin_audit(actor_user_id,target_user_id,action,old_value,new_value,reason) values(actor,actor,'reset_ai_usage',coalesce(old_usage,'{}'::jsonb),'{}'::jsonb,nullif(left(trim(coalesce(p_reason,'')),240),''));
  return true;
end;
$$;
revoke all on function public.bella_owner_reset_ai_usage(text) from public,anon;
grant execute on function public.bella_owner_reset_ai_usage(text) to authenticated;

create or replace function public.bella_get_game_leaderboard(p_scope text default 'weekly',p_limit integer default 20)
returns table(rank bigint,display_name text,score bigint,total_correct bigint,best_streak integer)
language sql stable security definer set search_path='public','pg_temp' as $$
  with scored as (select display_name,case when lower(coalesce(p_scope,'weekly'))='daily' and daily_date=current_date then daily_score::bigint when lower(coalesce(p_scope,'weekly'))='all' then xp_earned::bigint when week_start=date_trunc('week',current_date)::date then weekly_score::bigint else 0::bigint end as score,total_correct,best_streak from public.bella_game_scores)
  select row_number() over(order by score desc,total_correct desc,best_streak desc,display_name asc),display_name,score,total_correct,best_streak from scored where score>0 and coalesce((select leaderboard_enabled from public.bella_app_config where id=1),true)=true order by score desc,total_correct desc,best_streak desc,display_name asc limit greatest(1,least(coalesce(p_limit,20),50));
$$;
revoke all on function public.bella_get_game_leaderboard(text,integer) from public;
grant execute on function public.bella_get_game_leaderboard(text,integer) to anon,authenticated;
