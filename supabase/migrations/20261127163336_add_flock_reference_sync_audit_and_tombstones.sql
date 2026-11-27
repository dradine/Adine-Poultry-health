-- Cloud schema required by the local-first outbox and audit synchronization layer.
alter table public.flocks add column if not exists revision uuid;
alter table public.flocks add column if not exists deleted_at timestamptz;
alter table public.model_runs add column if not exists revision uuid;
alter table public.model_runs add column if not exists deleted_at timestamptz;
alter table public.model_runs add column if not exists updated_at timestamptz not null default now();

create table if not exists public.flock_vaccination_events (
 id uuid primary key,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 flock_id uuid not null references public.flocks(id) on delete cascade,
 event_date date not null,
 age_days integer check (age_days is null or age_days between 0 and 500),
 disease_code text not null references public.diseases(code),
 product_name text not null,
 product_id uuid references public.vaccine_products(id) on delete set null,
 platform text not null,
 strain text,
 route text not null,
 dose text,
 coverage_percent numeric check (coverage_percent is null or coverage_percent between 0 and 100),
 administration_quality text,
 batch_lot text,
 source_reference text,
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 revision uuid,
 deleted_at timestamptz
);
create table if not exists public.flock_clinical_observations (
 id uuid primary key,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 flock_id uuid not null references public.flocks(id) on delete cascade,
 observed_at timestamptz not null,
 status text not null,
 signs text,
 morbidity_percent numeric check (morbidity_percent is null or morbidity_percent between 0 and 100),
 mortality_percent numeric check (mortality_percent is null or mortality_percent between 0 and 100),
 mortality_trend text,
 feed_intake text,
 water_intake text,
 production_change text,
 necropsy text,
 direct_tests text,
 medications text,
 exposure_risks text,
 clinical_course text,
 source_reference text,
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 revision uuid,
 deleted_at timestamptz
);
create table if not exists public.flock_time_series (
 id uuid primary key,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 flock_id uuid not null references public.flocks(id) on delete cascade,
 observed_at timestamptz not null,
 metric text not null check (metric in ('water','feed','weight','egg_production','mortality','temperature','humidity')),
 value numeric not null,
 unit text not null,
 source_reference text,
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 revision uuid,
 deleted_at timestamptz
);
create table if not exists public.flock_audit_events (
 id uuid primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 flock_id uuid not null references public.flocks(id) on delete cascade,
 entity_type text not null check (entity_type in ('flock','model_run','vaccination_event','clinical_observation','time_series','serology_round')),
 entity_id uuid not null,
 action text not null check (action in ('create','update','delete','restore','conflict')),
 reason text,
 before_snapshot jsonb,
 after_snapshot jsonb,
 created_at timestamptz not null default now()
);

create index if not exists flock_vaccination_events_owner_flock_date_idx on public.flock_vaccination_events(owner_id,flock_id,event_date desc);
create index if not exists flock_vaccination_events_flock_id_idx on public.flock_vaccination_events(flock_id);
create index if not exists flock_vaccination_events_disease_code_idx on public.flock_vaccination_events(disease_code);
create index if not exists flock_vaccination_events_product_id_idx on public.flock_vaccination_events(product_id);
create index if not exists flock_clinical_observations_owner_flock_date_idx on public.flock_clinical_observations(owner_id,flock_id,observed_at desc);
create index if not exists flock_clinical_observations_flock_id_idx on public.flock_clinical_observations(flock_id);
create index if not exists flock_time_series_owner_flock_metric_date_idx on public.flock_time_series(owner_id,flock_id,metric,observed_at desc);
create index if not exists flock_time_series_flock_id_idx on public.flock_time_series(flock_id);
create index if not exists flock_audit_events_owner_flock_created_idx on public.flock_audit_events(owner_id,flock_id,created_at desc);
create index if not exists flock_audit_events_flock_id_idx on public.flock_audit_events(flock_id);
create index if not exists model_runs_owner_flock_created_idx on public.model_runs(owner_id,flock_id,created_at desc);

alter table public.flock_vaccination_events enable row level security;
alter table public.flock_clinical_observations enable row level security;
alter table public.flock_time_series enable row level security;
alter table public.flock_audit_events enable row level security;

drop policy if exists flock_vaccination_events_select_own on public.flock_vaccination_events;
create policy flock_vaccination_events_select_own on public.flock_vaccination_events for select to authenticated using (owner_id=(select auth.uid()));
drop policy if exists flock_vaccination_events_insert_own on public.flock_vaccination_events;
create policy flock_vaccination_events_insert_own on public.flock_vaccination_events for insert to authenticated with check (owner_id=(select auth.uid()) and exists(select 1 from public.flocks f where f.id=flock_id and f.owner_id=(select auth.uid())));
drop policy if exists flock_vaccination_events_update_own on public.flock_vaccination_events;
create policy flock_vaccination_events_update_own on public.flock_vaccination_events for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()) and exists(select 1 from public.flocks f where f.id=flock_id and f.owner_id=(select auth.uid())));
drop policy if exists flock_vaccination_events_delete_own on public.flock_vaccination_events;
create policy flock_vaccination_events_delete_own on public.flock_vaccination_events for delete to authenticated using (owner_id=(select auth.uid()));

drop policy if exists flock_clinical_observations_select_own on public.flock_clinical_observations;
create policy flock_clinical_observations_select_own on public.flock_clinical_observations for select to authenticated using (owner_id=(select auth.uid()));
drop policy if exists flock_clinical_observations_insert_own on public.flock_clinical_observations;
create policy flock_clinical_observations_insert_own on public.flock_clinical_observations for insert to authenticated with check (owner_id=(select auth.uid()) and exists(select 1 from public.flocks f where f.id=flock_id and f.owner_id=(select auth.uid())));
drop policy if exists flock_clinical_observations_update_own on public.flock_clinical_observations;
create policy flock_clinical_observations_update_own on public.flock_clinical_observations for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()) and exists(select 1 from public.flocks f where f.id=flock_id and f.owner_id=(select auth.uid())));
drop policy if exists flock_clinical_observations_delete_own on public.flock_clinical_observations;
create policy flock_clinical_observations_delete_own on public.flock_clinical_observations for delete to authenticated using (owner_id=(select auth.uid()));

drop policy if exists flock_time_series_select_own on public.flock_time_series;
create policy flock_time_series_select_own on public.flock_time_series for select to authenticated using (owner_id=(select auth.uid()));
drop policy if exists flock_time_series_insert_own on public.flock_time_series;
create policy flock_time_series_insert_own on public.flock_time_series for insert to authenticated with check (owner_id=(select auth.uid()) and exists(select 1 from public.flocks f where f.id=flock_id and f.owner_id=(select auth.uid())));
drop policy if exists flock_time_series_update_own on public.flock_time_series;
create policy flock_time_series_update_own on public.flock_time_series for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()) and exists(select 1 from public.flocks f where f.id=flock_id and f.owner_id=(select auth.uid())));
drop policy if exists flock_time_series_delete_own on public.flock_time_series;
create policy flock_time_series_delete_own on public.flock_time_series for delete to authenticated using (owner_id=(select auth.uid()));

drop policy if exists flock_audit_events_select_own on public.flock_audit_events;
create policy flock_audit_events_select_own on public.flock_audit_events for select to authenticated using (owner_id=(select auth.uid()));
drop policy if exists flock_audit_events_insert_own on public.flock_audit_events;
create policy flock_audit_events_insert_own on public.flock_audit_events for insert to authenticated with check (owner_id=(select auth.uid()) and exists(select 1 from public.flocks f where f.id=flock_id and f.owner_id=(select auth.uid())));

grant select,insert,update,delete on public.flock_vaccination_events,public.flock_clinical_observations,public.flock_time_series to authenticated;
grant select,insert on public.flock_audit_events to authenticated;

create or replace function public.apply_flock_change(
 p_table text,p_id uuid,p_base text,p_mutation uuid,p_operation text,p_payload jsonb
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare
 v_uid uuid:=auth.uid();
 v_before jsonb;
 v_after jsonb;
 v_audit jsonb;
 v_revision uuid;
 v_flock_id uuid;
 v_entity_type text;
 v_action text;
 v_payload jsonb;
 v_exists boolean;
 v_deleted_at timestamptz;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 if p_table not in ('flocks','model_runs','flock_vaccination_events','flock_clinical_observations','flock_time_series') then raise exception 'Unsupported entity'; end if;
 if p_operation not in ('upsert','delete','restore') then raise exception 'Unsupported operation'; end if;
 if p_id is null or p_mutation is null or p_payload is null then raise exception 'Invalid mutation'; end if;
 if p_payload->>'id' is distinct from p_id::text then raise exception 'Payload id mismatch'; end if;

 v_entity_type:=case p_table when 'flocks' then 'flock' when 'model_runs' then 'model_run' when 'flock_vaccination_events' then 'vaccination_event' when 'flock_clinical_observations' then 'clinical_observation' else 'time_series' end;
 v_flock_id:=case when p_table='flocks' then p_id else nullif(p_payload->>'flock_id','')::uuid end;

 execute format('select to_jsonb(t),t.revision,t.deleted_at from public.%I t where t.id=$1 and t.owner_id=$2 for update',p_table)
 into v_before,v_revision,v_deleted_at using p_id,v_uid;
 v_exists:=v_before is not null;

 if v_exists and v_revision=p_mutation then
   select to_jsonb(a) into v_audit from public.flock_audit_events a where a.id=p_mutation and a.owner_id=v_uid;
   if v_audit is not null then return v_audit; end if;
 end if;

 if v_exists then
   if p_base is null then
     if v_revision is not null then v_action:='conflict'; end if;
   elsif v_revision is distinct from p_base::uuid then v_action:='conflict';
   end if;
   if v_deleted_at is not null and p_operation='upsert' then v_action:='conflict'; end if;
 else
   if p_base is not null or p_operation in ('delete','restore') then v_action:='conflict'; end if;
 end if;

 if v_action='conflict' then
   if v_flock_id is not null and exists(select 1 from public.flocks f where f.id=v_flock_id and f.owner_id=v_uid) then
     insert into public.flock_audit_events(id,owner_id,flock_id,entity_type,entity_id,action,before_snapshot,after_snapshot)
     values(p_mutation,v_uid,v_flock_id,v_entity_type,p_id,'conflict',v_before,p_payload) on conflict(id) do nothing;
     select to_jsonb(a) into v_audit from public.flock_audit_events a where a.id=p_mutation and a.owner_id=v_uid;
     if v_audit is not null then return v_audit; end if;
   end if;
   return jsonb_build_object('id',p_mutation,'owner_id',v_uid,'flock_id',coalesce(v_flock_id,p_id),'entity_type',v_entity_type,'entity_id',p_id,'action','conflict','before_snapshot',v_before,'after_snapshot',p_payload,'created_at',now());
 end if;

 if p_table<>'flocks' then
   if v_flock_id is null or not exists(select 1 from public.flocks f where f.id=v_flock_id and f.owner_id=v_uid and f.deleted_at is null) then
     raise exception 'Parent flock is missing, deleted, or not owned by this account';
   end if;
 end if;

 if p_operation in ('delete','restore') then
   if (p_operation='delete' and v_deleted_at is not null) or (p_operation='restore' and v_deleted_at is null) then
     v_action:='conflict';
   else
     v_action:=p_operation;
     execute format('update public.%I set deleted_at=$1,revision=$2,updated_at=now() where id=$3 and owner_id=$4 returning to_jsonb(%I.*)',p_table,p_table)
       into v_after using case when p_operation='delete' then now() else null end,p_mutation,p_id,v_uid;
   end if;
 else
   v_action:=case when v_exists then 'update' else 'create' end;
   v_payload:=p_payload||jsonb_build_object('id',p_id,'owner_id',v_uid,'revision',p_mutation,'deleted_at',null,'updated_at',now());
   if p_table='flocks' then
     execute 'insert into public.flocks as t select (jsonb_populate_record(null::public.flocks,$1)).* on conflict(id) do update set flock_name=excluded.flock_name,species=excluded.species,breed=excluded.breed,hatch_date=excluded.hatch_date,placement_date=excluded.placement_date,bird_count=excluded.bird_count,location_label=excluded.location_label,timezone=excluded.timezone,notes=excluded.notes,updated_at=excluded.updated_at,revision=excluded.revision,deleted_at=excluded.deleted_at returning to_jsonb(t.*)' into v_after using v_payload;
   elsif p_table='model_runs' then
     execute 'insert into public.model_runs as t select (jsonb_populate_record(null::public.model_runs,$1)).* on conflict(id) do update set flock_id=excluded.flock_id,disease_code=excluded.disease_code,model_version=excluded.model_version,model_family=excluded.model_family,input_snapshot=excluded.input_snapshot,output_snapshot=excluded.output_snapshot,confidence_level=excluded.confidence_level,decision_status=excluded.decision_status,limitations=excluded.limitations,qc_summary=excluded.qc_summary,model_assumptions=excluded.model_assumptions,source_references=excluded.source_references,input_schema_version=excluded.input_schema_version,reviewed_at=excluded.reviewed_at,reviewed_by=excluded.reviewed_by,updated_at=excluded.updated_at,revision=excluded.revision,deleted_at=excluded.deleted_at returning to_jsonb(t.*)' into v_after using v_payload;
   elsif p_table='flock_vaccination_events' then
     execute 'insert into public.flock_vaccination_events as t select (jsonb_populate_record(null::public.flock_vaccination_events,$1)).* on conflict(id) do update set flock_id=excluded.flock_id,event_date=excluded.event_date,age_days=excluded.age_days,disease_code=excluded.disease_code,product_name=excluded.product_name,product_id=excluded.product_id,platform=excluded.platform,strain=excluded.strain,route=excluded.route,dose=excluded.dose,coverage_percent=excluded.coverage_percent,administration_quality=excluded.administration_quality,batch_lot=excluded.batch_lot,source_reference=excluded.source_reference,notes=excluded.notes,updated_at=excluded.updated_at,revision=excluded.revision,deleted_at=excluded.deleted_at returning to_jsonb(t.*)' into v_after using v_payload;
   elsif p_table='flock_clinical_observations' then
     execute 'insert into public.flock_clinical_observations as t select (jsonb_populate_record(null::public.flock_clinical_observations,$1)).* on conflict(id) do update set flock_id=excluded.flock_id,observed_at=excluded.observed_at,status=excluded.status,signs=excluded.signs,morbidity_percent=excluded.morbidity_percent,mortality_percent=excluded.mortality_percent,mortality_trend=excluded.mortality_trend,feed_intake=excluded.feed_intake,water_intake=excluded.water_intake,production_change=excluded.production_change,necropsy=excluded.necropsy,direct_tests=excluded.direct_tests,medications=excluded.medications,exposure_risks=excluded.exposure_risks,clinical_course=excluded.clinical_course,source_reference=excluded.source_reference,notes=excluded.notes,updated_at=excluded.updated_at,revision=excluded.revision,deleted_at=excluded.deleted_at returning to_jsonb(t.*)' into v_after using v_payload;
   else
     execute 'insert into public.flock_time_series as t select (jsonb_populate_record(null::public.flock_time_series,$1)).* on conflict(id) do update set flock_id=excluded.flock_id,observed_at=excluded.observed_at,metric=excluded.metric,value=excluded.value,unit=excluded.unit,source_reference=excluded.source_reference,notes=excluded.notes,updated_at=excluded.updated_at,revision=excluded.revision,deleted_at=excluded.deleted_at returning to_jsonb(t.*)' into v_after using v_payload;
   end if;
 end if;

 if v_action='conflict' then v_after:=v_before; end if;
 if v_flock_id is not null and exists(select 1 from public.flocks f where f.id=v_flock_id and f.owner_id=v_uid) then
   insert into public.flock_audit_events(id,owner_id,flock_id,entity_type,entity_id,action,before_snapshot,after_snapshot)
   values(p_mutation,v_uid,v_flock_id,v_entity_type,p_id,v_action,v_before,v_after) on conflict(id) do nothing;
   select to_jsonb(a) into v_audit from public.flock_audit_events a where a.id=p_mutation and a.owner_id=v_uid;
   if v_audit is not null then return v_audit; end if;
 end if;
 return jsonb_build_object('id',p_mutation,'owner_id',v_uid,'flock_id',coalesce(v_flock_id,p_id),'entity_type',v_entity_type,'entity_id',p_id,'action',v_action,'before_snapshot',v_before,'after_snapshot',v_after,'created_at',now());
end;
$$;

revoke all on function public.apply_flock_change(text,uuid,text,uuid,text,jsonb) from public,anon;
grant execute on function public.apply_flock_change(text,uuid,text,uuid,text,jsonb) to authenticated;
