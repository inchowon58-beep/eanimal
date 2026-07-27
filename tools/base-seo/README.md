# 기본 SEO 로컬 발행 (웹 UI)

유아독존 SEO 발행기와 같은 방식의 **브라우저 UI**입니다.  
**네이버 웹문서 등록은 제외**했고, 아래만 지원합니다.

- 카테고리 기본 템플릿 생성
- CDN 이미지 폴더 URL + 최대번호
- 사이트 발행 (API)
- IndexNow

## 준비

1. Supabase에서 `supabase/migration_base_seo_pages.sql` 실행
2. 프로젝트 `.env.local`에 `CRON_SECRET` (또는 `SYNC_SECRET` / `BASE_SEO_PUBLISH_SECRET`)
3. (선택) `tools/base-seo/.env` 에 API URL·이미지 기본값

```bat
cd tools\base-seo
pip install -r requirements.txt
```

## 실행

```bat
실행_기본SEO발행.bat
```

브라우저가 `http://127.0.0.1:8780` 으로 열립니다.

1. 사이트 URL 확인 (`https://www.eanimal.kr`)
2. 카테고리 선택
3. 이미지 폴더 URL + 최대번호 + 확장자
4. 키워드 붙여넣기
5. **발행 건수**(전체 중 몇 건) / **한 번 발행 개수**(API 배치, 기본 40)
6. **사이트 발행** / **IndexNow** 체크
7. **발행 시작**

## CLI

```bat
python publish.py --category shelter --keywords keywords.example.txt --chunk 40 --image-cdn https://.../folder --image-max 79
```
