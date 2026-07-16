"use client";

import { useMemo, useState } from "react";
import { consultFormTitle, type ConsultField } from "@/lib/consultation/forms";

interface Props {
  category: string | null | undefined;
  categoryLabel?: string;
  keyword?: string;
  slug?: string;
  intro: string;
  fields: ConsultField[];
}

const SUCCESS_MSG =
  "접수가 완료되었습니다. 반려문화위원회 배정 상담사가 영업일 기준 24시간 이내에 순차적으로 연락을 드립니다.";

const NOTICE_LINES = [
  "실소유자가 아닌 외부 유기견·유기묘 접수는 지자체를 통해 접수하셔야 합니다.",
  "해당 파양·안심보호 신청은 개인 사정으로 더 이상 보호가 어려운 경우에 한해 접수되며, 1곳 이상의 선별된 업체에서 상담이 이루어질 수 있습니다.",
  "유기견·유기묘 또는 개인 상황에 의한 파양 및 무료입양 외에는 상담사 연결 접수가 처리되지 않을 수 있습니다.",
];

const PRIVACY_SUMMARY =
  "수집항목: 이름, 연락처, 주소, 문의내용, 접속정보(IP·유입경로) | 이용목적: 상담 신청 확인 및 안내 | 보유기간: 상담 완료 후 최대 3개월 보관 후 파기 | 동의거부: 거부 시 상담 신청이 제한될 수 있습니다.";

export default function ConsultationForm({
  category,
  categoryLabel,
  keyword,
  slug,
  intro,
  fields,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const setAnswer = (id: string, v: string) => setAnswers((a) => ({ ...a, [id]: v }));

  const canSubmit = useMemo(() => {
    if (!name.trim() || !phone.trim() || !agreed) return false;
    for (const fld of fields) {
      if (fld.required && !(answers[fld.id] || "").trim()) return false;
    }
    return true;
  }, [name, phone, agreed, fields, answers]);

  async function submit() {
    setError("");
    if (!canSubmit) {
      setError("필수 항목과 개인정보 동의를 확인해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const labeled: Record<string, string> = {};
      for (const fld of fields) {
        const v = (answers[fld.id] || "").trim();
        if (v) labeled[fld.label] = v;
      }
      const res = await fetch("/api/consultation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category || "",
          name,
          phone,
          answers: labeled,
          agreed,
          sourceSlug: slug || "",
          sourceKeyword: keyword || "",
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        setDone(true);
      } else {
        setError(d.error || "접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
    setSubmitting(false);
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent";
  const labelCls = "text-xs font-semibold text-foreground";
  const showNotice = category === "shelter";
  const formTitle = consultFormTitle(category);

  return (
    <section id="consult-form" className="mt-5 scroll-mt-24">
      <div className="overflow-hidden rounded-2xl border border-accent/40 bg-card shadow-sm">
        {/* 헤더 */}
        <div className="bg-accent px-6 py-5 text-white">
          <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
            공식 · 100% 비대면 접수
          </span>
          <h2 className="mt-2 font-display text-xl font-bold sm:text-2xl">
            반려문화위원회 {formTitle}
          </h2>
          <p className="mt-1 text-sm text-white/90">
            {categoryLabel ? `${categoryLabel} · ` : ""}작성해 주시면 배정 상담사가 직접 연락드립니다.
          </p>
        </div>

      {/* 본문 */}
      <div className="p-6 sm:p-7">
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-3xl text-accent">
              ✓
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">접수 완료</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-fg">{SUCCESS_MSG}</p>
            {showNotice && (
              <ul className="mx-auto mt-4 max-w-md space-y-1.5 rounded-xl bg-muted/30 p-4 text-left text-xs leading-relaxed text-muted-fg">
                {NOTICE_LINES.map((line, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-accent">·</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            {intro && (
              <p className="mb-4 rounded-xl bg-accent/5 px-4 py-3 text-sm leading-relaxed text-foreground">
                {intro}
              </p>
            )}

            {showNotice && (
              <div className="mb-5 rounded-xl border border-amber-300/60 bg-amber-50 p-4">
                <p className="text-xs font-bold text-amber-800">접수 전 꼭 확인해 주세요</p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-amber-800/90">
                  {NOTICE_LINES.map((line, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span>·</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 고정 항목: 이름/연락처 */}
              <div>
                <label className={labelCls}>
                  이름 <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="성함을 입력하세요"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  연락처 <span className="text-accent">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className={inputCls}
                />
              </div>

              {/* 동적 항목 */}
              {fields.map((fld) => (
                <div key={fld.id} className={fld.multiline ? "sm:col-span-2" : ""}>
                  <label className={labelCls}>
                    {fld.label}
                    {fld.required && <span className="text-accent"> *</span>}
                  </label>
                  {fld.multiline ? (
                    <textarea
                      rows={3}
                      value={answers[fld.id] || ""}
                      onChange={(e) => setAnswer(fld.id, e.target.value)}
                      placeholder={`${fld.label}을(를) 입력하세요`}
                      className={`${inputCls} resize-y`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={answers[fld.id] || ""}
                      onChange={(e) => setAnswer(fld.id, e.target.value)}
                      placeholder={`${fld.label} 입력`}
                      className={inputCls}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* 개인정보 동의 */}
            <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs leading-relaxed text-muted-fg">{PRIVACY_SUMMARY}</p>
              <button
                type="button"
                onClick={() => setPolicyOpen((o) => !o)}
                className="mt-2 text-xs font-semibold text-accent hover:underline"
              >
                {policyOpen ? "개인정보 처리방침 접기" : "개인정보 수집·이용 전문 보기"}
              </button>
              {policyOpen && (
                <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-fg">
                  <PolicyText />
                </div>
              )}
              <label className="mt-3 flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                />
                <span className="text-sm font-medium text-foreground">
                  위 개인정보 수집 및 이용에 동의합니다. <span className="text-accent">(필수)</span>
                </span>
              </label>
            </div>

            {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || submitting}
              className="mt-5 w-full rounded-xl bg-accent px-6 py-3.5 text-base font-bold text-white shadow-md shadow-accent/25 transition enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "접수 중..." : "신청하기"}
            </button>
            <p className="mt-2 text-center text-xs text-muted-fg">
              제출 즉시 반려문화위원회에 안전하게 접수됩니다.
            </p>
          </>
        )}
      </div>
    </div>

    {/* 하단 고정 버튼 → 폼으로 스크롤 */}
    {!done && (
      <a
        href="#consult-form"
        className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent/30 transition hover:brightness-95"
      >
        {formTitle}
      </a>
    )}
  </section>
  );
}

function PolicyText() {
  return (
    <div className="space-y-2">
      <div>
        <p className="font-semibold text-foreground">1. 개인정보 수집 항목</p>
        <p>필수항목: 이름, 연락처(휴대전화번호)</p>
        <p>선택항목: 주소, 문의내용, 반려동물 정보</p>
        <p>
          자동수집항목: 접속 IP주소, 접속 일시, 유입 경로(Referrer), 문의 접수 페이지 URL·키워드,
          브라우저 종류(User-Agent)
        </p>
      </div>
      <div>
        <p className="font-semibold text-foreground">2. 개인정보 수집·이용 목적</p>
        <p>상담 신청 접수 및 본인 확인 / 고객 상담 및 안내 / 문의 이력 관리 및 서비스 품질 개선 / 부정·중복 신청 방지 및 분쟁 대응</p>
      </div>
      <div>
        <p className="font-semibold text-foreground">3. 개인정보 보유 및 이용 기간</p>
        <p>
          상담 완료 후 최대 3개월까지 보관한 뒤 지체 없이 파기합니다. 관련 법령에 따라 보존이 필요한
          경우 해당 기간 동안 보관할 수 있습니다.
        </p>
      </div>
      <div>
        <p className="font-semibold text-foreground">4. 개인정보 제3자 제공</p>
        <p>
          원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 사전 동의가 있거나 법령에
          의해 요구되는 경우에 한하여 제공할 수 있습니다.
        </p>
      </div>
      <div>
        <p className="font-semibold text-foreground">5. 개인정보 처리 위탁</p>
        <p>
          원활한 서비스 제공을 위해 호스팅·데이터 저장 등 일부 업무를 외부 전문업체에 위탁할 수
          있으며, 위탁 시 관련 법령에 따라 안전하게 관리합니다.
        </p>
      </div>
      <div>
        <p className="font-semibold text-foreground">6. 동의 거부 권리 및 불이익</p>
        <p>
          이용자는 동의를 거부할 권리가 있습니다. 다만, 필수 항목 동의를 거부할 경우 상담 신청이
          제한될 수 있습니다.
        </p>
      </div>
    </div>
  );
}
