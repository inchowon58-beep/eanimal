-- 반려문화증진위원회 · places 테이블 (공공데이터 지방행정인허가)
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists "pgcrypto";

create type public.place_category as enum (
  '동물병원',
  '동물약국',
  '위탁관리업'
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  local_id text not null,
  category public.place_category not null,
  title text not null,
  status text not null default '영업중',
  address_road text,
  address_jibun text,
  phone text,
  sido text,
  sigungu text,
  updated_at timestamptz not null default now(),
  constraint places_local_id_unique unique (local_id)
);

create index if not exists places_sido_idx on public.places (sido);
create index if not exists places_sigungu_idx on public.places (sigungu);
create index if not exists places_category_idx on public.places (category);
create index if not exists places_status_idx on public.places (status);
create index if not exists places_sido_sigungu_category_idx
  on public.places (sido, sigungu, category);

comment on table public.places is '공공데이터포털 지방행정인허가(동물병원·동물약국·위탁관리업) 동기화 데이터';
comment on column public.places.local_id is '공공데이터 인허가 고유번호 — UPSERT 키';

-- Anon 읽기 전용 (SSR 페이지용). 쓰기는 service role / 동기화 스크립트에서만.
alter table public.places enable row level security;

create policy "places_public_read"
  on public.places
  for select
  to anon, authenticated
  using (true);

-- UPSERT 예시 (동기화 워커용, service role):
-- insert into public.places (
--   local_id, category, title, status, address_road, address_jibun, phone, sido, sigungu, updated_at
-- ) values (...)
-- on conflict (local_id) do update set
--   category = excluded.category,
--   title = excluded.title,
--   status = excluded.status,
--   address_road = excluded.address_road,
--   address_jibun = excluded.address_jibun,
--   phone = excluded.phone,
--   sido = excluded.sido,
--   sigungu = excluded.sigungu,
--   updated_at = now();
