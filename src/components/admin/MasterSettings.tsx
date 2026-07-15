"use client";

import { useState } from "react";

export default function MasterSettings() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [dailyLimit, setDailyLimit] = useState(10);
  const [expiresDate, setExpiresDate] = useState(""); // yyyy-mm-dd (빈값 = 무제한)
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function applySettings(s: { dailyLimit: number; serviceExpiresAt: string | null }) {
    setDailyLimit(s.dailyLimit ?? 10);
    setExpiresDate(s.serviceExpiresAt ? s.serviceExpiresAt.slice(0, 10) : "");
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auth", password }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        applySettings(d.settings);
        setUnlocked(true);
      } else {
        setMessage(d.error || "인증 실패");
      }
    } catch {
      setMessage("인증 중 오류가 발생했습니다.");
    }
    setBusy(false);
  }

  async function save() {
    setBusy(true);
    setMessage("저장 중...");
    try {
      const serviceExpiresAt = expiresDate ? `${expiresDate}T23:59:59+09:00` : null;
      const res = await fetch("/api/admin/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          password,
          dailyLimit: Number(dailyLimit) || 0,
          serviceExpiresAt,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        applySettings(d.settings);
        setMessage("저장되었습니다.");
      } else {
        setMessage(d.error || "저장 실패");
      }
    } catch {
      setMessage("저장 중 오류가 발생했습니다.");
    }
    setBusy(false);
  }

  function addDays(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiresDate(d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }));
  }

  if (!unlocked) {
    return (
      <form
        onSubmit={unlock}
        className="mt-8 max-w-sm rounded-2xl border border-border bg-card p-6"
      >
        <h2 className="font-semibold text-foreground">마스터 인증</h2>
        <p className="mt-1 text-sm text-muted-fg">마스터 비밀번호를 입력하세요.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="마스터 비밀번호"
          className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          autoFocus
        />
        {message && <p className="mt-2 text-sm text-danger">{message}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "확인 중..." : "잠금 해제"}
        </button>
      </form>
    );
  }

  return (
    <div className="mt-8 max-w-xl space-y-6">
      {message && (
        <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-foreground">{message}</p>
      )}

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground">하루 발행 수량</h2>
        <p className="mt-1 text-sm text-muted-fg">
          하루(KST 기준)에 생성 가능한 SEO 페이지 수량입니다.
        </p>
        <input
          type="number"
          min={0}
          value={dailyLimit}
          onChange={(e) => setDailyLimit(Number(e.target.value))}
          className="mt-4 w-40 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground">SEO 페이지 사용가능일</h2>
        <p className="mt-1 text-sm text-muted-fg">
          이 날짜까지 생성이 가능합니다. 비워두면 무제한으로 사용합니다.
        </p>
        <input
          type="date"
          value={expiresDate}
          onChange={(e) => setExpiresDate(e.target.value)}
          className="mt-4 w-52 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["+30일", 30],
            ["+90일", 90],
            ["+365일", 365],
          ].map(([label, days]) => (
            <button
              key={label}
              type="button"
              onClick={() => addDays(days as number)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-fg hover:text-foreground"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setExpiresDate("")}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-fg hover:text-foreground"
          >
            무제한
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "저장 중..." : "설정 저장"}
      </button>
    </div>
  );
}
