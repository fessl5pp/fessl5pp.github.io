-- Keep v20 rollback synchronized with the legacy boolean config used by v19 modules.
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
  values(actor,a.target_user_id,'v20_rollback',jsonb_build_object('audit_id',p_audit_id,'action',a.action),
         jsonb_build_object('restored',true),'Rollback from Ops OS v20');
  return true;
end
$$;
revoke all on function public.bella_owner_rollback_v20(bigint) from public,anon;
grant execute on function public.bella_owner_rollback_v20(bigint) to authenticated;
