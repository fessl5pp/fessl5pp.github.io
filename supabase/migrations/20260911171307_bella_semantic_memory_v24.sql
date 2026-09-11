create extension if not exists vector with schema extensions;

alter table public.bella_memories
  add column if not exists embedding extensions.vector(512),
  add column if not exists embedding_model text,
  add column if not exists embedded_at timestamptz,
  add column if not exists importance smallint not null default 60,
  add column if not exists last_recalled_at timestamptz,
  add column if not exists recall_count integer not null default 0,
  add column if not exists fts tsvector generated always as (to_tsvector('simple'::regconfig, coalesce(memory_text, ''))) stored;

alter table public.bella_memories
  drop constraint if exists bella_memories_importance_v24_check,
  add constraint bella_memories_importance_v24_check check (importance between 0 and 100),
  drop constraint if exists bella_memories_recall_count_v24_check,
  add constraint bella_memories_recall_count_v24_check check (recall_count >= 0);

create index if not exists bella_memories_fts_v24_idx on public.bella_memories using gin (fts);

create or replace function public.bella_memory_hybrid_search_v24(
  p_query_text text,
  p_query_embedding extensions.vector(512),
  p_match_count integer default 6
)
returns table(
  id uuid,
  memory_text text,
  category text,
  source text,
  updated_at timestamptz,
  importance integer,
  semantic_similarity double precision,
  keyword_rank double precision,
  recency_score double precision,
  hybrid_score double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  with eligible as (
    select
      m.id,
      m.memory_text,
      m.category,
      m.source,
      m.updated_at,
      m.importance,
      m.embedding,
      m.fts,
      greatest(
        0.20::double precision,
        1.0 / (1.0 + greatest(0.0, extract(epoch from (now() - m.updated_at)) / 86400.0) / 180.0)
      ) as recency_score,
      greatest(0.0, least(1.0, m.importance::double precision / 100.0)) as importance_score
    from public.bella_memories m
    where (select auth.uid()) is not null
      and m.user_id = (select auth.uid())
      and m.deleted_at is null
  ),
  query_parts as (
    select
      case
        when length(trim(coalesce(p_query_text, ''))) > 0
          then websearch_to_tsquery('simple'::regconfig, left(trim(p_query_text), 500))
        else null::tsquery
      end as q
  ),
  keyword as (
    select
      e.id,
      row_number() over (order by ts_rank_cd(e.fts, q.q) desc, e.updated_at desc) as rank_ix,
      ts_rank_cd(e.fts, q.q)::double precision as rank_score
    from eligible e
    cross join query_parts q
    where q.q is not null and e.fts @@ q.q
    order by rank_ix
    limit 24
  ),
  semantic as (
    select
      e.id,
      row_number() over (order by e.embedding OPERATOR(extensions.<=>) p_query_embedding asc, e.updated_at desc) as rank_ix,
      greatest(-1.0, least(1.0, 1.0 - (e.embedding OPERATOR(extensions.<=>) p_query_embedding)))::double precision as similarity
    from eligible e
    where e.embedding is not null and p_query_embedding is not null
    order by e.embedding OPERATOR(extensions.<=>) p_query_embedding asc, e.updated_at desc
    limit 24
  ),
  fused as (
    select
      e.*,
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
    f.id,
    f.memory_text,
    f.category,
    f.source,
    f.updated_at,
    f.importance::integer,
    f.semantic_similarity,
    f.keyword_rank_score as keyword_rank,
    f.recency_score,
    (
      (f.semantic_rrf * 0.64 + f.keyword_rrf * 0.36) *
      (0.80 + f.importance_score * 0.12 + f.recency_score * 0.08)
    )::double precision as hybrid_score
  from fused f
  where f.keyword_rank_ix is not null or f.semantic_similarity >= 0.22
  order by hybrid_score desc, f.semantic_similarity desc, f.updated_at desc
  limit greatest(1, least(coalesce(p_match_count, 6), 12));
$$;

revoke all on function public.bella_memory_hybrid_search_v24(text, extensions.vector, integer) from public, anon;
grant execute on function public.bella_memory_hybrid_search_v24(text, extensions.vector, integer) to authenticated;

comment on function public.bella_memory_hybrid_search_v24(text, extensions.vector, integer) is
  'Bella v24 user-scoped hybrid memory retrieval: exact keyword + semantic vector ranking with importance and temporal decay. SECURITY INVOKER; RLS remains authoritative.';
