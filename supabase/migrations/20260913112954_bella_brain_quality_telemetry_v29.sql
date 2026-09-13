create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.bella_brain_quality_v29 (
  metric_date date not null,
  task_kind text not null,
  model_tier text not null,
  critic_outcome text not null,
  verification_mode text not null,
  confidence_tier text not null,
  live_web boolean not null,
  correction_flag boolean not null,
  fallback_used boolean not null,
  result_kind text not null,
  latency_bucket text not null,
  event_count bigint not null default 0,
  total_latency_ms bigint not null default 0,
  total_critic_latency_ms bigint not null default 0,
  critic_applied_count bigint not null default 0,
  fallback_count bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (
    metric_date, task_kind, model_tier, critic_outcome, verification_mode,
    confidence_tier, live_web, correction_flag, fallback_used, result_kind, latency_bucket
  ),
  constraint bella_brain_quality_v29_event_count_check check (event_count >= 0 and event_count <= 50000),
  constraint bella_brain_quality_v29_latency_check check (total_latency_ms >= 0),
  constraint bella_brain_quality_v29_critic_latency_check check (total_critic_latency_ms >= 0),
  constraint bella_brain_quality_v29_critic_applied_check check (critic_applied_count >= 0),
  constraint bella_brain_quality_v29_fallback_count_check check (fallback_count >= 0)
);

alter table private.bella_brain_quality_v29 enable row level security;
revoke all on private.bella_brain_quality_v29 from public, anon, authenticated;

create or replace function public.bella_record_brain_quality_v29(
  p_task_kind text,
  p_model_tier text,
  p_critic_outcome text,
  p_verification_mode text,
  p_confidence_tier text,
  p_live_web boolean,
  p_correction_flag boolean,
  p_fallback_used boolean,
  p_result_kind text,
  p_latency_ms integer,
  p_critic_latency_ms integer default 0
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_date date := (timezone('utc', now()))::date;
  v_task text;
  v_model text;
  v_critic text;
  v_verification text;
  v_confidence text;
  v_result text;
  v_bucket text;
  v_latency integer := greatest(0, least(coalesce(p_latency_ms, 0), 120000));
  v_critic_latency integer := greatest(0, least(coalesce(p_critic_latency_ms, 0), 60000));
  v_total bigint;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return false;
  end if;

  v_task := case when p_task_kind in ('social','transform','technical','technical-analysis','analysis','explanation','followup','knowledge') then p_task_kind else 'knowledge' end;
  v_model := case when p_model_tier in ('luna','terra','sol','unknown') then p_model_tier else 'unknown' end;
  v_critic := case when p_critic_outcome in ('not-selected','kept','revised','critic-timeout','critic-error','critic-http','unavailable','invalid-review','not-run') then p_critic_outcome else 'not-run' end;
  v_verification := case when p_verification_mode in ('web','self-check','context-check','light') then p_verification_mode else 'light' end;
  v_confidence := case when p_confidence_tier in ('high','medium','low','unknown') then p_confidence_tier else 'unknown' end;
  v_result := case when p_result_kind in ('success','client-error','rate-limited','control-block','upstream-error','timeout','server-error') then p_result_kind else 'server-error' end;
  v_bucket := case
    when v_latency < 1000 then 'lt1s'
    when v_latency < 3000 then '1-3s'
    when v_latency < 8000 then '3-8s'
    when v_latency < 15000 then '8-15s'
    else '15s+'
  end;

  select coalesce(sum(q.event_count), 0)
    into v_total
    from private.bella_brain_quality_v29 q
   where q.metric_date = v_date;
  if v_total >= 200000 then
    return false;
  end if;

  insert into private.bella_brain_quality_v29 (
    metric_date, task_kind, model_tier, critic_outcome, verification_mode,
    confidence_tier, live_web, correction_flag, fallback_used, result_kind,
    latency_bucket, event_count, total_latency_ms, total_critic_latency_ms,
    critic_applied_count, fallback_count, updated_at
  ) values (
    v_date, v_task, v_model, v_critic, v_verification,
    v_confidence, coalesce(p_live_web, false), coalesce(p_correction_flag, false),
    coalesce(p_fallback_used, false), v_result, v_bucket, 1, v_latency,
    v_critic_latency, case when v_critic = 'revised' then 1 else 0 end,
    case when coalesce(p_fallback_used, false) then 1 else 0 end, now()
  )
  on conflict (
    metric_date, task_kind, model_tier, critic_outcome, verification_mode,
    confidence_tier, live_web, correction_flag, fallback_used, result_kind, latency_bucket
  ) do update set
    event_count = least(50000, private.bella_brain_quality_v29.event_count + 1),
    total_latency_ms = private.bella_brain_quality_v29.total_latency_ms + excluded.total_latency_ms,
    total_critic_latency_ms = private.bella_brain_quality_v29.total_critic_latency_ms + excluded.total_critic_latency_ms,
    critic_applied_count = private.bella_brain_quality_v29.critic_applied_count + excluded.critic_applied_count,
    fallback_count = private.bella_brain_quality_v29.fallback_count + excluded.fallback_count,
    updated_at = now();

  return true;
end;
$$;

revoke all on function public.bella_record_brain_quality_v29(text,text,text,text,text,boolean,boolean,boolean,text,integer,integer) from public, anon;
grant execute on function public.bella_record_brain_quality_v29(text,text,text,text,text,boolean,boolean,boolean,text,integer,integer) to authenticated;

create or replace function public.bella_owner_brain_quality_v29(p_days integer default 14)
returns table (
  metric_date date,
  task_kind text,
  model_tier text,
  critic_outcome text,
  verification_mode text,
  confidence_tier text,
  live_web boolean,
  correction_flag boolean,
  fallback_used boolean,
  result_kind text,
  latency_bucket text,
  event_count bigint,
  total_latency_ms bigint,
  total_critic_latency_ms bigint,
  critic_applied_count bigint,
  fallback_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 14), 90));
begin
  if not public.is_bella_owner() then
    raise exception 'forbidden';
  end if;

  return query
  select
    q.metric_date, q.task_kind, q.model_tier, q.critic_outcome,
    q.verification_mode, q.confidence_tier, q.live_web, q.correction_flag,
    q.fallback_used, q.result_kind, q.latency_bucket, q.event_count,
    q.total_latency_ms, q.total_critic_latency_ms, q.critic_applied_count,
    q.fallback_count
  from private.bella_brain_quality_v29 q
  where q.metric_date >= ((timezone('utc', now()))::date - (v_days - 1))
  order by q.metric_date desc, q.event_count desc;
end;
$$;

revoke all on function public.bella_owner_brain_quality_v29(integer) from public, anon;
grant execute on function public.bella_owner_brain_quality_v29(integer) to authenticated;