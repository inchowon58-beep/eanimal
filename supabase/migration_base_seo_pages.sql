-- 기본 SEO 발행(템플릿 랜딩) — Gemini 없이 카테고리 기본 양식으로 생성
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists "pgcrypto";

create table if not exists public.base_seo_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  keyword text not null,
  category text not null,
  region_label text,
  title text not null,
  h1 text not null,
  description text not null,
  meta_keywords text[] not null default '{}',
  hero_kicker text,
  hero_subtitle text,
  sections jsonb not null default '[]',
  faqs jsonb not null default '[]',
  cta_text text,
  image_url text,
  publish_source text not null default 'web',
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists base_seo_pages_created_idx
  on public.base_seo_pages (created_at desc);
create index if not exists base_seo_pages_category_idx
  on public.base_seo_pages (category, created_at desc);
create index if not exists base_seo_pages_hidden_idx
  on public.base_seo_pages (hidden);

alter table public.base_seo_pages enable row level security;

drop policy if exists "base_seo_pages_public_read" on public.base_seo_pages;
create policy "base_seo_pages_public_read"
  on public.base_seo_pages for select to anon, authenticated
  using (hidden = false);
