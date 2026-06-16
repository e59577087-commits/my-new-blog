create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  author_name text,
  author_avatar text,
  created_at timestamptz not null default now()
);

alter table public.comments
add column if not exists post_slug text;

alter table public.comments
add column if not exists author_name text;

alter table public.comments
add column if not exists author_avatar text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comments'
      and column_name = 'article_slug'
  ) then
    update public.comments
    set post_slug = article_slug
    where post_slug is null;

    alter table public.comments
    alter column article_slug drop not null;
  end if;
end $$;

alter table public.comments
alter column post_slug set not null;

alter table public.comments enable row level security;

drop policy if exists "comments are readable by everyone" on public.comments;
create policy "comments are readable by everyone"
on public.comments
for select
using (true);

drop policy if exists "authenticated users can create comments" on public.comments;
create policy "authenticated users can create comments"
on public.comments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can delete own comments" on public.comments;
create policy "users can delete own comments"
on public.comments
for delete
to authenticated
using (auth.uid() = user_id);

grant select on public.comments to anon;
grant select, insert, delete on public.comments to authenticated;
