# 기본 SEO 로컬 발행

Gemini 없이 **카테고리 기본 양식**으로 `/info/{slug}` 페이지를 만듭니다.  
Vercel 대량 호출 대신 **이 PC에서** 실행하세요.

## 준비

1. Supabase SQL Editor에서 `supabase/migration_base_seo_pages.sql` 실행
2. `.env.local`에 `CRON_SECRET` 또는 `SYNC_SECRET` 또는 `BASE_SEO_PUBLISH_SECRET`
3. (선택) `BASE_SEO_API_BASE=https://www.eanimal.kr`

## GUI

```bat
실행_기본SEO발행.bat
```

## CLI

```bat
publish_cli.bat shelter keywords.example.txt
```

또는:

```bat
python publish.py --category shelter --keywords keywords.txt
```

## 관리자 1건 발행

사이트 관리자 → **기본SEO발행** 탭 → 키워드 입력 → **1건 발행**
