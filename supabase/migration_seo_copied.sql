-- SEO 페이지 주소 일괄 복사 이력 추적
-- 이미 복사한 주소는 다음 복사에서 제외하기 위한 컬럼
-- Supabase SQL Editor에서 실행하세요.

alter table public.seo_pages
  add column if not exists copied_at timestamptz;

-- 미복사(오래된 순) 조회용 인덱스
create index if not exists seo_pages_copied_created_idx
  on public.seo_pages (copied_at, created_at);
