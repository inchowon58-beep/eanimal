-- 100% 비대면 '인도 신청서' 접수 (consultation_requests)
-- 방문자가 상세/랜딩에서 '공식 안심 보호 접수 신청' 폼을 제출하면 저장된다.
-- 관리자는 Supabase에서 데이터를 확인하고 직접 연락한다.
--
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  guardian_name text not null,
  phone text not null,
  region_sido text,
  region_sigungu text,
  pet_type text,
  pet_age text,
  pet_vaccination text,
  reason text,
  source_slug text,
  source_keyword text,
  status text not null default 'pending'
);

alter table public.consultation_requests enable row level security;

drop policy if exists "consultation_requests_public_insert" on public.consultation_requests;
create policy "consultation_requests_public_insert"
  on public.consultation_requests
  for insert
  to anon, authenticated
  with check (true);

create index if not exists consultation_requests_created_idx
  on public.consultation_requests (created_at desc);
