"use client";

import { useState } from "react";
import { BANNER_PLACEMENTS, BANNER_PLACEMENT_LABELS } from "@/lib/banners/types";
import type { Banner } from "@/lib/banners/types";

interface FormState {
  id: string | null;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  phone: string;
  placements: string[];
  enabled: boolean;
  start_at: string;
  end_at: string;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  description: "",
  image_url: "",
  link_url: "",
  phone: "",
  placements: [],
  enabled: true,
  start_at: "",
  end_at: "",
  sort_order: 0,
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function BannerManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/banners", { cache: "no-store" });
    const data = (await res.json()) as { ok?: boolean; banners?: Banner[] };
    if (data.ok && data.banners) setBanners(data.banners);
  }

  function openCreate() {
    setError(null);
    setForm({ ...EMPTY_FORM });
  }

  function openEdit(b: Banner) {
    setError(null);
    setForm({
      id: b.id,
      title: b.title ?? "",
      description: b.description ?? "",
      image_url: b.image_url ?? "",
      link_url: b.link_url ?? "",
      phone: b.phone ?? "",
      placements: b.placements ?? [],
      enabled: b.enabled,
      start_at: toLocalInput(b.start_at),
      end_at: toLocalInput(b.end_at),
      sort_order: b.sort_order ?? 0,
    });
  }

  function togglePlacement(value: string) {
    setForm((f) =>
      f
        ? {
            ...f,
            placements: f.placements.includes(value)
              ? f.placements.filter((p) => p !== value)
              : [...f.placements, value],
          }
        : f
    );
  }

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/banners/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        setError(data.error || "업로드 실패");
        return;
      }
      setForm((f) => (f ? { ...f, image_url: data.url as string } : f));
    } catch {
      setError("업로드 중 네트워크 오류");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form) return;
    if (form.placements.length === 0) {
      setError("노출영역을 최소 1개 선택해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      id: form.id ?? undefined,
      title: form.title,
      description: form.description,
      image_url: form.image_url,
      link_url: form.link_url,
      phone: form.phone,
      placements: form.placements,
      enabled: form.enabled,
      start_at: fromLocalInput(form.start_at),
      end_at: fromLocalInput(form.end_at),
      sort_order: Number(form.sort_order) || 0,
    };
    try {
      const res = await fetch("/api/admin/banners", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "저장 실패");
        return;
      }
      setForm(null);
      await refresh();
    } catch {
      setError("저장 중 네트워크 오류");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(b: Banner) {
    await fetch("/api/admin/banners", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, enabled: !b.enabled }),
    });
    await refresh();
  }

  async function remove(b: Banner) {
    if (!confirm("이 배너를 삭제할까요?")) return;
    await fetch(`/api/admin/banners?id=${encodeURIComponent(b.id)}`, { method: "DELETE" });
    await refresh();
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-fg">
          등록된 배너 <span className="font-semibold text-foreground">{banners.length}</span>개
        </p>
        {!form && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
          >
            + 새 배너
          </button>
        )}
      </div>

      {form && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">
            {form.id ? "배너 수정" : "새 배너 등록"}
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-muted-fg sm:col-span-2">
              제목 (선택)
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
                placeholder="예: 행복이네 보호소 · 무료분양 안내"
              />
            </label>

            <label className="block text-xs font-medium text-muted-fg sm:col-span-2">
              설명 (선택)
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputCls} min-h-[72px] resize-y`}
                placeholder="배너에 노출할 문구 (비우면 이미지만 노출)"
              />
            </label>

            <label className="block text-xs font-medium text-muted-fg sm:col-span-2">
              홈페이지 바로가기 URL (선택)
              <input
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                className={inputCls}
                placeholder="https://..."
              />
            </label>

            <label className="block text-xs font-medium text-muted-fg">
              전화번호 (선택)
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputCls}
                placeholder="010-0000-0000"
              />
            </label>

            <label className="block text-xs font-medium text-muted-fg">
              정렬 순서 (작을수록 먼저)
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className={inputCls}
              />
            </label>

            <label className="block text-xs font-medium text-muted-fg">
              노출 시작 (선택)
              <input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                className={inputCls}
              />
            </label>

            <label className="block text-xs font-medium text-muted-fg">
              노출 종료 (선택)
              <input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                className={inputCls}
              />
            </label>
          </div>

          {/* 이미지 */}
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-fg">배경 이미지 (선택)</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium">
                {uploading ? "업로드 중…" : "이미지 업로드"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image_url: "" })}
                  className="text-xs text-danger"
                >
                  이미지 제거
                </button>
              )}
            </div>
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className={inputCls}
              placeholder="또는 이미지 URL 직접 입력"
            />
            {form.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image_url}
                alt="미리보기"
                className="mt-2 max-h-40 rounded-lg border border-border object-contain"
              />
            )}
          </div>

          {/* 노출영역 */}
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-fg">
              노출영역 (선택한 카테고리에만 표시)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {BANNER_PLACEMENTS.map((p) => {
                const on = form.placements.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePlacement(p.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      on
                        ? "border-accent bg-accent text-accent-fg"
                        : "border-border bg-card text-muted-fg hover:border-accent/40"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 활성화 */}
          <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            노출 활성화 (ON)
          </label>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      <div className="mt-6 space-y-3">
        {banners.length === 0 && !form && (
          <p className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-fg">
            등록된 배너가 없습니다. “+ 새 배너”로 추가해 주세요.
          </p>
        )}
        {banners.map((b) => (
          <article
            key={b.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
          >
            {b.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.image_url}
                alt=""
                className="h-16 w-28 shrink-0 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-[10px] text-muted-fg">
                이미지 없음
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    b.enabled ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                />
                <p className="truncate font-semibold text-foreground">
                  {b.title || (b.image_url ? "(이미지 전용 배너)" : "(제목 없음)")}
                </p>
              </div>
              {b.description && (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-fg">{b.description}</p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {b.placements.map((p) => (
                  <span
                    key={p}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-fg"
                  >
                    {BANNER_PLACEMENT_LABELS[p] || p}
                  </span>
                ))}
              </div>
              {(b.start_at || b.end_at) && (
                <p className="mt-1 text-[11px] text-muted-fg">
                  {b.start_at ? new Date(b.start_at).toLocaleString("ko-KR") : "제한없음"}
                  {" ~ "}
                  {b.end_at ? new Date(b.end_at).toLocaleString("ko-KR") : "제한없음"}
                </p>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => toggleEnabled(b)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
              >
                {b.enabled ? "OFF" : "ON"}
              </button>
              <button
                type="button"
                onClick={() => openEdit(b)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => remove(b)}
                className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger"
              >
                삭제
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
