-- 관리자 배너(프리미엄 슬롯) 관리
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists "pgcrypto";

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  image_url text,
  link_url text,
  phone text,
  placements text[] not null default '{}',
  enabled boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists banners_enabled_idx on public.banners (enabled);
create index if not exists banners_placements_idx on public.banners using gin (placements);
create index if not exists banners_sort_idx on public.banners (sort_order, created_at desc);

comment on table public.banners is '관리자 등록 프리미엄 배너 (노출영역/기간/버튼)';
comment on column public.banners.placements is '노출영역 키 배열: main_top, places, hospital, pharmacy, funeral, rescue, travel, regions';

alter table public.banners enable row level security;

-- 공개 페이지에서 활성 배너만 읽기
drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read"
  on public.banners
  for select
  to anon, authenticated
  using (enabled = true);

-- 등록/수정/삭제는 service role(관리자 API)에서만 → RLS 우회

-- 배너 이미지 저장용 스토리지 버킷 (공개)
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

-- 공개 버킷 읽기 정책 (이미 있으면 무시)
do $$
begin
  begin
    create policy "banners_bucket_public_read"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'banners');
  exception when duplicate_object then null;
  end;
end $$;
