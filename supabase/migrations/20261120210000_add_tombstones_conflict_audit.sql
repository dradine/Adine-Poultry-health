-- Run transactionally after the reference schema migration.
do $$
declare t text;
begin
  foreach t in array array['flocks','model_runs','flock_vaccination_events','flock_clinical_observations','flock_time_series'] loop
    execute format('alter table public.%I add column revision uuid not null default %L, add column deleted_at timestamptz', t,'00000000-0000-0000-0000-000000000000');
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
end $$;
alter table public.model_runs add column updated_at timestamptz;
revoke all on public.flock_audit_events from public, anon, authenticated;
grant select on public.flock_audit_events to authenticated;
-- Protect history and children from physical deletion of the parent.
alter table public.flock_audit_events drop constraint flock_audit_events_flock_id_fkey,
  add foreign key(flock_id) references public.flocks(id) on delete restrict;

create function public.apply_flock_change(p_table text,p_id uuid,p_base uuid,p_mutation uuid,p_operation text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog as $$
declare
  actor uuid := auth.uid();
  parent uuid;
  kind text;
  previous jsonb;
  result jsonb;
  receipt public.flock_audit_events;
  changes jsonb;
  cols text;
  vals text;
  action_name text;
  dependent boolean;
begin
  kind := case p_table when 'flocks' then 'flock' when 'model_runs' then 'model_run'
    when 'flock_vaccination_events' then 'vaccination_event' when 'flock_clinical_observations' then 'clinical_observation'
    when 'flock_time_series' then 'time_series' end;
  if actor is null or kind is null or p_id is null or p_mutation is null or p_operation is null
    or p_operation not in ('upsert','delete','restore') or jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'Invalid change'; end if;
  parent := case when kind='flock' then p_id else (p_payload->>'flock_id')::uuid end;
  if parent is null then raise exception 'Flock required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(parent::text,0));
  select * into receipt from public.flock_audit_events where id=p_mutation and owner_id=actor;
  if found then
    if receipt.entity_id<>p_id or receipt.entity_type<>kind or receipt.flock_id<>parent then raise exception 'Receipt mismatch'; end if;
    return to_jsonb(receipt);
  end if;
  if kind<>'flock' and not exists(select from public.flocks where id=parent and owner_id=actor and deleted_at is null)
    then raise exception 'Active owned flock required'; end if;
  execute format('select to_jsonb(t) from public.%I t where id=$1 and owner_id=$2 for update',p_table)
    into previous using p_id,actor;
  if previous is not null and kind<>'flock' and previous->>'flock_id'<>parent::text then raise exception 'Parent mismatch'; end if;
  if previous is null and (p_base is not null or p_operation<>'upsert') then raise exception 'Missing owned record'; end if;
  changes := p_payload - array['id','owner_id','flock_id','revision','created_at','updated_at','deleted_at','syncState','deleted'];
  if previous is null then
    changes := changes || jsonb_build_object('id',p_id,'owner_id',actor,'created_at',coalesce((p_payload->>'created_at')::timestamptz,now()),'updated_at',now(),'revision',p_mutation);
    if kind<>'flock' then changes := changes || jsonb_build_object('flock_id',parent); end if;
    execute format('insert into public.%1$I as t select * from jsonb_populate_record(null::public.%1$I,$1) returning to_jsonb(t)',p_table)
      into result using changes;
    action_name := 'create';
  elsif (previous->>'revision')::uuid is distinct from p_base
    or (previous->>'deleted_at' is not null) <> (p_operation='restore')
    or (kind='model_run' and p_operation='upsert') then
    action_name := 'conflict';
  else
    if kind='flock' and p_operation='delete' then
      select exists(select from public.model_runs where flock_id=parent and deleted_at is null
        union all select from public.flock_time_series where flock_id=parent and deleted_at is null
        union all select from public.flock_clinical_observations where flock_id=parent and deleted_at is null
        union all select from public.flock_vaccination_events where flock_id=parent and deleted_at is null
        union all select from public.serology_batches where flock_id=parent) into dependent;
      if dependent then action_name := 'conflict'; end if;
    end if;
    if action_name is null then
      if p_operation<>'upsert' then changes := jsonb_build_object('deleted_at',case when p_operation='delete' then now() end); end if;
      changes := changes || jsonb_build_object('revision',p_mutation,'updated_at',now());
      select string_agg(format('%I',key),',' order by key), string_agg(format('v.%I',key),',' order by key)
        into cols,vals from jsonb_object_keys(changes) key;
      execute format('update public.%1$I as t set (%2$s)=(select %3$s from jsonb_populate_record(t,$1) v) where id=$2 and owner_id=$3 returning to_jsonb(t)',p_table,cols,vals)
        into result using changes,p_id,actor;
      action_name := case when p_operation='upsert' then 'update' else p_operation end;
    end if;
  end if;
  insert into public.flock_audit_events(id,owner_id,flock_id,entity_type,entity_id,action,before_snapshot,after_snapshot,reason)
    values(p_mutation,actor,parent,kind,p_id,action_name,previous,result,case when action_name='conflict' then 'Revision, lifecycle or dependency mismatch' end)
    returning * into receipt;
  return to_jsonb(receipt);
end $$;
revoke all on function public.apply_flock_change(text,uuid,uuid,uuid,text,jsonb) from public, anon;
grant execute on function public.apply_flock_change(text,uuid,uuid,uuid,text,jsonb) to authenticated;

-- Existing batch writers also share the parent lock with archival.
create function public.require_active_batch_parent() returns trigger language plpgsql set search_path=pg_catalog as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.flock_id::text,0));
  if not exists(select from public.flocks where id=new.flock_id and owner_id=new.owner_id and deleted_at is null)
    then raise exception 'Active owned flock required'; end if;
  return new;
end $$;
create trigger batch_parent_lifecycle before insert or update of flock_id,owner_id on public.serology_batches
for each row execute function public.require_active_batch_parent();

create table public.reader_import_archives(
  id uuid primary key, owner_id uuid not null default auth.uid() references auth.users,
  bytes bytea not null, sha256 text not null check (sha256=encode(pg_catalog.sha256(bytes),'hex')),
  byte_size integer not null check(byte_size=octet_length(bytes) and byte_size between 1 and 5242880),
  file_name text not null, mime_type text not null, parser_version text not null,
  mapping jsonb not null, metadata jsonb not null, imported_at timestamptz not null default now()
);
alter table public.reader_import_archives enable row level security;
revoke all on public.reader_import_archives from public,anon,authenticated;
grant select on public.reader_import_archives to authenticated;
grant insert(id,bytes,sha256,byte_size,file_name,mime_type,parser_version,mapping,metadata) on public.reader_import_archives to authenticated;
create policy archive_read on public.reader_import_archives for select to authenticated using(owner_id=(select auth.uid()));
create policy archive_add on public.reader_import_archives for insert to authenticated with check(owner_id=(select auth.uid()));
