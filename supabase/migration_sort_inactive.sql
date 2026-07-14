-- 영업가능 시설을 목록 앞쪽으로 정렬하기 위한 컬럼
-- Supabase SQL Editor에서 실행하세요.

alter table public.places
  add column if not exists is_inactive boolean not null default false;

update public.places
set is_inactive = (
  coalesce(status, '') ~ '(폐업|취소|말소|폐쇄|휴업|정지|종료)'
);

create index if not exists places_inactive_title_idx
  on public.places (is_inactive, title);
