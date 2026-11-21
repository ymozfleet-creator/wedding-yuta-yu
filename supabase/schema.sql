-- =============================================================
--  結婚式 Web招待状：出欠回答の保存先（Supabase / PostgreSQL）
--  方針：ゲスト（未ログイン）は「送信」のみ可能、閲覧は不可。
--        回答の閲覧・削除は admins に登録した新郎新婦のみ。
-- =============================================================

-- ---------- 管理者（新郎新婦）のメールアドレス ----------
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);
alter table public.admins enable row level security;
-- ポリシーを作らない＝ブラウザからは一切読めない・書けない

-- ---------- 式の設定（回答締切） ----------
create table if not exists public.event_settings (
  id int primary key default 1 check (id = 1),
  rsvp_deadline timestamptz not null
);
alter table public.event_settings enable row level security;
insert into public.event_settings (id, rsvp_deadline)
values (1, '2027-01-31 23:59:59+09')
on conflict (id) do nothing;

-- ---------- 判定用の関数（RLSから呼ぶ。APIから直接呼べない private スキーマに置く） ----------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_wedding_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function private.rsvp_is_open()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select now() <= s.rsvp_deadline from public.event_settings s where s.id = 1), false);
$$;

revoke all on function private.is_wedding_admin() from public;
revoke all on function private.rsvp_is_open() from public;
grant execute on function private.is_wedding_admin() to anon, authenticated;
grant execute on function private.rsvp_is_open() to anon, authenticated;

-- ---------- 出欠回答 ----------
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  attendance text not null check (attendance in ('attend', 'decline')),
  side text not null check (side in ('groom', 'bride')),
  last_name text not null check (char_length(last_name) between 1 and 30),
  first_name text not null check (char_length(first_name) between 1 and 30),
  last_kana text not null check (char_length(last_kana) between 1 and 30),
  first_kana text not null check (char_length(first_kana) between 1 and 30),
  email text not null check (char_length(email) between 3 and 120 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  phone text not null default '' check (char_length(phone) <= 20),
  postal_code text not null default '' check (postal_code = '' or postal_code ~ '^\d{3}-\d{4}$'),
  address text not null default '' check (char_length(address) <= 200),
  allergy text not null default '' check (char_length(allergy) <= 300),
  message text not null default '' check (char_length(message) <= 500),
  companions jsonb not null default '[]'::jsonb check (
    jsonb_typeof(companions) = 'array'
    and jsonb_array_length(companions) <= 4
    and pg_column_size(companions) <= 4000
  )
);
create index if not exists rsvps_created_at_idx on public.rsvps (created_at desc);
alter table public.rsvps enable row level security;

-- ゲスト：締切前のみ新規送信できる（id・日時はサーバー側で決める）
drop policy if exists "guests can submit" on public.rsvps;
create policy "guests can submit" on public.rsvps
  for insert to anon, authenticated
  with check (private.rsvp_is_open());

-- 新郎新婦：閲覧・削除のみ（他人の回答の書き換えはできない）
drop policy if exists "admins can read" on public.rsvps;
create policy "admins can read" on public.rsvps
  for select to authenticated
  using (private.is_wedding_admin());

drop policy if exists "admins can delete" on public.rsvps;
create policy "admins can delete" on public.rsvps
  for delete to authenticated
  using (private.is_wedding_admin());

-- 列単位の権限：ゲストは id / created_at を指定できない
revoke all on public.rsvps from anon, authenticated;
grant insert (attendance, side, last_name, first_name, last_kana, first_kana,
              email, phone, postal_code, address, allergy, message, companions)
  on public.rsvps to anon, authenticated;
grant select, delete on public.rsvps to authenticated;

revoke all on public.admins from anon, authenticated;
revoke all on public.event_settings from anon, authenticated;

-- =============================================================
--  セットアップ後に実行（メールアドレスは新郎新婦のものに置き換え）
--  insert into public.admins (email) values ('groom@example.com'), ('bride@example.com');
--  ※ Supabase管理画面 Authentication > Users で同じアドレスのユーザーを作成し、
--    Authentication > Sign In / Providers で「Allow new users to sign up」をOFFにする
-- =============================================================
