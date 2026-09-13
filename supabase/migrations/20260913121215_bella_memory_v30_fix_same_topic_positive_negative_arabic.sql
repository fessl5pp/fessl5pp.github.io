create or replace function public.bella_memory_save_v30(
  p_memory_text text,
  p_category text default 'general',
  p_source text default 'user',
  p_topic_key text default null,
  p_polarity smallint default 0,
  p_importance smallint default 70,
  p_confidence smallint default 92
)
returns table(
  id uuid,
  memory_text text,
  memory_key text,
  topic_key text,
  polarity smallint,
  importance smallint,
  confidence smallint,
  last_confirmed_at timestamptz,
  superseded_count integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_text text;
  v_key text;
  v_topic text;
  v_category text;
  v_source text;
  v_polarity smallint := greatest(-1, least(1, coalesce(p_polarity, 0)));
  v_importance smallint := greatest(20, least(100, coalesce(p_importance, 70)));
  v_confidence smallint := greatest(50, least(100, coalesce(p_confidence, 92)));
  v_id uuid;
  v_superseded integer := 0;
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  v_text := left(regexp_replace(trim(coalesce(p_memory_text, '')), '\s+', ' ', 'g'), 160);
  if length(v_text) < 3 then
    raise exception 'memory too short';
  end if;

  if lower(v_text) ~ '(كلمة مرور|كلمه مرور|باسورد|password|رقم مدني|civil[ -]?id|حساب بنكي|iban|بطاقة بنكية|بطاقه بنكيه|تشخيص|دواء|علاج|مرض|سرطان|دين|مذهب|طائفة|طائفه|حزب|سياس|جنس|sex|secret)' then
    raise exception 'sensitive memory is not allowed';
  end if;

  v_key := lower(v_text);
  v_key := translate(v_key, 'أإآةى', 'اااهي');
  v_key := regexp_replace(v_key, '[؟?!.,،؛:]+', ' ', 'g');
  v_key := left(regexp_replace(trim(v_key), '\s+', ' ', 'g'), 180);

  v_topic := nullif(left(regexp_replace(trim(lower(coalesce(p_topic_key, ''))), '\s+', ' ', 'g'), 120), '');
  v_category := case when lower(coalesce(p_category, '')) in ('gaming','food','places','preference','identity','education','work','general') then lower(p_category) else 'general' end;
  v_source := case when lower(coalesce(p_source, '')) in ('user','bella','import') then lower(p_source) else 'user' end;

  insert into public.bella_memories (
    user_id, memory_key, memory_text, category, source, deleted_at,
    importance, topic_key, polarity, confidence, first_seen_at,
    last_confirmed_at, superseded_at, superseded_by, superseded_reason,
    memory_version, updated_at
  ) values (
    v_uid, v_key, v_text, v_category, v_source, null,
    v_importance, v_topic, v_polarity, v_confidence, now(),
    now(), null, null, null, 5, now()
  )
  on conflict (user_id, memory_key) do update set
    memory_text = excluded.memory_text,
    category = excluded.category,
    source = excluded.source,
    deleted_at = null,
    importance = greatest(public.bella_memories.importance, excluded.importance),
    topic_key = coalesce(excluded.topic_key, public.bella_memories.topic_key),
    polarity = excluded.polarity,
    confidence = least(100, greatest(public.bella_memories.confidence, excluded.confidence) + 4),
    last_confirmed_at = now(),
    superseded_at = null,
    superseded_by = null,
    superseded_reason = null,
    memory_version = 5,
    updated_at = now()
  returning public.bella_memories.id into v_id;

  if v_topic is not null then
    update public.bella_memories m
       set deleted_at = coalesce(m.deleted_at, now()),
           superseded_at = now(),
           superseded_by = v_id,
           superseded_reason = case
             when v_polarity <> 0 and m.polarity <> 0 and m.polarity <> v_polarity then 'contradiction'
             else 'near-duplicate'
           end,
           updated_at = now()
     where m.user_id = v_uid
       and m.id <> v_id
       and m.deleted_at is null
       and m.superseded_at is null
       and m.topic_key = v_topic
       and (
         (v_polarity <> 0 and m.polarity <> 0 and m.polarity <> v_polarity)
         or (m.polarity = v_polarity and m.memory_key <> v_key)
       );
    get diagnostics v_superseded = row_count;
  end if;

  return query
  select m.id, m.memory_text, m.memory_key, m.topic_key, m.polarity,
         m.importance, m.confidence, m.last_confirmed_at, v_superseded
    from public.bella_memories m
   where m.id = v_id and m.user_id = v_uid;
end;
$$;

revoke all on function public.bella_memory_save_v30(text,text,text,text,smallint,smallint,smallint) from public, anon;
grant execute on function public.bella_memory_save_v30(text,text,text,text,smallint,smallint,smallint) to authenticated;
