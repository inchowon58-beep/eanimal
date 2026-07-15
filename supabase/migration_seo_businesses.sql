-- SEO 페이지 카테고리별 "참고 업체정보" 설정
-- 각 카테고리에 업체(업체명/전화번호/설명/이미지주소)를 여러 개 등록하면,
-- 페이지 방문 시 랜덤으로 1개가 상단 배너 아래에 노출되고,
-- 하단 고정 버튼으로 "{키워드} 문의" 전화 연결이 표시된다.
--
-- 저장 형태(JSONB):
--   { "shelter": [ { "id":"...", "name":"...", "phone":"...", "description":"...", "image_url":"..." }, ... ], ... }
--
-- Supabase SQL Editor에서 실행하세요.

alter table public.seo_settings
  add column if not exists category_businesses jsonb not null default '{}';
