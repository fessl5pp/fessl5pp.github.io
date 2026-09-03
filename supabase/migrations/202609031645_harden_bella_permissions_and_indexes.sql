-- Bella v10 production hardening.
-- Applied to Supabase project buxicnxkhaalwzjmbkgv on 2026-09-03.
-- Keep browser privileges narrow, protect internal/owner RPC surfaces,
-- and index foreign keys used by administration/audit workflows.

revoke truncate, references, trigger on table public.bella_profiles from authenticated;
revoke truncate, references, trigger on table public.bella_memories from authenticated;

revoke execute on function public.assign_first_bella_owner() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

revoke execute on function public.is_bella_owner() from anon;
revoke execute on function public.bella_owner_config() from anon;
revoke execute on function public.bella_owner_summary() from anon;
revoke execute on function public.bella_owner_update_config(boolean, boolean, boolean, boolean, text, integer) from anon;
revoke execute on function public.bella_owner_users(text, integer, integer) from anon;

create index if not exists bella_admin_audit_actor_user_id_idx
  on public.bella_admin_audit(actor_user_id);

create index if not exists bella_app_config_updated_by_idx
  on public.bella_app_config(updated_by)
  where updated_by is not null;
