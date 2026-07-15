-- SEO 페이지 카테고리별 생성 확장
-- 카테고리(보호소/분양/병원/장례/카페/약국/호텔펜션/미용학원)별로
-- 연관 키워드 풀을 두고, 생성 시 랜덤 3개를 본문에 활용한다.
-- Supabase SQL Editor에서 실행하세요.

alter table public.seo_pages
  add column if not exists category text,
  add column if not exists region_sigungu text,
  add column if not exists keywords jsonb not null default '[]';

alter table public.seo_jobs
  add column if not exists category text;

-- 카테고리별 연관 키워드 풀(관리자에서 편집) — { "shelter": "강아지보호소,...", ... }
alter table public.seo_settings
  add column if not exists category_pools jsonb not null default '{}';

create index if not exists seo_pages_category_idx on public.seo_pages (category);
create index if not exists seo_jobs_category_idx on public.seo_jobs (category, status);
