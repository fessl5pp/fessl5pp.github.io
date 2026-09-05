drop policy if exists bella_moments_public_read on public.bella_moments;
drop policy if exists bella_moments_owner_read_all on public.bella_moments;

create policy bella_moments_anon_read_active
on public.bella_moments
for select
to anon
using (enabled = true and approved = true and (expires_at is null or expires_at > now()));

create policy bella_moments_authenticated_read
on public.bella_moments
for select
to authenticated
using ((enabled = true and approved = true and (expires_at is null or expires_at > now())) or (select private.bella_is_owner_v14()));
