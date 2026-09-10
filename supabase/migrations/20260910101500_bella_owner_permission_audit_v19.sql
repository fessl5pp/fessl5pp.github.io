create or replace function public.bella_owner_manage_user(p_user_id uuid,p_action text,p_value text default null,p_reason text default null)
returns table(account_status text,staff_role text,suspended_at timestamptz,suspended_reason text)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); act text:=lower(trim(coalesce(p_action,''))); val text:=lower(trim(coalesce(p_value,''))); why text:=nullif(left(trim(coalesce(p_reason,'')),240),''); old_row public.bella_account_admin%rowtype; new_row public.bella_account_admin%rowtype;
begin
 if not public.is_bella_owner() then raise exception 'owner access required' using errcode='42501'; end if;
 if p_user_id is null or not exists(select 1 from public.bella_profiles p where p.user_id=p_user_id) then raise exception 'user not found' using errcode='22023'; end if;
 if exists(select 1 from public.bella_owner_singleton o where o.slot=1 and o.user_id=p_user_id) then raise exception 'owner account cannot be modified here' using errcode='42501'; end if;
 insert into public.bella_account_admin(user_id) values(p_user_id) on conflict(user_id) do nothing;
 select * into old_row from public.bella_account_admin where user_id=p_user_id for update;
 if act='suspend' then
   update public.bella_account_admin set account_status='suspended',suspended_at=coalesce(suspended_at,now()),suspended_until=null,suspension_type='permanent',suspended_reason=why,updated_at=now() where user_id=p_user_id;
 elsif act='unsuspend' then
   update public.bella_account_admin set account_status='active',suspended_at=null,suspended_until=null,suspension_type='none',suspended_reason=null,updated_at=now() where user_id=p_user_id;
 elsif act='set_role' then
   if val not in ('user','moderator') then raise exception 'invalid role' using errcode='22023'; end if;
   update public.bella_account_admin set staff_role=val,updated_at=now() where user_id=p_user_id;
 else raise exception 'invalid owner action' using errcode='22023'; end if;
 select * into new_row from public.bella_account_admin where user_id=p_user_id;
 insert into public.bella_admin_audit(actor_user_id,target_user_id,action,old_value,new_value,reason)
 values(actor,p_user_id,act,
   jsonb_build_object('account_status',old_row.account_status,'staff_role',old_row.staff_role,'suspension_type',old_row.suspension_type,'suspended_until',old_row.suspended_until),
   jsonb_build_object('account_status',new_row.account_status,'staff_role',new_row.staff_role,'suspension_type',new_row.suspension_type,'suspended_until',new_row.suspended_until),why);
 return query select new_row.account_status,new_row.staff_role,new_row.suspended_at,new_row.suspended_reason;
end $$;
revoke all on function public.bella_owner_manage_user(uuid,text,text,text) from public,anon;
grant execute on function public.bella_owner_manage_user(uuid,text,text,text) to authenticated;

create or replace function public.bella_owner_ban_detail(p_user_id uuid)
returns table(account_status text,suspension_type text,suspended_at timestamptz,suspended_until timestamptz,suspended_reason text)
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_bella_owner() then raise exception 'owner access required' using errcode='42501'; end if;
 return query select coalesce(a.account_status,'active')::text,coalesce(a.suspension_type,'none')::text,a.suspended_at,a.suspended_until,a.suspended_reason
 from public.bella_profiles p left join public.bella_account_admin a on a.user_id=p.user_id where p.user_id=p_user_id;
end $$;
revoke all on function public.bella_owner_ban_detail(uuid) from public,anon;
grant execute on function public.bella_owner_ban_detail(uuid) to authenticated;
