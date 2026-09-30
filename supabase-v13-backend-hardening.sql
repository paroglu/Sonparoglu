-- PAROGLU MEDIA V13.1 BACKEND HARDENING
-- Existing Supabase project upgrade. Safe to run more than once.
-- Run in Supabase > SQL Editor before deploying the V13.1 Edge Functions.

create extension if not exists pgcrypto;


-- ------------------------------------------------------------
-- Explicit Data API grants (future-proof against changing defaults)
-- RLS policies still decide which rows authenticated/anon can use.
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select on public.projects, public.brands, public.site_content, public.media_library, public.assistant_knowledge to anon, authenticated;
grant insert, update, delete on public.projects, public.brands, public.site_content, public.media_library, public.assistant_knowledge to authenticated;

grant select, update, delete on public.briefs to authenticated;
revoke insert on public.briefs from anon, authenticated;
revoke select, update, delete on public.briefs from anon;

grant all privileges on public.projects, public.brands, public.briefs, public.site_content, public.media_library, public.assistant_knowledge to service_role;

-- ------------------------------------------------------------
-- Performance indexes
-- ------------------------------------------------------------
create index if not exists projects_public_order_idx
  on public.projects (published, featured desc, sort_order asc, created_at desc);
create index if not exists brands_public_order_idx
  on public.brands (visible, row_no asc, sort_order asc, created_at asc);
create index if not exists briefs_created_at_idx
  on public.briefs (created_at desc);
create index if not exists site_content_section_idx
  on public.site_content (section, label);
create index if not exists media_library_created_at_idx
  on public.media_library (created_at desc);
create index if not exists assistant_knowledge_active_idx
  on public.assistant_knowledge (active, sort_order asc, created_at asc);

-- ------------------------------------------------------------
-- Persistent Edge Function rate limits
-- Raw IP addresses are never stored. Functions send only SHA-256 hashes.
-- ------------------------------------------------------------
create table if not exists public.edge_rate_limits (
  scope text not null,
  identity_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope, identity_hash, window_start)
);

alter table public.edge_rate_limits enable row level security;

-- No browser/user policies are created for this table.
-- Only the server-side secret/service role should reach it.
revoke all on table public.edge_rate_limits from anon, authenticated;

create or replace function public.consume_edge_rate_limit(
  p_scope text,
  p_identity_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if coalesce(length(trim(p_scope)), 0) = 0
     or coalesce(length(trim(p_identity_hash)), 0) < 16
     or p_limit < 1
     or p_limit > 1000
     or p_window_seconds < 1
     or p_window_seconds > 86400 then
    return false;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.edge_rate_limits(scope, identity_hash, window_start, request_count, updated_at)
  values (p_scope, p_identity_hash, v_window_start, 1, now())
  on conflict (scope, identity_hash, window_start)
  do update set
    request_count = public.edge_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  -- Lightweight cleanup so the limiter table cannot grow forever.
  delete from public.edge_rate_limits
  where window_start < now() - interval '2 days';

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_edge_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_edge_rate_limit(text,text,integer,integer) to service_role;

-- ------------------------------------------------------------
-- Brief security
-- Website visitors no longer insert directly into public.briefs.
-- submit-brief Edge Function validates/rate-limits and inserts server-side.
-- ------------------------------------------------------------
drop policy if exists "briefs_public_insert" on public.briefs;

-- Keep admin-only access policies idempotently aligned.
drop policy if exists "briefs_admin_read" on public.briefs;
drop policy if exists "briefs_admin_update" on public.briefs;
drop policy if exists "briefs_admin_delete" on public.briefs;

create policy "briefs_admin_read"
on public.briefs for select
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "briefs_admin_update"
on public.briefs for update
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com')
with check ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "briefs_admin_delete"
on public.briefs for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

-- Ensure status/source defaults remain consistent.
alter table public.briefs alter column status set default 'Yeni';
alter table public.briefs alter column source set default 'website';

-- ------------------------------------------------------------
-- Optional data integrity checks (NOT VALID avoids breaking old rows).
-- New/updated rows must respect these values once constraint is present.
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'briefs_status_allowed') then
    alter table public.briefs add constraint briefs_status_allowed
      check (status in ('Yeni','İletişime Geçildi','Teklif Verildi','Tamamlandı','Arşiv')) not valid;
  end if;
end $$;

-- ------------------------------------------------------------
-- Remove stale limiter records now.
-- ------------------------------------------------------------
delete from public.edge_rate_limits where window_start < now() - interval '2 days';
