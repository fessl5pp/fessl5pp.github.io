create table if not exists public.bella_quality_metrics_v23 (
  metric_date date not null default ((timezone('Asia/Kuwait', now()))::date),
  signal_kind text not null check (signal_kind in ('explicit_wrong','clarification','negation','correction')),
  relationship_stage text not null check (relationship_stage in ('new','familiar','friends','close')),
  familiarity_bucket smallint not null check (familiarity_bucket between 0 and 4),
  warmth_bucket smallint not null check (warmth_bucket between 0 and 4),
  playfulness_bucket smallint not null check (playfulness_bucket between 0 and 4),
  event_count bigint not null default 0 check (event_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (metric_date, signal_kind, relationship_stage, familiarity_bucket, warmth_bucket, playfulness_bucket)
);

alter table public.bella_quality_metrics_v23 enable row level security;
revoke all on table public.bella_quality_metrics_v23 from anon, authenticated;

create or replace function public.bella_record_quality_metric_v23(
  p_signal_kind text,
  p_relationship_stage text default 'new',
  p_familiarity_bucket integer default 0,
  p_warmth_bucket integer default 0,
  p_playfulness_bucket integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text := lower(coalesce(p_signal_kind, 'correction'));
  v_stage text := lower(coalesce(p_relationship_stage, 'new'));
  v_f smallint := greatest(0, least(4, coalesce(p_familiarity_bucket, 0)))::smallint;
  v_w smallint := greatest(0, least(4, coalesce(p_warmth_bucket, 0)))::smallint;
  v_p smallint := greatest(0, least(4, coalesce(p_playfulness_bucket, 0)))::smallint;
  v_day date := (timezone('Asia/Kuwait', now()))::date;
begin
  if v_kind not in ('explicit_wrong','clarification','negation','correction') then v_kind := 'correction'; end if;
  if v_stage not in ('new','familiar','friends','close') then v_stage := 'new'; end if;

  insert into public.bella_quality_metrics_v23(
    metric_date, signal_kind, relationship_stage,
    familiarity_bucket, warmth_bucket, playfulness_bucket, event_count, updated_at
  ) values (v_day, v_kind, v_stage, v_f, v_w, v_p, 1, now())
  on conflict (metric_date, signal_kind, relationship_stage, familiarity_bucket, warmth_bucket, playfulness_bucket)
  do update set event_count = least(public.bella_quality_metrics_v23.event_count + 1, 1000000), updated_at = now();

  return jsonb_build_object('ok', true, 'day', v_day, 'signal_kind', v_kind);
end;
$$;

revoke all on function public.bella_record_quality_metric_v23(text,text,integer,integer,integer) from public;
grant execute on function public.bella_record_quality_metric_v23(text,text,integer,integer,integer) to anon, authenticated;

create or replace function public.bella_owner_quality_metrics_v23(p_days integer default 14)
returns table(metric_date date, signal_kind text, relationship_stage text, familiarity_bucket smallint, warmth_bucket smallint, playfulness_bucket smallint, event_count bigint, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce(public.is_bella_owner(), false) then raise exception 'owner_only' using errcode = '42501'; end if;
  return query
  select q.metric_date, q.signal_kind, q.relationship_stage, q.familiarity_bucket, q.warmth_bucket, q.playfulness_bucket, q.event_count, q.updated_at
  from public.bella_quality_metrics_v23 q
  where q.metric_date >= (timezone('Asia/Kuwait', now()))::date - (greatest(1, least(90, coalesce(p_days, 14))) - 1)
  order by q.metric_date desc, q.event_count desc;
end;
$$;

revoke all on function public.bella_owner_quality_metrics_v23(integer) from public, anon;
grant execute on function public.bella_owner_quality_metrics_v23(integer) to authenticated;

comment on table public.bella_quality_metrics_v23 is 'Bella v23 privacy-minimal aggregate correction metrics. No raw user text or identifiers are stored.';
