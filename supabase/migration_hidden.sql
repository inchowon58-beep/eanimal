-- 정보삭제요청 처리용: 페이지 숨김(soft delete) 플래그
-- 공공데이터 재동기화(upsert) 시에도 유지됩니다. (upsert payload에 hidden이 없어 보존)
-- Supabase SQL Editor에서 실행하세요.

alter table public.places
  add column if not exists hidden boolean not null default false;

alter table public.rescued_animals
  add column if not exists hidden boolean not null default false;

alter table public.pet_travel
  add column if not exists hidden boolean not null default false;

create index if not exists places_hidden_idx on public.places (hidden);
create index if not exists rescued_animals_hidden_idx on public.rescued_animals (hidden);
create index if not exists pet_travel_hidden_idx on public.pet_travel (hidden);
