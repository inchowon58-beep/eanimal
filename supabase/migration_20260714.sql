-- 기존 DB 마이그레이션 (이미 places 테이블이 있는 경우 실행)

-- 1) 카테고리 enum → text
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'category'
      and udt_name = 'place_category'
  ) then
    alter table public.places alter column category type text using category::text;
  end if;
exception when others then
  raise notice 'category type alter skipped: %', SQLERRM;
end $$;

-- 2) 위탁관리업 데이터 삭제
delete from public.places where category = '위탁관리업';

-- 3) 체크 제약
alter table public.places drop constraint if exists places_category_check;
alter table public.places
  add constraint places_category_check
  check (category in ('동물병원', '동물약국', '동물장묘업'));

-- 4) 정보삭제요청
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

-- 5) 동기화 체크포인트
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

-- enum 타입 정리 (사용 중이면 실패할 수 있음 — 무시 가능)
drop type if exists public.place_category;
