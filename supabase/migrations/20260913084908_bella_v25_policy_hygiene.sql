-- Bella v25 policy hygiene: remove redundant permissive SELECT policies and avoid per-row auth evaluation.

-- Gifts: cache auth/owner checks once per statement via scalar subqueries.
drop policy if exists bella_user_gifts_self_select on public.bella_user_gifts;
create policy bella_user_gifts_self_select
on public.bella_user_gifts
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_bella_owner())
);

drop policy if exists bella_user_gifts_self_update on public.bella_user_gifts;
create policy bella_user_gifts_self_update
on public.bella_user_gifts
for update
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_bella_owner())
)
with check (
  user_id = (select auth.uid())
  or (select public.is_bella_owner())
);

-- Broadcasts: anon gets only active public rows; authenticated uses one combined SELECT policy.
drop policy if exists bella_broadcasts_owner_all on public.bella_broadcasts;
drop policy if exists bella_broadcasts_public_select on public.bella_broadcasts;
drop policy if exists bella_broadcasts_authenticated_select_v25 on public.bella_broadcasts;
drop policy if exists bella_broadcasts_owner_insert_v25 on public.bella_broadcasts;
drop policy if exists bella_broadcasts_owner_update_v25 on public.bella_broadcasts;
drop policy if exists bella_broadcasts_owner_delete_v25 on public.bella_broadcasts;

create policy bella_broadcasts_public_select
on public.bella_broadcasts
for select
to anon
using (
  enabled = true
  and starts_at <= now()
  and (expires_at is null or expires_at > now())
);

create policy bella_broadcasts_authenticated_select_v25
on public.bella_broadcasts
for select
to authenticated
using (
  (select public.is_bella_owner())
  or (
    enabled = true
    and starts_at <= now()
    and (expires_at is null or expires_at > now())
  )
);

create policy bella_broadcasts_owner_insert_v25
on public.bella_broadcasts
for insert
to authenticated
with check ((select public.is_bella_owner()));

create policy bella_broadcasts_owner_update_v25
on public.bella_broadcasts
for update
to authenticated
using ((select public.is_bella_owner()))
with check ((select public.is_bella_owner()));

create policy bella_broadcasts_owner_delete_v25
on public.bella_broadcasts
for delete
to authenticated
using ((select public.is_bella_owner()));

-- Content Studio: one SELECT policy per role/action while preserving owner visibility.
drop policy if exists bella_content_owner_select on public.bella_content_items;
drop policy if exists bella_content_public_select on public.bella_content_items;
drop policy if exists bella_content_authenticated_select_v25 on public.bella_content_items;

create policy bella_content_public_select
on public.bella_content_items
for select
to anon
using (status = 'approved' and enabled = true);

create policy bella_content_authenticated_select_v25
on public.bella_content_items
for select
to authenticated
using (
  (select public.is_bella_owner())
  or (status = 'approved' and enabled = true)
);
