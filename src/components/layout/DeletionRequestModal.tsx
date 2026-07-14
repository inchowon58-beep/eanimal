"use client";

import { useEffect, useId, useState } from "react";

export default function DeletionRequestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const [businessName, setBusinessName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMessage(null);
    setError(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, targetUrl, reason }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "요청 저장에 실패했습니다.");
        return;
      }
      setMessage("삭제 요청이 등록되었습니다. 확인 후 처리하겠습니다.");
      setBusinessName("");
      setTargetUrl("");
      setReason("");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            정보삭제요청
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-fg hover:text-foreground"
          >
            닫기
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-fg">
          잘못된 정보가 있으면 아래 양식으로 삭제 요청을 남겨 주세요.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block text-xs font-medium text-muted-fg">
            1. 상호/시설명
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
            />
          </label>
          <label className="block text-xs font-medium text-muted-fg">
            2. 삭제대상 URL
            <input
              required
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://www.eanimal.kr/places/..."
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
            />
          </label>
          <label className="block text-xs font-medium text-muted-fg">
            3. 요청사유
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}
          {message && <p className="text-sm text-success">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-lg bg-accent text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {loading ? "등록 중…" : "요청 등록"}
          </button>
        </form>
      </div>
    </div>
  );
}
