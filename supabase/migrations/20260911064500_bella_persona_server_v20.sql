-- Bella v20 server-side persona runtime bridge.
-- Intentionally returns only the owner-authored persona overlay and phrase guardrails.
create or replace function public.bella_public_persona_server_v20()
returns table(
  enabled boolean,
  system_overlay text,
  blocked_phrases jsonb,
  revision integer,
  updated_at timestamptz
)
language sql stable security definer set search_path=''
as $$
  select p.enabled,p.system_overlay,p.blocked_phrases,p.revision,p.updated_at
  from public.bella_persona_runtime p
  where p.id=1;
$$;
revoke all on function public.bella_public_persona_server_v20() from public;
grant execute on function public.bella_public_persona_server_v20() to anon,authenticated;
