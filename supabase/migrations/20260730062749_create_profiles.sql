-- profiles: hồ sơ Sunner, 1-1 với auth.users.
-- Row tự sinh khi user đăng nhập lần đầu (trigger on_auth_user_created).
-- Nguồn: docs/database-schema.md → bảng `profiles`. Login chỉ cần bảng này;
-- departments/hashtags/... plan sau nên department_id để nullable, chưa gắn FK.

create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  email                 text,
  full_name             text,
  avatar_url            text,
  department_id         integer,
  title                 text,
  kudos_received_count  integer     not null default 0,
  kudos_sent_count      integer     not null default 0,
  hearts_received       integer     not null default 0,
  star_level            integer     not null default 0,
  is_admin              boolean     not null default false,
  created_at            timestamptz not null default now()
);

-- RLS: authenticated đọc mọi profile; user chỉ sửa chính mình.
alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Tự tạo profile từ auth.users khi có user mới.
-- security definer để bypass RLS lúc insert; search_path khóa về public chống hijack.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
