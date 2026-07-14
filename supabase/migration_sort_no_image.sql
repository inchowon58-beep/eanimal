-- 이미지 없는 공고/장소를 목록 맨 뒤로
-- Supabase SQL Editor에서 실행하세요.

alter table public.rescued_animals
  add column if not exists has_image boolean not null default false;

alter table public.pet_travel
  add column if not exists has_image boolean not null default false;

update public.rescued_animals
set has_image = (image_url is not null and btrim(image_url) <> '');

update public.pet_travel
set has_image = (image_url is not null and btrim(image_url) <> '');

create index if not exists rescued_animals_has_image_happen_dt_idx
  on public.rescued_animals (has_image desc, happen_dt desc);

create index if not exists pet_travel_has_image_title_idx
  on public.pet_travel (has_image desc, title asc);
