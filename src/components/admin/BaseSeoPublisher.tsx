"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SEO_CATEGORIES } from "@/lib/seo-pages/categories";

interface Row {
  id: string;
  slug: string;
  keyword: string;
  category: string;
  title: string;
  path: string;
  url: string;
  publish_source: string;
  created_at: string;
}

export default function BaseSeoPublisher() {
  const [category, setCategory] = useState(SEO_CATEGORIES[0].id);
  const [keyword, setKeyword] = useState("");
  const [pages, setPages] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/base-seo", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const d = await res.json();
      if (res.ok) setPages(d.pages || []);
    } catch {
      setMessage("목록 로드 실패");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function publishOne(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim() || busy) return;
    setBusy(true);
    setMessage("기본 양식으로 1건 발행 중...");
    try {
      const res = await fetch("/api/admin/base-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          keyword: keyword.trim(),
          category,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(`발행 완료: ${d.page?.path || d.page?.slug}`);
        setKeyword("");
        await load();
      } else {
        setMessage(d.error || "발행 실패");
      }
    } catch {
      setMessage("발행 중 오류가 발생했습니다.");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("이 기본 SEO 페이지를 삭제할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/base-seo?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const d = await res.json().catch(() => ({}));
      setMessage(res.ok ? "삭제되었습니다." : d.error || "삭제 실패");
      if (res.ok) await load();
    } catch {
      setMessage("삭제 중 오류");
    }
    setBusy(false);
  }

  return (
    <div className="mt-8 space-y-6">
      {message && (
        <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-foreground">{message}</p>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-semibold text-foreground">1건 발행 (기본 양식)</h2>
        <p className="mt-1 text-xs text-muted-fg">
          Gemini 없이 카테고리 기본 템플릿으로 생성합니다. 대량은 로컬 실행 도구(
          <code className="text-foreground">tools/base-seo</code>)를 사용하세요.
        </p>

        <p className="mt-4 text-xs font-medium text-muted-fg">카테고리 (기본 페이지)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SEO_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                category === c.id
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-muted-fg hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <form onSubmit={publishOne} className="mt-4 space-y-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: 안산 강아지보호소, 수원 동물병원"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy || !keyword.trim()}
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "발행 중..." : "1건 발행"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">
            발행된 기본 SEO ({pages.length})
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-fg hover:text-foreground disabled:opacity-50"
          >
            새로고침
          </button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted-fg">로딩 중...</p>
        ) : pages.length === 0 ? (
          <p className="mt-4 text-sm text-muted-fg">아직 발행된 페이지가 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {pages.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{p.title}</p>
                  <p className="mt-1 break-all text-xs text-muted-fg">
                    {p.keyword} · {p.category} · {p.path} · {p.publish_source}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={p.path}
                    target="_blank"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground"
                  >
                    보기
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(p.url);
                      setMessage("URL 복사됨");
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-fg hover:text-foreground"
                  >
                    링크복사
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(p.id)}
                    className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs text-danger"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
