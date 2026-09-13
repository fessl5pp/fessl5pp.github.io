alter table public.bella_memories
  add column if not exists topic_key text,
  add column if not exists polarity smallint not null default 0,
  add column if not exists confidence smallint not null default 80,
  add column if not exists first_seen_at timestamptz not null default now(),
  add column if not exists last_confirmed_at timestamptz not null default now(),
  add column if not exists superseded_at timestamptz,
  add column if not exists superseded_by uuid,
  add column if not exists superseded_reason text,
  add column if not exists memory_version smallint not null default 4;

alter table public.bella_memories
  drop constraint if exists bella_memories_polarity_v30_check,
  add constraint bella_memories_polarity_v30_check check (polarity between -1 and 1),
  drop constraint if exists bella_memories_confidence_v30_check,
  add constraint bella_memories_confidence_v30_check check (confidence between 0 and 100),
  drop constraint if exists bella_memories_memory_version_v30_check,
  add constraint bella_memories_memory_version_v30_check check (memory_version between 1 and 30),
  drop constraint if exists bella_memories_superseded_reason_v30_check,
  add constraint bella_memories_superseded_reason_v30_check check (superseded_reason is null or superseded_reason in ('contradiction','near-duplicate','user-replaced'));

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

create or replace function public.bella_memory_mark_recalled_v30(p_ids uuid[])
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer := 0;
begin
  if auth.uid() is null or coalesce(array_length(p_ids, 1), 0) = 0 then
    return 0;
  end if;

  update public.bella_memories m
     set recall_count = least(1000000, m.recall_count + 1),
         last_recalled_at = now()
   where m.user_id = auth.uid()
     and m.deleted_at is null
     and m.superseded_at is null
     and m.id = any(p_ids[1:12]);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.bella_memory_mark_recalled_v30(uuid[]) from public, anon;
grant execute on function public.bella_memory_mark_recalled_v30(uuid[]) to authenticated;

create or replace function public.bella_memory_hybrid_search_v30(
  p_query_text text,
  p_query_embedding extensions.vector(512),
  p_match_count integer default 8
)
returns table(
  id uuid,
  memory_text text,
  category text,
  source text,
  topic_key text,
  polarity smallint,
  updated_at timestamptz,
  last_confirmed_at timestamptz,
  last_recalled_at timestamptz,
  recall_count integer,
  importance integer,
  confidence integer,
  semantic_similarity double precision,
  keyword_rank double precision,
  recency_score double precision,
  reinforcement_score double precision,
  hybrid_score double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  with eligible as (
    select
      m.id, m.memory_text, m.category, m.source, m.topic_key, m.polarity,
      m.updated_at, m.last_confirmed_at, m.last_recalled_at, m.recall_count,
      m.importance, m.confidence, m.embedding, m.fts,
      greatest(
        0.25::double precision,
        1.0 / (
          1.0 + greatest(0.0, extract(epoch from (now() - coalesce(m.last_confirmed_at, m.updated_at))) / 86400.0)
          / case when m.category in ('identity','preference','education','work') then 540.0 else 240.0 end
        )
      ) as recency_score,
      greatest(0.0, least(1.0, m.importance::double precision / 100.0)) as importance_score,
      greatest(0.0, least(1.0, m.confidence::double precision / 100.0)) as confidence_score,
      least(1.0, ln(1.0 + greatest(0, m.recall_count)::double precision) / ln(21.0)) as reinforcement_score
    from public.bella_memories m
    where auth.uid() is not null
      and m.user_id = auth.uid()
      and m.deleted_at is null
      and m.superseded_at is null
  ),
  query_parts as (
    select case
      when length(trim(coalesce(p_query_text, ''))) > 0
        then websearch_to_tsquery('simple'::regconfig, left(trim(p_query_text), 500))
      else null::tsquery
    end as q
  ),
  keyword as (
    select e.id,
      row_number() over (order by ts_rank_cd(e.fts, q.q) desc, e.last_confirmed_at desc) as rank_ix,
      ts_rank_cd(e.fts, q.q)::double precision as rank_score
    from eligible e
    cross join query_parts q
    where q.q is not null and e.fts @@ q.q
    order by rank_ix
    limit 32
  ),
  semantic as (
    select e.id,
      row_number() over (order by e.embedding OPERATOR(extensions.<=>) p_query_embedding asc, e.last_confirmed_at desc) as rank_ix,
      greatest(-1.0, least(1.0, 1.0 - (e.embedding OPERATOR(extensions.<=>) p_query_embedding)))::double precision as similarity
    from eligible e
    where e.embedding is not null and p_query_embedding is not null
    order by e.embedding OPERATOR(extensions.<=>) p_query_embedding asc, e.last_confirmed_at desc
    limit 32
  ),
  fused as (
    select e.*,
      k.rank_ix as keyword_rank_ix,
      coalesce(k.rank_score, 0.0) as keyword_rank_score,
      s.rank_ix as semantic_rank_ix,
      coalesce(s.similarity, 0.0) as semantic_similarity,
      coalesce(1.0 / (50.0 + k.rank_ix::double precision), 0.0) as keyword_rrf,
      coalesce(1.0 / (50.0 + s.rank_ix::double precision), 0.0) as semantic_rrf
    from eligible e
    left join keyword k on k.id = e.id
    left join semantic s on s.id = e.id
    where k.id is not null or s.id is not null
  )
  select
    f.id, f.memory_text, f.category, f.source, f.topic_key, f.polarity,
    f.updated_at, f.last_confirmed_at, f.last_recalled_at, f.recall_count,
    f.importance::integer, f.confidence::integer, f.semantic_similarity,
    f.keyword_rank_score as keyword_rank, f.recency_score, f.reinforcement_score,
    (
      (f.semantic_rrf * 0.62 + f.keyword_rrf * 0.38) *
      (0.72 + f.importance_score * 0.10 + f.confidence_score * 0.10 +
       f.recency_score * 0.06 + f.reinforcement_score * 0.02)
    )::double precision as hybrid_score
  from fused f
  where f.keyword_rank_ix is not null or f.semantic_similarity >= 0.20
  order by hybrid_score desc, f.confidence_score desc, f.semantic_similarity desc, f.last_confirmed_at desc
  limit greatest(1, least(coalesce(p_match_count, 8), 12));
$$;

revoke all on function public.bella_memory_hybrid_search_v30(text, extensions.vector, integer) from public, anon;
grant execute on function public.bella_memory_hybrid_search_v30(text, extensions.vector, integer) to authenticated;

comment on function public.bella_memory_save_v30(text,text,text,text,smallint,smallint,smallint) is
  'Bella v30 explicit durable memory writer. User-scoped via RLS; reconfirms exact facts and supersedes same-topic contradictions/near-duplicates without storing inferred facts.';
comment on function public.bella_memory_hybrid_search_v30(text, extensions.vector, integer) is
  'Bella v30 hybrid retrieval using semantic+keyword relevance, confidence, importance, confirmation recency and bounded recall reinforcement. SECURITY INVOKER and RLS authoritative.';
comment on function public.bella_memory_mark_recalled_v30(uuid[]) is
  'Bella v30 user-scoped recall reinforcement. Marks only the authenticated user active memories; no text or identity aggregation.';