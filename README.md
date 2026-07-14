# 반려문화증진위원회

공공데이터포털 지방행정인허가(동물병원·동물약국·동물장묘업) 기반
전국 반려동물 인프라 SEO 트래픽 파이프라인.

## Stack
- Next.js App Router (SSR / ISR)
- Supabase (`places` UPSERT)
- Tailwind CSS
- Vercel Cron

## Setup
1. `npm install`
2. Supabase SQL Editor에서 `supabase/schema.sql` 실행
3. `.env.local` 설정 (`.env.example` 참고)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (동기화용)
   - `PUBLIC_DATA_API_KEY` ([data.go.kr](https://www.data.go.kr) 일반 인증키)
   - `CRON_SECRET`
4. 데이터 동기화
   ```bash
   # 전체
   npm run sync:places
   # 테스트 (1페이지만)
   # Windows PowerShell:
   $env:MAX_PAGES=1; $env:CATEGORY="동물병원"; npm run sync:places
   ```
   또는 `GET /api/cron/sync-places` + `Authorization: Bearer $CRON_SECRET`
5. `npm run dev` → `/places`, `/regions`

## Routes
| Path | 설명 |
|------|------|
| `/` | 홈 |
| `/places` | SSR 필터 리스트 |
| `/places/[id]` | SSR 상세 |
| `/regions` | 시·도 인덱스 |
| `/regions/[sido]` | 시·도 ISR + 시군구 링크 |
| `/regions/[sido]/[sigungu]` | 시군구 롱테일 ISR |
| `/api/cron/sync-places` | 공공데이터 → Supabase UPSERT |

## Folder structure
```
supabase/schema.sql
scripts/sync-places.mjs
src/
  app/places|regions|api/cron/sync-places
  components/layout|places
  lib/public-data|places|regions|supabase
```
