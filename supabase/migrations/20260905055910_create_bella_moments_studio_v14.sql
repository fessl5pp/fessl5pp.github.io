create schema if not exists private;

create or replace function private.bella_is_owner_v14()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bella_owner_singleton o
    where o.slot = 1
      and o.user_id = (select auth.uid())
  );
$$;

revoke all on function private.bella_is_owner_v14() from public;
grant usage on schema private to authenticated;
grant execute on function private.bella_is_owner_v14() to authenticated;

create table public.bella_moments (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(btrim(text)) between 4 and 240),
  category text not null default 'normal' check (category in ('normal','cute','angry','chill','morning','evening','night','weekend','coffee','university','gaming','work','travel')),
  tier text not null default 'common' check (tier in ('common','rare','legendary')),
  source text not null default 'manual' check (source in ('manual','ai')),
  enabled boolean not null default true,
  approved boolean not null default false,
  pinned_until timestamptz,
  expires_at timestamptz,
  batch_id uuid,
  generation_meta jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index bella_moments_text_unique on public.bella_moments (lower(btrim(text)));
create index bella_moments_public_lookup_idx on public.bella_moments (enabled, approved, category, tier, created_at desc);
create index bella_moments_pinned_idx on public.bella_moments (pinned_until desc) where pinned_until is not null;
create index bella_moments_batch_idx on public.bella_moments (batch_id) where batch_id is not null;

alter table public.bella_moments enable row level security;
revoke all on table public.bella_moments from anon, authenticated;
grant select on table public.bella_moments to anon, authenticated;
grant insert, update, delete on table public.bella_moments to authenticated;

create policy bella_moments_public_read
on public.bella_moments
for select
to anon, authenticated
using (enabled = true and approved = true and (expires_at is null or expires_at > now()));

create policy bella_moments_owner_read_all
on public.bella_moments
for select
to authenticated
using ((select private.bella_is_owner_v14()));

create policy bella_moments_owner_insert
on public.bella_moments
for insert
to authenticated
with check ((select private.bella_is_owner_v14()) and (created_by is null or created_by = (select auth.uid())));

create policy bella_moments_owner_update
on public.bella_moments
for update
to authenticated
using ((select private.bella_is_owner_v14()))
with check ((select private.bella_is_owner_v14()));

create policy bella_moments_owner_delete
on public.bella_moments
for delete
to authenticated
using ((select private.bella_is_owner_v14()));

create table public.bella_moments_config (
  id smallint primary key default 1 check (id = 1),
  remote_enabled boolean not null default true,
  enabled_categories text[] not null default array['normal','cute','angry','chill','morning','evening','night','weekend','coffee','university','gaming','work','travel']::text[],
  rare_chance numeric(5,4) not null default 0.0950 check (rare_chance between 0 and 0.35),
  legendary_chance numeric(5,4) not null default 0.0180 check (legendary_chance between 0 and 0.10),
  global_intensity text not null default 'high' check (global_intensity in ('low','normal','high')),
  ai_fresh_enabled boolean not null default false,
  ai_auto_approve boolean not null default false,
  ai_batch_size smallint not null default 8 check (ai_batch_size between 4 and 12),
  ai_refresh_hours smallint not null default 24 check (ai_refresh_hours between 6 and 168),
  ai_max_daily_batches smallint not null default 2 check (ai_max_daily_batches between 1 and 6),
  ai_last_generated_at timestamptz,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

insert into public.bella_moments_config (id) values (1) on conflict (id) do nothing;
alter table public.bella_moments_config enable row level security;
revoke all on table public.bella_moments_config from anon, authenticated;
grant select on table public.bella_moments_config to anon, authenticated;
grant update on table public.bella_moments_config to authenticated;

create policy bella_moments_config_public_read on public.bella_moments_config for select to anon, authenticated using (id = 1);
create policy bella_moments_config_owner_update on public.bella_moments_config for update to authenticated
using ((select private.bella_is_owner_v14()))
with check (id = 1 and (select private.bella_is_owner_v14()) and enabled_categories <@ array['normal','cute','angry','chill','morning','evening','night','weekend','coffee','university','gaming','work','travel']::text[]);

create table public.bella_moment_batches (
  id uuid primary key,
  model text not null default 'gpt-5-mini',
  requested_count smallint not null check (requested_count between 1 and 12),
  accepted_count smallint not null default 0 check (accepted_count between 0 and 12),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index bella_moment_batches_created_idx on public.bella_moment_batches (created_at desc);
alter table public.bella_moment_batches enable row level security;
revoke all on table public.bella_moment_batches from anon, authenticated;
grant select, insert on table public.bella_moment_batches to authenticated;
create policy bella_moment_batches_owner_read on public.bella_moment_batches for select to authenticated using ((select private.bella_is_owner_v14()));
create policy bella_moment_batches_owner_insert on public.bella_moment_batches for insert to authenticated with check ((select private.bella_is_owner_v14()) and created_by = (select auth.uid()));
