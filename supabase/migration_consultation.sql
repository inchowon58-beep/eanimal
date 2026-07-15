-- 100% 비대면 상담/인도 신청서 접수 (consultation_requests)
-- 방문자가 상세/랜딩에서 '공식 안심 보호 접수 신청' 폼을 제출하면 저장된다.
-- 관리자는 관리자 페이지의 '상담신청' 탭에서 확인 후 직접 연락한다.
--
-- Supabase SQL Editor에서 실행하세요. (여러 번 실행해도 안전)

create table if not exists public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text,
  name text,
  phone text,
  answers jsonb not null default '{}',
  agreed boolean not null default false,
  source_slug text,
  source_keyword text,
  page_url text,
  referrer text,
  ip text,
  user_agent text,
  status text not null default 'pending'
);

-- 이전 버전(간단 스키마) 테이블 업그레이드
alter table public.consultation_requests add column if not exists category text;
alter table public.consultation_requests add column if not exists name text;
alter table public.consultation_requests add column if not exists answers jsonb not null default '{}';
alter table public.consultation_requests add column if not exists agreed boolean not null default false;
alter table public.consultation_requests add column if not exists page_url text;
alter table public.consultation_requests add column if not exists referrer text;
alter table public.consultation_requests add column if not exists ip text;
alter table public.consultation_requests add column if not exists user_agent text;

-- 이전 버전의 필수 제약 완화 (있을 때만)
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'consultation_requests' and column_name = 'guardian_name') then
    alter table public.consultation_requests alter column guardian_name drop not null;
  end if;
end $$;

alter table public.consultation_requests enable row level security;

drop policy if exists "consultation_requests_public_insert" on public.consultation_requests;
create policy "consultation_requests_public_insert"
  on public.consultation_requests
  for insert
  to anon, authenticated
  with check (true);

create index if not exists consultation_requests_created_idx
  on public.consultation_requests (created_at desc);

-- SEO 카테고리별 상담 신청서 양식 저장
alter table public.seo_settings
  add column if not exists category_forms jsonb not null default '{}';
