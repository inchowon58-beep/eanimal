"use client";

import { useState } from "react";

interface Props {
  keyword?: string;
  slug?: string;
}

const SIDO = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

const PET_TYPES = ["강아지", "고양이", "기타"];
const VACCINATION = ["접종 완료", "접종 진행 중", "미접종", "잘 모름"];
const REASONS = ["이사·주거 문제", "건강·질병 문제", "경제적 사정", "알레르기", "돌봄 시간 부족", "기타"];

const CTA_LABEL = "반려문화증진위원회 공식 안심 보호 접수 신청";
const SUCCESS_MSG =
  "접수가 완료되었습니다. 반려문화증진위원회 배정 상담사가 영업일 기준 24시간 이내에 순차적으로 연락을 드립니다.";

export default function ConsultationCTA({ keyword, slug }: Props) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [guardianName, setGuardianName] = useState("");
  const [phone, setPhone] = useState("");
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [petType, setPetType] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petVaccination, setPetVaccination] = useState("");
  const [reason, setReason] = useState("");

  function openModal() {
    setError("");
    setDone(false);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  async function submit() {
    setError("");
    if (!guardianName.trim() || !phone.trim() || !sido || !petType || !reason) {
      setError("필수 항목을 모두 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/consultation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardianName,
          phone,
          sido,
          sigungu,
          petType,
          petAge,
          petVaccination,
          reason,
          sourceSlug: slug || "",
          sourceKeyword: keyword || "",
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        setDone(true);
        setGuardianName("");
        setPhone("");
        setSido("");
        setSigungu("");
        setPetType("");
        setPetAge("");
        setPetVaccination("");
        setReason("");
      } else {
        setError(d.error || "접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
    setSubmitting(false);
  }

  const fieldCls =
    "mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent";
  const labelCls = "text-xs font-semibold text-foreground";

  return (
    <>
      {/* 강조 CTA 배너 */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 to-accent/5 p-6 sm:p-7">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
              공식 · 100% 비대면 접수
            </span>
            <h2 className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl">
              책임 있는 이별, 안심 보호 접수
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-fg">
              반려문화증진위원회가 신청 내용을 확인 후 직접 연락드립니다. 전화번호 노출 없이
              안전하게 상담을 신청하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="w-full shrink-0 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-accent/25 transition hover:brightness-95 sm:w-auto"
          >
            {CTA_LABEL}
          </button>
        </div>
      </section>

      {/* 하단 고정 버튼 */}
      <button
        type="button"
        onClick={openModal}
        className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent/30 transition hover:brightness-95"
      >
        공식 안심 보호 접수 신청
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-3xl">
                  ✓
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">접수 완료</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-fg">{SUCCESS_MSG}</p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-5 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white"
                >
                  확인
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">안심 보호 인도 신청서</h3>
                    <p className="mt-1 text-xs text-muted-fg">
                      아래 정보를 남겨 주시면 배정 상담사가 순차적으로 연락드립니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="shrink-0 rounded-lg p-1 text-muted-fg hover:text-foreground"
                    aria-label="닫기"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {/* 1. 보호자 정보 */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>보호자 성함 *</label>
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder="예: 홍길동"
                        className={fieldCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>연락처 *</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="예: 010-1234-5678"
                        className={fieldCls}
                      />
                    </div>
                  </div>

                  {/* 2. 거주 지역 */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>거주 지역 (시/도) *</label>
                      <select
                        value={sido}
                        onChange={(e) => setSido(e.target.value)}
                        className={fieldCls}
                      >
                        <option value="">선택하세요</option>
                        {SIDO.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>시/군/구</label>
                      <input
                        type="text"
                        value={sigungu}
                        onChange={(e) => setSigungu(e.target.value)}
                        placeholder="예: 강남구"
                        className={fieldCls}
                      />
                    </div>
                  </div>

                  {/* 3. 반려동물 정보 */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className={labelCls}>반려동물 종류 *</label>
                      <select
                        value={petType}
                        onChange={(e) => setPetType(e.target.value)}
                        className={fieldCls}
                      >
                        <option value="">선택</option>
                        {PET_TYPES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>나이</label>
                      <input
                        type="text"
                        value={petAge}
                        onChange={(e) => setPetAge(e.target.value)}
                        placeholder="예: 3살"
                        className={fieldCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>접종 상태</label>
                      <select
                        value={petVaccination}
                        onChange={(e) => setPetVaccination(e.target.value)}
                        className={fieldCls}
                      >
                        <option value="">선택</option>
                        {VACCINATION.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4. 신청 사유 */}
                  <div>
                    <label className={labelCls}>파양/인도 신청 사유 *</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={fieldCls}
                    >
                      <option value="">선택하세요</option>
                      {REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && <p className="text-sm font-medium text-danger">{error}</p>}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-fg hover:text-foreground"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {submitting ? "접수 중..." : "신청서 제출"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
