-- SEO 페이지 카테고리별 이미지 폴더 설정
-- 각 카테고리에 Supabase Storage 폴더명을 등록하면,
-- 생성 시 해당 폴더의 이미지를 7~12장 랜덤으로 골라 본문에 배치한다.
--
-- 사전 준비 (Supabase 대시보드):
--   1) Storage에 PUBLIC 버킷 "seo-images" 생성
--   2) 버킷 안에 카테고리별 폴더 생성 (예: shelter, hospital ...)
--   3) 폴더에 이미지 업로드 (png/jpg/webp)
--   4) 관리자 화면에서 카테고리별 폴더명 등록
-- (버킷명을 바꾸려면 Vercel 환경변수 SEO_IMAGE_BUCKET 로 지정)
--
-- Supabase SQL Editor에서 실행하세요.

alter table public.seo_settings
  add column if not exists category_images jsonb not null default '{}';
