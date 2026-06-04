-- Run this in the Supabase SQL Editor for the project:
-- https://govdfuzkcnbsnvozzqwb.supabase.co

create table if not exists public.site_visits (
  id integer primary key default 1,
  count bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint site_visits_single_row check (id = 1)
);

insert into public.site_visits (id, count)
values (1, 0)
on conflict (id) do nothing;

alter table public.site_visits enable row level security;

drop policy if exists "site visit count is readable by everyone" on public.site_visits;
create policy "site visit count is readable by everyone"
on public.site_visits
for select
using (true);

grant select on public.site_visits to anon, authenticated;

create or replace function public.increment_site_visit()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count bigint;
begin
  insert into public.site_visits (id, count)
  values (1, 1)
  on conflict (id) do update
  set count = site_visits.count + 1,
      updated_at = now()
  returning site_visits.count into next_count;

  return next_count;
end;
$$;

grant execute on function public.increment_site_visit() to anon, authenticated;
