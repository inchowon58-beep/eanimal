# 네이버 웹문서 수집 VM 프로그램 연동 가이드

관리자에서 **「순위반영요청」** 을 누르면 URL이 서버 대기열(`collection-queue.json`)에 저장됩니다.  
VM에 설치한 수집 프로그램이 API로 대기 URL을 읽어 네이버 서치어드바이저에 자동 등록한 뒤, 결과를 다시 보고합니다.

---

## 1. 사전 설정 (마스터 설정)

| 항목 | 설명 |
|------|------|
| **수집요청 사이트 URL** | 서치어드바이저에 등록된 사이트 주소 (예: `https://demolishzone.yourdogzone.co.kr`) |
| **VM Worker API 토큰** | VM과 서버가 공유하는 비밀 문자열 (임의의 긴 값) |

Vercel 환경변수 `COLLECTION_WORKER_SECRET`에 같은 값을 넣어도 됩니다.

---

## 2. API 명세

### 2-1. 대기 URL 조회 (VM → 서버)

```
GET https://{사이트도메인}/api/collection-worker/jobs?siteUrl={수집사이트URL}
Authorization: Bearer {VM Worker API 토큰}
```

**응답 예시**

```json
{
  "siteUrl": "https://demolishzone.yourdogzone.co.kr",
  "count": 2,
  "jobs": [
    {
      "id": "col-1710000000-abc123",
      "siteUrl": "https://demolishzone.yourdogzone.co.kr",
      "pageUrl": "https://demolishzone.yourdogzone.co.kr/guide/uijeongbu-demo",
      "keyword": "의정부철거업체",
      "slug": "uijeongbu-demo",
      "requestedAt": "2026-07-04T12:00:00.000Z"
    }
  ]
}
```

- `siteUrl` 파라미터 생략 시 서버에 설정된 수집 사이트 URL 사용
- `jobs`는 **status=pending** 인 항목만 반환

### 2-2. 처리 결과 보고 (VM → 서버)

```
POST https://{사이트도메인}/api/collection-worker/jobs
Authorization: Bearer {VM Worker API 토큰}
Content-Type: application/json

{
  "results": [
    { "id": "col-1710000000-abc123", "status": "submitted" },
    { "id": "col-1710000001-def456", "status": "failed", "error": "일일 한도 초과" }
  ]
}
```

- `status`: `"submitted"` (수집요청 성공) 또는 `"failed"` (실패)
- 성공 처리된 URL은 **중복 등록 불가** (관리자에서 다시 요청해도 스킵)

---

## 3. VM 프로그램 권장 흐름

```
1. (하루 1회 또는 주기적) GET /api/collection-worker/jobs
2. jobs 배열 순회
3. 각 job.pageUrl 을 네이버 서치어드바이저 웹문서 수집요청에 등록
4. 성공/실패를 모아 POST /api/collection-worker/jobs (results)
```

- VM에는 **해당 사이트용 네이버 아이디**만 저장 (이미 자동 로그인 구현하셨다면 그대로 사용)
- `job.siteUrl`과 VM에 설정된 사이트가 일치하는지 확인 후 처리

---

## 4. 중복 방지 규칙 (서버)

| 상태 | 관리자 「순위반영요청」 |
|------|-------------------------|
| 없음 | ✅ 대기열 등록 |
| pending (대기) | ❌ 스킵 |
| submitted (완료) | ❌ 스킵 |
| failed (실패) | ✅ 재등록 가능 |

---

## 5. Cursor에게 VM 프로그램 만들 때 전달할 프롬프트 (복사용)

아래 블록을 Cursor 새 채팅에 붙여넣고, `{...}` 부분만 본인 환경 값으로 바꿉니다.

```
네이버 서치어드바이저 웹문서 수집요청 자동화 프로그램을 만들어줘.

[이미 구현된 것]
- 네이버 자동 로그인 (아이디/비밀번호는 로컬 config 또는 env)
- 서치어드바이저 웹문서 수집요청 UI 자동화 (Playwright/Selenium 등)

[추가로 연동할 것 — 중앙 서버 API]
- 사이트 베이스 URL: {https://demolishzone.yourdogzone.co.kr}
- Worker API 토큰: {마스터설정에_넣은_토큰}
- 이 VM이 담당하는 수집 사이트 URL: {https://demolishzone.yourdogzone.co.kr}

[동작]
1. 하루 1회 (또는 Windows 작업 스케줄러 / cron) 실행
2. GET {베이스URL}/api/collection-worker/jobs?siteUrl={수집사이트URL}
   Header: Authorization: Bearer {Worker API 토큰}
3. 응답 JSON의 jobs[] 각 항목에 대해:
   - job.pageUrl 을 네이버 웹문서 수집요청에 등록
   - job.id 와 성공/실패 status 기록
4. 전부 처리 후 POST {베이스URL}/api/collection-worker/jobs
   Body: { "results": [ { "id": "...", "status": "submitted"|"failed", "error": "..." } ] }
   Header: Authorization: Bearer {Worker API 토큰}
5. jobs가 0개면 종료
6. 로그 파일에 처리 건수·에러 남기기

[주의]
- 서버에서 submitted 처리된 URL은 다시 내려오지 않음 (중복 방지)
- 네이버 일일 수집요청 한도 고려해 jobs 많으면 나눠 처리
- API 401이면 토큰 확인
```

---

## 6. curl 테스트

```bash
# 대기 목록
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  "https://demolishzone.yourdogzone.co.kr/api/collection-worker/jobs"

# 결과 보고
curl -s -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"results\":[{\"id\":\"col-xxx\",\"status\":\"submitted\"}]}" \
  "https://demolishzone.yourdogzone.co.kr/api/collection-worker/jobs"
```

---

## 7. 관리자 UI

- **순위반영요청** (페이지별): 해당 SEO URL만 대기열 등록
- **전체 순위반영요청**: 미등록·실패 페이지 일괄 등록
- 상태 표시: `수집 대기` / `수집요청 완료` / `수집 실패`
