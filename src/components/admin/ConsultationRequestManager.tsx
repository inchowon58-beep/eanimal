"use client";

import { useState } from "react";
import { getCategory } from "@/lib/seo-pages/categories";

export interface ConsultationRow {
  id: string;
  category: string | null;
  name: string;
  phone: string;
  answers: Record<string, string> | null;
  source_keyword: string | null;
  source_slug: string | null;
  page_url: string | null;
  referrer: string | null;
  status: string;
  created_at: string;
}

export default function ConsultationRequestManager({
  initialRows,
}: {
  initialRows: ConsultationRow[];
}) {
  const [rows, setRows] = useState<ConsultationRow[]>(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const categoriesInUse = Array.from(
    new Set(rows.map((r) => r.category || "").filter(Boolean))
  );
  const visible = filter === "all" ? rows : rows.filter((r) => (r.category || "") === filter);

  async function toggleStatus(row: ConsultationRow) {
    const done = row.status !== "done";
    setBusyId(row.id);
    try {
      const res = await fetch("/api/admin/consultation-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, done }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: d.status } : r)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function removeRow(row: ConsultationRow) {
    if (!confirm("이 상담 신청을 삭제할까요?")) return;
    setBusyId(row.id);
    try {
      const res = await fetch(
        `/api/admin/consultation-requests?id=${encodeURIComponent(row.id)}`,
        { method: "DELETE" }
      );
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) setRows((rs) => rs.filter((r) => r.id !== row.id));
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return <p className="mt-10 text-sm text-muted-fg">접수된 상담 신청이 없습니다.</p>;
  }

  return (
    <div className="mt-8">
      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            filter === "all"
              ? "border-accent bg-accent text-white"
              : "border-border bg-card text-muted-fg hover:text-foreground"
          }`}
        >
          전체 ({rows.length})
        </button>
        {categoriesInUse.map((cid) => {
          const label = getCategory(cid)?.label || cid;
          const count = rows.filter((r) => (r.category || "") === cid).length;
          return (
            <button
              key={cid}
              type="button"
              onClick={() => setFilter(cid)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filter === cid
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-muted-fg hover:text-foreground"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {visible.map((row) => {
          const done = row.status === "done";
          const busy = busyId === row.id;
          const catLabel = getCategory(row.category)?.label || row.category || "미지정";
          const answers = row.answers || {};
          return (
            <article key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-accent/12 px-2.5 py-0.5 text-xs font-bold text-accent">
                      {catLabel}
                    </span>
                    <h2 className="font-semibold text-foreground">{row.name}</h2>
                    <a
                      href={`tel:${row.phone.replace(/[^0-9+]/g, "")}`}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      {row.phone}
                    </a>
                  </div>
                  <span className="mt-1 block text-xs text-muted-fg">
                    {new Date(row.created_at).toLocaleString("ko-KR")}
                    {row.source_keyword ? ` · 키워드: ${row.source_keyword}` : ""}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleStatus(row)}
                    disabled={busy}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                      done
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {busy ? "처리 중…" : done ? "상담완료" : "상담대기"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(row)}
                    disabled={busy}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    삭제
                  </button>
                </div>
              </div>

              {Object.keys(answers).length > 0 && (
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 border-t border-border pt-3 sm:grid-cols-2">
                  {Object.entries(answers).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm">
                      <dt className="shrink-0 font-medium text-muted-fg">{k}</dt>
                      <dd className="min-w-0 whitespace-pre-wrap break-words text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
