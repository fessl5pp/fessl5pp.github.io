-- Separate public read from owner management so anonymous reads never depend on owner-table visibility.
drop policy if exists bella_content_public_or_owner_select on public.bella_content_items;
drop policy if exists bella_content_public_select on public.bella_content_items;
drop policy if exists bella_content_owner_select on public.bella_content_items;
create policy bella_content_public_select on public.bella_content_items for select to anon, authenticated using (status='approved' and enabled=true);
create policy bella_content_owner_select on public.bella_content_items for select to authenticated using (public.is_bella_owner());

drop policy if exists bella_content_owner_insert on public.bella_content_items;
create policy bella_content_owner_insert on public.bella_content_items for insert to authenticated with check (public.is_bella_owner());
drop policy if exists bella_content_owner_update on public.bella_content_items;
create policy bella_content_owner_update on public.bella_content_items for update to authenticated using (public.is_bella_owner()) with check (public.is_bella_owner());
drop policy if exists bella_content_owner_delete on public.bella_content_items;
create policy bella_content_owner_delete on public.bella_content_items for delete to authenticated using (public.is_bella_owner());
