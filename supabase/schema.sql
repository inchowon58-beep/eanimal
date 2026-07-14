-- 반려문화증진위원회 · places + 정보삭제요청 + 동기화 체크포인트
-- 신규 프로젝트: 전체 실행
-- 기존 프로젝트: supabase/migration_20260714.sql 도 함께 실행

create extension if not exists "pgcrypto";

-- text 카테고리 (enum 변경 부담 최소화)
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  local_id text not null,
  category text not null,
  title text not null,
  status text not null default '영업중',
  address_road text,
  address_jibun text,
  phone text,
  sido text,
  sigungu text,
  updated_at timestamptz not null default now(),
  constraint places_local_id_unique unique (local_id),
  constraint places_category_check check (
    category in ('동물병원', '동물약국', '동물장묘업')
  )
);

create index if not exists places_sido_idx on public.places (sido);
create index if not exists places_sigungu_idx on public.places (sigungu);
create index if not exists places_category_idx on public.places (category);
create index if not exists places_status_idx on public.places (status);
create index if not exists places_sido_sigungu_category_idx
  on public.places (sido, sigungu, category);

comment on table public.places is '공공데이터 지방행정인허가(동물병원·동물약국·동물장묘업)';
comment on column public.places.local_id is '공공데이터 인허가 고유번호 — UPSERT 키';

alter table public.places enable row level security;

drop policy if exists "places_public_read" on public.places;
create policy "places_public_read"
  on public.places
  for select
  to anon, authenticated
  using (true);

-- 정보삭제요청
create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  target_url text not null,
  reason text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.deletion_requests enable row level security;

drop policy if exists "deletion_requests_public_insert" on public.deletion_requests;
create policy "deletion_requests_public_insert"
  on public.deletion_requests
  for insert
  to anon, authenticated
  with check (true);

-- 동기화 재개용 체크포인트
create table if not exists public.sync_checkpoints (
  category text primary key,
  next_page int not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_seen_ids (
  category text not null,
  local_id text not null,
  primary key (category, local_id)
);
