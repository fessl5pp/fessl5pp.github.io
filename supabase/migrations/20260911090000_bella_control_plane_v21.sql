-- Bella v21 Control Plane
-- Percentage rollouts + scheduled feature windows + rollback support.

alter table public.bella_feature_flags
  add column if not exists rollout_percent smallint not null default 0,
  add column if not exists scheduled_mode text,
  add column if not exists scheduled_start timestamptz,
  add column if not exists scheduled_end timestamptz;

alter table public.bella_feature_flags
  drop constraint if exists bella_feature_flags_rollout_percent_check,
  add constraint bella_feature_flags_rollout_percent_check check (rollout_percent between 0 and 100),
  drop constraint if exists bella_feature_flags_scheduled_mode_check,
  add constraint bella_feature_flags_scheduled_mode_check check (scheduled_mode is null or scheduled_mode in ('off','beta','on')),
  drop constraint if exists bella_feature_flags_schedule_window_check,
  add constraint bella_feature_flags_schedule_window_check check (scheduled_end is null or scheduled_start is null or scheduled_end > scheduled_start);

create or replace function public.bella_public_ops_v21(p_subject text default null)
returns table(feature_flags jsonb, persona_style jsonb, current_season jsonb)
language sql stable security definer set search_path=''
as $$
  with identity_ctx as (
    select
      public.is_bella_owner() as is_owner,
      coalesce(auth.uid()::text, nullif(left(trim(coalesce(p_subject,'')),120),''), 'anonymous') as subject_key
  ),
  flag_rows as (
    select
      f.*,
      case
        when f.scheduled_mode is not null
          and f.scheduled_start is not null
          and now() >= f.scheduled_start
          and (f.scheduled_end is null or now() < f.scheduled_end)
        then f.scheduled_mode
        else f.mode
      end as active_mode,
      abs(mod(pg_catalog.hashtextextended((select subject_key from identity_ctx) || ':' || f.feature_key, 21)::numeric, 100))::integer as rollout_bucket
    from public.bella_feature_flags f
  ),
  flags as (
    select coalesce(jsonb_object_agg(
      r.feature_key,
      jsonb_build_object(
        'mode', r.active_mode,
        'base_mode', r.mode,
        'effective', case
          when r.active_mode='on' then true
          when r.active_mode='off' then false
          else ((select is_owner from identity_ctx) or r.rollout_bucket < r.rollout_percent)
        end,
        'label', r.label,
        'note', r.note,
        'rollout_percent', r.rollout_percent,
        'scheduled_mode', r.scheduled_mode,
        'scheduled_start', r.scheduled_start,
        'scheduled_end', r.scheduled_end,
        'rollout_bucket', case when (select is_owner from identity_ctx) then r.rollout_bucket else null end
      )
    ), '{}'::jsonb) value
    from flag_rows r
  ),
  persona as (
    select jsonb_build_object(
      'enabled',p.enabled,'brevity',p.brevity,'humor',p.humor,'warmth',p.warmth,
      'directness',p.directness,'dialect',p.dialect,'revision',p.revision,'updated_at',p.updated_at
    ) value
    from public.bella_persona_runtime p where p.id=1
  ),
  season as (
    select jsonb_build_object(
      'id',s.id,'name',s.name,'starts_at',s.starts_at,'ends_at',s.ends_at,'status',s.status
    ) value
    from public.bella_seasons s where s.status='active' order by s.id desc limit 1
  )
  select (select value from flags),
         coalesce((select value from persona),'{}'::jsonb),
         coalesce((select value from season),'{}'::jsonb);
$$;
revoke all on function public.bella_public_ops_v21(text) from public;
grant execute on function public.bella_public_ops_v21(text) to anon, authenticated;

create or replace function public.bella_owner_set_feature_rollout_v21(
  p_key text,
  p_percent integer,
  p_reason text default null
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  actor uuid:=auth.uid();
  k text:=lower(trim(coalesce(p_key,'')));
  pct integer:=greatest(0,least(coalesce(p_percent,0),100));
  oldv jsonb;
  rowv jsonb;
begin
  if not public.is_bella_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  select to_jsonb(f) into oldv from public.bella_feature_flags f where f.feature_key=k for update;
  if oldv is null then raise exception 'unknown feature flag' using errcode='22023'; end if;

  update public.bella_feature_flags
  set rollout_percent=pct,updated_by=actor,updated_at=now()
  where feature_key=k
  returning to_jsonb(bella_feature_flags) into rowv;

  insert into public.bella_admin_audit(actor_user_id,target_user_id,action,old_value,new_value,reason)
  values(actor,actor,'v21_feature_rollout',oldv,rowv,left(trim(coalesce(p_reason,'')),240));
  return rowv;
end
$$;
revoke all on function public.bella_owner_set_feature_rollout_v21(text,integer,text) from public,anon;
grant execute on function public.bella_owner_set_feature_rollout_v21(text,integer,text) to authenticated;

create or replace function public.bella_owner_schedule_feature_v21(
  p_key text,
  p_mode text,
  p_start timestamptz,
  p_end timestamptz default null,
  p_reason text default null
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  actor uuid:=auth.uid();
  k text:=lower(trim(coalesce(p_key,'')));
  m text:=lower(trim(coalesce(p_mode,'')));
  oldv jsonb;
  rowv jsonb;
begin
  if not public.is_bella_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  if m not in ('off','beta','on') then raise exception 'invalid mode' using errcode='22023'; end if;
  if p_start is null then raise exception 'schedule start required' using errcode='22023'; end if;
  if p_end is not null and p_end<=p_start then raise exception 'schedule end must be after start' using errcode='22023'; end if;
  select to_jsonb(f) into oldv from public.bella_feature_flags f where f.feature_key=k for update;
  if oldv is null then raise exception 'unknown feature flag' using errcode='22023'; end if;

  update public.bella_feature_flags
  set scheduled_mode=m,scheduled_start=p_start,scheduled_end=p_end,updated_by=actor,updated_at=now()
  where feature_key=k
  returning to_jsonb(bella_feature_flags) into rowv;

  insert into public.bella_admin_audit(actor_user_id,target_user_id,action,old_value,new_value,reason)
  values(actor,actor,'v21_feature_schedule',oldv,rowv,left(trim(coalesce(p_reason,'')),240));
  return rowv;
end
$$;
revoke all on function public.bella_owner_schedule_feature_v21(text,text,timestamptz,timestamptz,text) from public,anon;
grant execute on function public.bella_owner_schedule_feature_v21(text,text,timestamptz,timestamptz,text) to authenticated;

create or replace function public.bella_owner_clear_feature_schedule_v21(
  p_key text,
  p_reason text default null
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  actor uuid:=auth.uid();
  k text:=lower(trim(coalesce(p_key,'')));
  oldv jsonb;
  rowv jsonb;
begin
  if not public.is_bella_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  select to_jsonb(f) into oldv from public.bella_feature_flags f where f.feature_key=k for update;
  if oldv is null then raise exception 'unknown feature flag' using errcode='22023'; end if;

  update public.bella_feature_flags
  set scheduled_mode=null,scheduled_start=null,scheduled_end=null,updated_by=actor,updated_at=now()
  where feature_key=k
  returning to_jsonb(bella_feature_flags) into rowv;

  insert into public.bella_admin_audit(actor_user_id,target_user_id,action,old_value,new_value,reason)
  values(actor,actor,'v21_feature_schedule_clear',oldv,rowv,left(trim(coalesce(p_reason,'')),240));
  return rowv;
end
$$;
revoke all on function public.bella_owner_clear_feature_schedule_v21(text,text) from public,anon;
grant execute on function public.bella_owner_clear_feature_schedule_v21(text,text) to authenticated;

create or replace function public.bella_owner_rollback_v20(p_audit_id bigint)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare
  actor uuid:=auth.uid();
  a public.bella_admin_audit%rowtype;
  mid uuid;
  restored_key text;
  restored_mode text;
begin
  if not public.is_bella_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  select * into a from public.bella_admin_audit where id=p_audit_id for update;
  if a.id is null then raise exception 'audit row not found' using errcode='22023'; end if;
  if a.rolled_back_at is not null then raise exception 'already rolled back' using errcode='22023'; end if;

  if a.action='v20_feature_flag' then
    restored_key:=a.old_value->>'feature_key';
    restored_mode:=coalesce(a.old_value->>'mode','on');
    update public.bella_feature_flags
      set mode=restored_mode,
          note=coalesce(a.old_value->>'note',''),
          updated_by=actor,updated_at=now()
    where feature_key=restored_key;

    update public.bella_app_config set
      leaderboard_enabled=case when restored_key='leaderboard' then restored_mode<>'off' else leaderboard_enabled end,
      content_ai_enabled=case when restored_key='content_ai' then restored_mode<>'off' else content_ai_enabled end,
      wisdom_game_enabled=case when restored_key='wisdom_game' then restored_mode<>'off' else wisdom_game_enabled end,
      proverb_game_enabled=case when restored_key='proverb_game' then restored_mode<>'off' else proverb_game_enabled end,
      rumor_list_enabled=case when restored_key='rumor_list' then restored_mode<>'off' else rumor_list_enabled end,
      box_game_enabled=case when restored_key='box_game' then restored_mode<>'off' else box_game_enabled end,
      kuwait_quiz_enabled=case when restored_key='kuwait_quiz' then restored_mode<>'off' else kuwait_quiz_enabled end,
      chat_ai_enabled=case when restored_key='chat_ai' then restored_mode<>'off' else chat_ai_enabled end,
      voice_enabled=case when restored_key='voice' then restored_mode<>'off' else voice_enabled end,
      ai_activities_enabled=case when restored_key='ai_activities' then restored_mode<>'off' else ai_activities_enabled end,
      moments_enabled=case when restored_key='moments' then restored_mode<>'off' else moments_enabled end,
      updated_by=actor,updated_at=now()
    where id=1;
  elsif a.action in ('v21_feature_rollout','v21_feature_schedule','v21_feature_schedule_clear') then
    restored_key:=a.old_value->>'feature_key';
    update public.bella_feature_flags set
      rollout_percent=coalesce((a.old_value->>'rollout_percent')::integer,0),
      scheduled_mode=nullif(a.old_value->>'scheduled_mode',''),
      scheduled_start=case when a.old_value->>'scheduled_start' is null then null else (a.old_value->>'scheduled_start')::timestamptz end,
      scheduled_end=case when a.old_value->>'scheduled_end' is null then null else (a.old_value->>'scheduled_end')::timestamptz end,
      updated_by=actor,updated_at=now()
    where feature_key=restored_key;
  elsif a.action='v20_persona_update' then
    update public.bella_persona_runtime set
      enabled=coalesce((a.old_value->>'enabled')::boolean,true),
      system_overlay=coalesce(a.old_value->>'system_overlay',''),
      brevity=coalesce(a.old_value->>'brevity','medium'),
      humor=coalesce((a.old_value->>'humor')::integer,1),
      warmth=coalesce((a.old_value->>'warmth')::integer,1),
      directness=coalesce((a.old_value->>'directness')::numeric,.35),
      dialect=coalesce((a.old_value->>'dialect')::numeric,.80),
      blocked_phrases=coalesce(a.old_value->'blocked_phrases','[]'::jsonb),
      revision=revision+1,updated_by=actor,updated_at=now()
    where id=1;
  elsif a.action in ('v20_memory_update','v20_memory_delete') then
    mid=(a.old_value->>'id')::uuid;
    update public.bella_memories set
      memory_key=coalesce(a.old_value->>'memory_key',memory_key),
      memory_text=coalesce(a.old_value->>'memory_text',memory_text),
      category=coalesce(a.old_value->>'category',category),
      source=coalesce(a.old_value->>'source',source),
      deleted_at=case when a.old_value ? 'deleted_at' and a.old_value->>'deleted_at' is not null then (a.old_value->>'deleted_at')::timestamptz else null end,
      updated_at=now()
    where id=mid;
  else
    raise exception 'rollback not supported for this action' using errcode='22023';
  end if;

  update public.bella_admin_audit set rolled_back_at=now(),rolled_back_by=actor where id=p_audit_id;
  insert into public.bella_admin_audit(actor_user_id,target_user_id,action,old_value,new_value,reason)
  values(actor,a.target_user_id,'v20_rollback',jsonb_build_object('audit_id',p_audit_id,'action',a.action),jsonb_build_object('restored',true),'Rollback from Control Plane v21');
  return true;
end
$$;
revoke all on function public.bella_owner_rollback_v20(bigint) from public,anon;
grant execute on function public.bella_owner_rollback_v20(bigint) to authenticated;

create or replace function public.bella_owner_audit_v20(p_limit integer default 60,p_offset integer default 0)
returns table(
  id bigint,actor_user_id uuid,target_user_id uuid,target_display_name text,action text,
  old_value jsonb,new_value jsonb,reason text,created_at timestamptz,rolled_back_at timestamptz,
  rollback_available boolean,total_count bigint
)
language plpgsql stable security definer set search_path=''
as $$
declare lim integer:=greatest(1,least(coalesce(p_limit,60),100)); off integer:=greatest(0,coalesce(p_offset,0));
begin
  if not public.is_bella_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  return query
  select a.id,a.actor_user_id,a.target_user_id,coalesce(p.display_name,'مستخدم')::text,a.action,
         a.old_value,a.new_value,a.reason,a.created_at,a.rolled_back_at,
         (a.rolled_back_at is null and a.action in ('v20_feature_flag','v20_persona_update','v20_memory_update','v20_memory_delete','v21_feature_rollout','v21_feature_schedule','v21_feature_schedule_clear')) as rollback_available,
         count(*) over()::bigint
  from public.bella_admin_audit a
  left join public.bella_profiles p on p.user_id=a.target_user_id
  order by a.created_at desc
  limit lim offset off;
end
$$;
revoke all on function public.bella_owner_audit_v20(integer,integer) from public,anon;
grant execute on function public.bella_owner_audit_v20(integer,integer) to authenticated;
