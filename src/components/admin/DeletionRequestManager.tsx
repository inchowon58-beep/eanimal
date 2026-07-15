"use client";

import { useState } from "react";

export interface DeletionRequestRow {
  id: string;
  business_name: string;
  target_url: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function DeletionRequestManager({
  initialRows,
}: {
  initialRows: DeletionRequestRow[];
}) {
  const [rows, setRows] = useState<DeletionRequestRow[]>(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, { ok: boolean; text: string }>>({});

  function setNote(id: string, ok: boolean, text: string) {
    setNotes((n) => ({ ...n, [id]: { ok, text } }));
  }

  async function toggleStatus(row: DeletionRequestRow) {
    const done = row.status !== "done";
    setBusyId(row.id);
    setNote(row.id, true, "");
    try {
      const res = await fetch("/api/admin/deletion-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, done }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        status?: string;
        matched?: number | null;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setNote(row.id, false, data.error || "처리 실패");
        return;
      }
      setRows((rs) =>
        rs.map((r) => (r.id === row.id ? { ...r, status: data.status || "pending" } : r))
      );
      if (done) {
        setNote(
          row.id,
          true,
          data.matched
            ? `페이지 ${data.matched}건을 숨김 처리했습니다.`
            : "완료 처리했지만 일치하는 페이지를 찾지 못했습니다. URL을 확인해 주세요."
        );
      } else {
        setNote(row.id, true, "페이지를 다시 노출(복원)했습니다.");
      }
    } catch {
      setNote(row.id, false, "네트워크 오류");
    } finally {
      setBusyId(null);
    }
  }

  async function removeRow(row: DeletionRequestRow) {
    if (!confirm("이 요청 내역을 삭제할까요? (페이지 노출 상태는 변경되지 않습니다)")) return;
    setBusyId(row.id);
    try {
      const res = await fetch(
        `/api/admin/deletion-requests?id=${encodeURIComponent(row.id)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setNote(row.id, false, data.error || "삭제 실패");
        return;
      }
      setRows((rs) => rs.filter((r) => r.id !== row.id));
    } catch {
      setNote(row.id, false, "네트워크 오류");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return <p className="mt-10 text-sm text-muted-fg">등록된 삭제 요청이 없습니다.</p>;
  }

  return (
    <div className="mt-8 space-y-3">
      {rows.map((row) => {
        const done = row.status === "done";
        const busy = busyId === row.id;
        const note = notes[row.id];
        return (
          <article key={row.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-semibold text-foreground">{row.business_name}</h2>
                <span className="text-xs text-muted-fg">
                  {new Date(row.created_at).toLocaleString("ko-KR")}
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
                  title={done ? "클릭 시 다시 노출(복원)" : "클릭 시 해당 페이지 숨김 처리"}
                >
                  {busy ? "처리 중…" : done ? "삭제완료" : "삭제대기"}
                </button>
                <button
                  type="button"
                  onClick={() => removeRow(row)}
                  disabled={busy}
                  className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger disabled:opacity-60"
                >
                  요청삭제
                </button>
              </div>
            </div>

            <p className="mt-2 break-all text-sm text-accent">
              <a href={row.target_url} target="_blank" rel="noreferrer">
                {row.target_url}
              </a>
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-fg">{row.reason}</p>

            {note?.text && (
              <p
                className={`mt-2 text-xs ${
                  note.ok ? "text-emerald-600" : "text-danger"
                }`}
              >
                {note.text}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
