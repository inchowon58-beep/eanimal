-- 구조동물 + 반려동물 동반여행 (이미지 URL만 text 저장)
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.rescued_animals (
  id uuid primary key default gen_random_uuid(),
  desertion_no text not null,
  image_url text,
  has_image boolean not null default false,
  happen_dt text,
  happen_place text,
  kind_cd text,
  color_cd text,
  age text,
  weight text,
  sex_cd text,
  neuter_yn text,
  special_mark text,
  notice_no text,
  notice_sdt text,
  notice_edt text,
  process_state text,
  care_nm text,
  care_tel text,
  care_addr text,
  org_nm text,
  sido text,
  sigungu text,
  updated_at timestamptz not null default now(),
  constraint rescued_animals_desertion_no_unique unique (desertion_no)
);

create index if not exists rescued_animals_happen_dt_idx on public.rescued_animals (happen_dt desc);
create index if not exists rescued_animals_sido_idx on public.rescued_animals (sido);
create index if not exists rescued_animals_kind_idx on public.rescued_animals (kind_cd);

alter table public.rescued_animals enable row level security;
drop policy if exists "rescued_animals_public_read" on public.rescued_animals;
create policy "rescued_animals_public_read"
  on public.rescued_animals for select to anon, authenticated using (true);

create table if not exists public.pet_travel (
  id uuid primary key default gen_random_uuid(),
  content_id text not null,
  content_type_id text,
  title text not null,
  image_url text,
  has_image boolean not null default false,
  address text,
  address_detail text,
  tel text,
  area_code text,
  sigungu_code text,
  sido text,
  sigungu text,
  overview text,
  pet_info text,
  pet_rule text,
  mapx text,
  mapy text,
  updated_at timestamptz not null default now(),
  constraint pet_travel_content_id_unique unique (content_id)
);

create index if not exists pet_travel_sido_idx on public.pet_travel (sido);
create index if not exists pet_travel_title_idx on public.pet_travel (title);

alter table public.pet_travel enable row level security;
drop policy if exists "pet_travel_public_read" on public.pet_travel;
create policy "pet_travel_public_read"
  on public.pet_travel for select to anon, authenticated using (true);
