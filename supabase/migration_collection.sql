-- 네이버 웹문서 수집(순위반영) 대기열
-- SEO 페이지 생성 시 자동으로 대기열에 등록 → VM 수집 워커가
-- GET /api/collection-worker/jobs 로 가져가 네이버 서치어드바이저에 등록
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists "pgcrypto";

create table if not exists public.collection_jobs (
  id uuid primary key default gen_random_uuid(),
  site_url text not null,
  page_url text not null,
  keyword text,
  slug text,
  status text not null default 'pending',   -- pending | submitted | failed
  error text,
  requested_at timestamptz not null default now(),
  submitted_at timestamptz
);

create index if not exists collection_jobs_status_idx
  on public.collection_jobs (status, requested_at);

-- 같은 URL은 대기/완료 상태에서 중복 등록 방지 (failed는 재등록 허용)
create unique index if not exists collection_jobs_active_url_idx
  on public.collection_jobs (page_url)
  where status in ('pending', 'submitted');

-- RLS: 서비스 롤(관리자/워커) 전용
alter table public.collection_jobs enable row level security;

-- 기존에 이미 생성된 SEO 페이지를 수집 대기열에 일괄 등록 (중복은 무시)
insert into public.collection_jobs (site_url, page_url, keyword, slug)
select
  'https://www.eanimal.kr',
  'https://www.eanimal.kr/guide/' || slug,
  keyword,
  slug
from public.seo_pages
where hidden = false
on conflict do nothing;
