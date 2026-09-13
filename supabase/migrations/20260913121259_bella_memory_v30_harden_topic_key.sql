update public.bella_memories
set topic_key = null
where topic_key is not null and length(topic_key) > 120;

alter table public.bella_memories
  drop constraint if exists bella_memories_topic_key_v30_check;

alter table public.bella_memories
  add constraint bella_memories_topic_key_v30_check
  check (topic_key is null or length(topic_key) <= 120);
