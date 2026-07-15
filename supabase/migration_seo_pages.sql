-- SEO 페이지(키워드 랜딩) 생성 시스템
-- 관리자 대량등록 → VM 워커가 /api/seo-worker/generate-next 로 하나씩 가져가 생성
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists "pgcrypto";

-- 마스터 설정(단일 행) + 일일 발행 쿼터
create table if not exists public.seo_settings (
  id text primary key default 'default',
  daily_limit int not null default 10,
  service_expires_at timestamptz,
  quota_date date,
  quota_count int not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.seo_settings (id) values ('default') on conflict (id) do nothing;

-- 생성된 SEO 페이지
create table if not exists public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  keyword text not null,
  region_name text,
  title text not null,
  description text,
  content text not null,
  faqs jsonb not null default '[]',
  image_url text,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists seo_pages_created_idx on public.seo_pages (created_at desc);
create index if not exists seo_pages_hidden_idx on public.seo_pages (hidden);

-- 생성 대기열(잡)
create table if not exists public.seo_jobs (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  normalized_keyword text not null,
  status text not null default 'pending',
  error text,
  page_id uuid,
  slug text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);
create index if not exists seo_jobs_status_idx on public.seo_jobs (status, requested_at);
-- 대기/처리중 키워드는 중복 등록 방지
create unique index if not exists seo_jobs_active_norm_idx
  on public.seo_jobs (normalized_keyword)
  where status in ('pending', 'processing');

-- RLS: 공개는 seo_pages 읽기만, 나머지는 service role(관리자/워커) 전용
alter table public.seo_pages enable row level security;
drop policy if exists "seo_pages_public_read" on public.seo_pages;
create policy "seo_pages_public_read"
  on public.seo_pages for select to anon, authenticated using (hidden = false);

alter table public.seo_settings enable row level security;
alter table public.seo_jobs enable row level security;
