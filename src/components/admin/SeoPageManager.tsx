"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SEO_CATEGORIES } from "@/lib/seo-pages/categories";
import type { ConsultField } from "@/lib/consultation/forms";

interface SeoPageRow {
  id: string;
  slug: string;
  keyword: string;
  title: string;
  created_at: string;
  copied_at?: string | null;
}

interface CategoryForm {
  intro: string;
  fields: ConsultField[];
}

interface CategoryRow {
  id: string;
  label: string;
  topic: string;
  pool: string;
  imageFolder: string;
  form: CategoryForm;
  formCustomized: boolean;
  telegram: string[];
  isDefault: boolean;
}

interface CopyState {
  items: { id: string; slug: string }[];
  total: number;
  copied: number;
  remaining: number;
}

interface JobRow {
  id: string;
  keyword: string;
  status: string;
  requested_at: string;
  error: string | null;
}

interface Quota {
  limit: number;
  used: number;
  remaining: number;
  today: string;
  service: { active: boolean; expired: boolean; expiresAt: string | null; daysRemaining: number };
}

interface Summary {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

type CreateMode = "single" | "bulk" | "file";
type QueueView = "pending" | "processing" | "completed" | "failed" | "all";

const LIST_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  processing: "생성중",
  completed: "완료",
  failed: "실패",
};

export default function SeoPageManager() {
  const [pages, setPages] = useState<SeoPageRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pendingText, setPendingText] = useState("");
  const [quota, setQuota] = useState<Quota | null>(null);

  const [mode, setMode] = useState<CreateMode>("single");
  const [keyword, setKeyword] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [queueView, setQueueView] = useState<QueueView>("pending");
  const [listPage, setListPage] = useState(1);

  const [category, setCategory] = useState<string>(SEO_CATEGORIES[0].id);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [poolText, setPoolText] = useState("");
  const [imageFolder, setImageFolder] = useState("");
  const [poolSaving, setPoolSaving] = useState(false);
  const [imgPreview, setImgPreview] = useState<{ count: number; sample: string[] } | null>(null);
  const [imgChecking, setImgChecking] = useState(false);

  const [formIntro, setFormIntro] = useState("");
  const [formFields, setFormFields] = useState<ConsultField[]>([]);
  const [formSaving, setFormSaving] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [telegramText, setTelegramText] = useState("");
  const [tgConfigured, setTgConfigured] = useState<boolean | null>(null);
  const [tgChats, setTgChats] = useState<{ id: string; name: string; type: string }[]>([]);
  const [tgBusy, setTgBusy] = useState(false);

  const [copyState, setCopyState] = useState<CopyState | null>(null);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pagesRes, queueRes, quotaRes, copyRes] = await Promise.all([
        fetch("/api/admin/seo-pages", { cache: "no-store" }),
        fetch(`/api/admin/seo-queue?category=${encodeURIComponent(category)}`, {
          cache: "no-store",
        }),
        fetch("/api/admin/seo-quota", { cache: "no-store" }),
        fetch("/api/admin/seo-pages/copy-batch", { cache: "no-store" }),
      ]);
      if (pagesRes.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (pagesRes.ok) {
        const d = await pagesRes.json();
        setPages(d.pages || []);
      }
      if (queueRes.ok) {
        const d = await queueRes.json();
        setSummary(d.summary || null);
        setJobs(d.jobs || []);
        setPendingText(d.pendingText || "");
      }
      if (quotaRes.ok) setQuota(await quotaRes.json());
      if (copyRes.ok) {
        const d = await copyRes.json();
        setCopyState({
          items: d.items || [],
          total: d.total || 0,
          copied: d.copied || 0,
          remaining: d.remaining || 0,
        });
      }
    } catch {
      setMessage("데이터 로드 실패");
    }
    setLoading(false);
  }, [category]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // 카테고리 목록 + 저장된 풀 로드 (최초 1회)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/seo-categories", { cache: "no-store" });
        if (!res.ok) return;
        const d = await res.json();
        if (!alive) return;
        setCategories(d.categories || []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 선택된 카테고리의 풀/이미지폴더를 편집 영역에 반영
  useEffect(() => {
    const row = categories.find((c) => c.id === category);
    if (row) {
      setPoolText(row.pool);
      setImageFolder(row.imageFolder || "");
      setFormIntro(row.form?.intro || "");
      setFormFields(row.form?.fields ? row.form.fields.map((f) => ({ ...f })) : []);
      setTelegramText((row.telegram || []).join("\n"));
    }
    setImgPreview(null);
  }, [categories, category]);

  const serviceActive = !quota || quota.service.active;
  const canGenerate = serviceActive && (!quota || quota.remaining > 0);

  const totalListPages = Math.max(1, Math.ceil(pages.length / LIST_SIZE));
  const paginated = useMemo(
    () => pages.slice((listPage - 1) * LIST_SIZE, listPage * LIST_SIZE),
    [pages, listPage]
  );
  const filteredJobs = useMemo(
    () => (queueView === "all" ? jobs : jobs.filter((j) => j.status === queueView)),
    [jobs, queueView]
  );

  useEffect(() => {
    if (listPage > totalListPages) setListPage(totalListPages);
  }, [listPage, totalListPages]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim() || busy) return;
    setBusy(true);
    setMessage("콘텐츠 생성 중...");
    try {
      const res = await fetch("/api/admin/seo-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), category }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(`"${d.page?.title || keyword}" 생성 완료`);
        setKeyword("");
        setListPage(1);
        await loadData();
      } else {
        setMessage(d.error || "생성 실패");
      }
    } catch {
      setMessage("생성 중 오류가 발생했습니다.");
    }
    setBusy(false);
  }

  async function enqueue(text: string) {
    if (!text.trim()) {
      setMessage("등록할 키워드를 입력하거나 파일을 선택해주세요.");
      return;
    }
    setBusy(true);
    setMessage("대기열에 등록 중...");
    try {
      const res = await fetch("/api/admin/seo-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, category }),
      });
      const d = await res.json().catch(() => ({}));
      setMessage(d.message || d.error || (res.ok ? "등록 완료" : "등록 실패"));
      if (res.ok) {
        setBulkText("");
        await loadData();
      }
    } catch {
      setMessage("대량 등록 중 오류가 발생했습니다.");
    }
    setBusy(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setMessage("TXT 파일만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      setBulkText(text);
      await enqueue(text);
    } catch {
      setMessage("파일을 읽는 중 오류가 발생했습니다.");
    }
    e.target.value = "";
  }

  async function savePending() {
    if (!confirm("대기 중 키워드 목록을 아래 내용으로 교체합니다. (생성중/완료/실패 기록은 유지)")) {
      return;
    }
    setBusy(true);
    setMessage("대기열 저장 중...");
    try {
      const res = await fetch("/api/admin/seo-queue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pendingText, category }),
      });
      const d = await res.json().catch(() => ({}));
      setMessage(d.message || d.error || (res.ok ? "저장 완료" : "저장 실패"));
      if (res.ok) await loadData();
    } catch {
      setMessage("대기열 저장 중 오류가 발생했습니다.");
    }
    setBusy(false);
  }

  async function savePool() {
    setPoolSaving(true);
    setMessage("카테고리 설정 저장 중...");
    try {
      const res = await fetch("/api/admin/seo-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category, pool: poolText, imageFolder, telegram: telegramText }),
      });
      const d = await res.json().catch(() => ({}));
      setMessage(d.message || d.error || (res.ok ? "저장 완료" : "저장 실패"));
      if (res.ok) {
        const tgArr = telegramText
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        setCategories((prev) =>
          prev.map((c) =>
            c.id === category
              ? { ...c, pool: poolText, imageFolder, telegram: tgArr, isDefault: false }
              : c
          )
        );
      }
    } catch {
      setMessage("카테고리 설정 저장 중 오류가 발생했습니다.");
    }
    setPoolSaving(false);
  }

  async function checkImages() {
    setImgChecking(true);
    setImgPreview(null);
    try {
      const res = await fetch(
        `/api/admin/seo-categories?folder=${encodeURIComponent(imageFolder)}`,
        { cache: "no-store" }
      );
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setImgPreview({ count: d.count || 0, sample: d.sample || [] });
        setMessage(
          d.count > 0
            ? `이미지 ${d.count}장을 찾았습니다.`
            : "이미지를 찾지 못했습니다. 폴더 URL을 다시 확인하세요."
        );
      } else {
        setMessage(d.error || "이미지 확인 실패");
      }
    } catch {
      setMessage("이미지 확인 중 오류가 발생했습니다.");
    }
    setImgChecking(false);
  }

  async function loadTelegramChats() {
    setTgBusy(true);
    try {
      const res = await fetch("/api/admin/telegram", { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setTgConfigured(Boolean(d.configured));
        setTgChats(d.chats || []);
        if (!d.configured) {
          setMessage("봇 토큰(TELEGRAM_BOT_TOKEN)이 설정되지 않았습니다.");
        } else if ((d.chats || []).length === 0) {
          setMessage("최근 대화가 없습니다. 봇에게 먼저 메시지를 보내거나 그룹에 봇을 초대하세요.");
        } else {
          setMessage(`대화 ${d.chats.length}건을 불러왔습니다.`);
        }
      } else {
        setMessage(d.error || "불러오기 실패");
      }
    } catch {
      setMessage("텔레그램 대화 목록을 불러오지 못했습니다.");
    }
    setTgBusy(false);
  }

  async function testTelegram(chatId: string) {
    if (!chatId.trim()) {
      setMessage("먼저 chat_id를 입력하세요.");
      return;
    }
    setTgBusy(true);
    try {
      const res = await fetch("/api/admin/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatId.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      setMessage(res.ok ? "테스트 메시지를 발송했습니다." : d.error || "발송 실패");
    } catch {
      setMessage("테스트 발송 중 오류가 발생했습니다.");
    }
    setTgBusy(false);
  }

  function addTelegramId(id: string) {
    setTelegramText((prev) => {
      const set = new Set(
        prev
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      );
      set.add(id);
      return Array.from(set).join("\n");
    });
  }

  function addFormField() {
    setFormFields((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 10), label: "", required: false, multiline: false },
    ]);
  }

  function updateFormField(id: string, patch: Partial<ConsultField>) {
    setFormFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeFormField(id: string) {
    setFormFields((prev) => prev.filter((f) => f.id !== id));
  }

  function moveFormField(id: string, dir: -1 | 1) {
    setFormFields((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  }

  async function saveForm() {
    const cleaned = formFields
      .map((f) => ({ ...f, label: f.label.trim() }))
      .filter((f) => f.label);
    const form = { intro: formIntro.trim(), fields: cleaned };
    setFormSaving(true);
    setMessage("신청서 양식 저장 중...");
    try {
      const res = await fetch("/api/admin/seo-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category, form }),
      });
      const d = await res.json().catch(() => ({}));
      setMessage(d.message || d.error || (res.ok ? "신청서 양식을 저장했습니다." : "저장 실패"));
      if (res.ok) {
        setFormFields(cleaned);
        setCategories((prev) =>
          prev.map((c) => (c.id === category ? { ...c, form, formCustomized: true } : c))
        );
      }
    } catch {
      setMessage("신청서 양식 저장 중 오류가 발생했습니다.");
    }
    setFormSaving(false);
  }

  async function deletePage(id: string) {
    if (!confirm("이 SEO 페이지를 삭제하시겠습니까?")) return;
    await fetch(`/api/admin/seo-pages?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadData();
  }

  async function copyBatchUrls() {
    if (busy) return;
    const items = copyState?.items ?? [];
    if (items.length === 0) {
      setMessage("복사할 새 주소가 없습니다. (모두 복사됨)");
      return;
    }
    const origin = window.location.origin;
    const text = items.map((i) => `${origin}/guide/${i.slug}`).join("\n");
    setBusy(true);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setBusy(false);
      setMessage("클립보드 복사에 실패했습니다. 브라우저 권한을 확인하세요.");
      return;
    }
    try {
      await fetch("/api/admin/seo-pages/copy-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((i) => i.id) }),
      });
      setMessage(`${items.length}개 주소를 복사했습니다. 다음 복사 시 제외됩니다.`);
      await loadData();
    } catch {
      setMessage("복사 기록 저장에 실패했습니다.");
    }
    setBusy(false);
  }

  async function resetCopyHistory() {
    if (!confirm("복사 기록을 초기화하면 모든 주소가 다시 복사 대상이 됩니다. 계속할까요?")) {
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/admin/seo-pages/copy-batch", { method: "DELETE" });
      setMessage("복사 기록을 초기화했습니다.");
      await loadData();
    } catch {
      setMessage("초기화에 실패했습니다.");
    }
    setBusy(false);
  }

  async function copyLink(slug: string, id: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/guide/${slug}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setMessage("링크 복사에 실패했습니다.");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {quota && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            serviceActive && quota.remaining > 0
              ? "border-border bg-card text-foreground"
              : "border-danger/30 bg-danger/5 text-danger"
          }`}
        >
          <span className="font-medium">
            사용가능일{" "}
            <span className="text-accent">
              {quota.service.daysRemaining < 0 ? "무제한" : `${quota.service.daysRemaining}일`}
            </span>
            {quota.service.expiresAt && (
              <span className="text-muted-fg"> (만료 {quota.service.expiresAt})</span>
            )}
          </span>
          <span className="mx-2 text-border">|</span>
          <span className="font-medium">
            오늘 발행 가능 <span className="text-accent">{quota.remaining}개</span>
            <span className="text-muted-fg"> / {quota.limit}개</span>
          </span>
        </div>
      )}

      {message && (
        <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-foreground">{message}</p>
      )}

      {/* 생성 */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-semibold text-foreground">SEO 페이지 생성</h2>

        {/* 카테고리 선택 */}
        <p className="mt-4 text-xs font-medium text-muted-fg">카테고리</p>
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

        {/* 카테고리 설정 토글 */}
        <button
          type="button"
          onClick={() => setConfigOpen((o) => !o)}
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-left transition hover:bg-muted/50"
        >
          <span className="text-sm font-semibold text-foreground">
            카테고리 설정{" "}
            <span className="text-xs font-normal text-muted-fg">
              (연관 키워드 · 이미지 폴더 · 상담 신청서 양식)
            </span>
          </span>
          <span className={`text-muted-fg transition-transform ${configOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {/* 연관 키워드 풀 */}
        {configOpen && (
        <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              연관 키워드{" "}
                (쉼표로 구분 · 생성 시 랜덤 3개: 제목 1개 · 본문 3개 · 지역 롱테일 힌트)
              </span>
            </p>
            <button
              type="button"
              onClick={savePool}
              disabled={poolSaving}
              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-bold text-background disabled:opacity-50"
            >
              {poolSaving ? "저장 중..." : "카테고리 설정 저장"}
            </button>
          </div>
          <textarea
            value={poolText}
            onChange={(e) => setPoolText(e.target.value)}
            rows={3}
            placeholder="예: 강아지보호소, 유기견입양, 유기견보호센터, 강아지무료분양"
            className="mt-3 w-full resize-y rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <p className="mt-2 text-xs text-muted-fg">
            생성 시: 연관 3개 중 1개는 제목, 3개 모두 본문 · 지역이 있으면 롱테일 힌트 1~2개 ·
            메타설명 네이버 스니펫(약 140자) · 페이지에는 동종 칩바·지역 연관어·내부링크가
            붙습니다.
          </p>

          {/* 이미지 설정 */}
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground">이미지 폴더</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={imageFolder}
                onChange={(e) => setImageFolder(e.target.value)}
                placeholder="예: https://image.cattery.co.kr/dogboho"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={checkImages}
                disabled={imgChecking}
                className="shrink-0 rounded-xl border border-accent px-4 py-2.5 text-sm font-bold text-accent disabled:opacity-50"
              >
                {imgChecking ? "확인 중..." : "이미지 확인"}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-fg">
              폴더 URL을 입력하세요 (예:{" "}
              <strong className="text-foreground">https://image.cattery.co.kr/dogboho</strong>)
            </p>
            {imgPreview && (
              <div className="mt-3 rounded-xl border border-border bg-background p-3">
                <p className="text-xs font-medium text-foreground">
                  감지된 이미지{" "}
                  <span className={imgPreview.count > 0 ? "text-accent" : "text-danger"}>
                    {imgPreview.count}장
                  </span>
                </p>
                {imgPreview.sample.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {imgPreview.sample.map((u) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={u}
                        src={u}
                        alt=""
                        className="h-14 w-14 rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                )}
                {imgPreview.count === 0 && (
                  <p className="mt-1 text-xs text-danger">
                    이미지를 찾지 못했습니다. 폴더 URL을 다시 확인하세요.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 상담 신청서 양식 */}
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                상담 신청서 양식{" "}
                <span className="text-xs font-normal text-muted-fg">
                  (이름·연락처는 항상 포함 · 추가 항목은 고객이 직접 입력)
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addFormField}
                  className="rounded-lg border border-accent px-3 py-1.5 text-xs font-bold text-accent"
                >
                  + 양식 추가
                </button>
                <button
                  type="button"
                  onClick={saveForm}
                  disabled={formSaving}
                  className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-bold text-background disabled:opacity-50"
                >
                  {formSaving ? "저장 중..." : "양식 저장"}
                </button>
              </div>
            </div>

            <label className="mt-3 block text-xs font-medium text-muted-fg">안내 문구</label>
            <textarea
              value={formIntro}
              onChange={(e) => setFormIntro(e.target.value)}
              rows={2}
              placeholder="예: 고민 중이신가요? 편하게 상담을 요청해 보세요."
              className="mt-1 w-full resize-y rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />

            <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-fg">
              <span className="rounded bg-accent/12 px-2 py-0.5 font-semibold text-accent">고정</span>
              이름 · 연락처 (모든 양식에 자동 포함, 필수)
            </div>

            {formFields.length === 0 ? (
              <p className="mt-2 text-xs text-muted-fg">
                추가 항목이 없습니다. <strong className="text-foreground">+ 양식 추가</strong>로 입력
                항목을 만드세요. (아무것도 없으면 방문자에게 기본 약식 폼이 노출됩니다)
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {formFields.map((fld, idx) => (
                  <li
                    key={fld.id}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-2.5"
                  >
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveFormField(fld.id, -1)}
                        disabled={idx === 0}
                        className="px-1 text-xs text-muted-fg disabled:opacity-30"
                        title="위로"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFormField(fld.id, 1)}
                        disabled={idx === formFields.length - 1}
                        className="px-1 text-xs text-muted-fg disabled:opacity-30"
                        title="아래로"
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      type="text"
                      value={fld.label}
                      onChange={(e) => updateFormField(fld.id, { label: e.target.value })}
                      placeholder="항목명 (예: 품종, 나이, 성격...)"
                      className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <label className="flex items-center gap-1 text-xs text-muted-fg">
                      <input
                        type="checkbox"
                        checked={fld.required}
                        onChange={(e) => updateFormField(fld.id, { required: e.target.checked })}
                        className="h-3.5 w-3.5 accent-[var(--accent)]"
                      />
                      필수
                    </label>
                    <label className="flex items-center gap-1 text-xs text-muted-fg">
                      <input
                        type="checkbox"
                        checked={fld.multiline}
                        onChange={(e) => updateFormField(fld.id, { multiline: e.target.checked })}
                        className="h-3.5 w-3.5 accent-[var(--accent)]"
                      />
                      여러줄
                    </label>
                    <button
                      type="button"
                      onClick={() => removeFormField(fld.id)}
                      className="rounded-lg border border-danger/40 px-2.5 py-1 text-xs text-danger"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 텔레그램 알림 */}
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                텔레그램 알림 수신 대상{" "}
                <span className="text-xs font-normal text-muted-fg">
                  (이 카테고리 신청이 오면 아래 chat_id로 전송)
                </span>
              </p>
              <button
                type="button"
                onClick={loadTelegramChats}
                disabled={tgBusy}
                className="rounded-lg border border-accent px-3 py-1.5 text-xs font-bold text-accent disabled:opacity-50"
              >
                {tgBusy ? "불러오는 중..." : "채팅 목록 불러오기"}
              </button>
            </div>

            <textarea
              value={telegramText}
              onChange={(e) => setTelegramText(e.target.value)}
              rows={2}
              placeholder="chat_id를 한 줄에 하나씩 입력 (여러 명이면 여러 줄, 또는 그룹 chat_id 하나)"
              className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => testTelegram(telegramText.split(/[\n,]+/)[0] || "")}
                disabled={tgBusy}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                첫 번째 대상에 테스트 발송
              </button>
              <span className="text-xs text-muted-fg">
                * 변경 후 위 <strong className="text-foreground">카테고리 설정 저장</strong>을 눌러야
                적용됩니다.
              </span>
            </div>

            {tgConfigured === false && (
              <p className="mt-2 text-xs text-danger">
                봇 토큰이 없습니다. Vercel 환경변수 <code>TELEGRAM_BOT_TOKEN</code>을 설정하세요.
              </p>
            )}
            {tgChats.length > 0 && (
              <div className="mt-2 rounded-xl border border-border bg-background p-3">
                <p className="text-xs font-medium text-foreground">최근 대화 (클릭하면 추가)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tgChats.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => addTelegramId(c.id)}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs hover:border-accent"
                      title={`chat_id: ${c.id}`}
                    >
                      {c.name}{" "}
                      <span className="text-muted-fg">
                        ({c.type} · {c.id})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-2 text-xs leading-relaxed text-muted-fg">
              여러 명이 봐야 하면 텔레그램 <strong className="text-foreground">그룹</strong>을 만들어
              봇을 초대한 뒤 그룹 chat_id 하나만 넣거나, 각자의 chat_id를 여러 줄로 넣으세요.
            </p>
          </div>
        </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["single", "개별 등록"],
              ["bulk", "대량 등록 (텍스트)"],
              ["file", "TXT 파일"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                mode === m
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-muted-fg hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "single" && (
          <form onSubmit={handleGenerate} className="mt-4 space-y-3">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="예: 거제 유기견 입양, 강아지 예방접종 시기"
              disabled={!canGenerate}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || !canGenerate}
              className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "생성 중..." : "즉시 생성"}
            </button>
            {!canGenerate && (
              <p className="text-xs text-danger">
                {!serviceActive
                  ? "사용 기간이 만료되었습니다. 마스터설정에서 연장하세요."
                  : "오늘 발행 한도에 도달했습니다."}
              </p>
            )}
          </form>
        )}

        {mode === "bulk" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enqueue(bulkText);
            }}
            className="mt-4 space-y-3"
          >
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={8}
              placeholder={"한 줄에 키워드 하나씩 또는 쉼표(,)로 구분\n\n예:\n거제 유기견 입양\n창원 강아지 무료분양"}
              disabled={!serviceActive}
              className="w-full resize-y rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || !serviceActive}
              className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "등록 중..." : "대기열에 등록"}
            </button>
            <p className="text-xs text-muted-fg">
              대기열에 등록하면 VM 워커가 하루 발행 한도 내에서 1개씩 순차 생성합니다.
            </p>
          </form>
        )}

        {mode === "file" && (
          <div className="mt-4 space-y-3">
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={handleFile}
              disabled={busy || !serviceActive}
              className="block w-full text-sm text-muted-fg file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:font-bold file:text-white"
            />
            <p className="text-xs text-muted-fg">
              한 줄에 키워드 하나, 또는 쉼표(,)로 여러 키워드 구분. 최대 500개.
            </p>
          </div>
        )}
      </section>

      {/* 대기열 */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">
            생성 대기열
            <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
              {SEO_CATEGORIES.find((c) => c.id === category)?.label ?? category}
            </span>
            {summary && (
              <span className="ml-2 text-xs font-normal text-muted-fg">
                대기 {summary.pending} · 생성중 {summary.processing} · 완료 {summary.completed} · 실패{" "}
                {summary.failed}
              </span>
            )}
          </h2>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/admin/seo-queue?download=txt&category=${encodeURIComponent(category)}`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-fg hover:text-foreground"
            >
              TXT 다운로드
            </a>
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-fg hover:text-foreground disabled:opacity-50"
            >
              새로고침
            </button>
            <button
              type="button"
              onClick={savePending}
              disabled={busy || !serviceActive}
              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-bold text-background disabled:opacity-50"
            >
              대기열 저장
            </button>
          </div>
        </div>

        <textarea
          value={pendingText}
          onChange={(e) => setPendingText(e.target.value)}
          rows={8}
          placeholder="대기 중인 키워드가 여기에 표시됩니다."
          disabled={!serviceActive}
          className="mt-4 w-full resize-y rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm outline-none focus:border-accent"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["pending", "대기"],
              ["processing", "생성중"],
              ["completed", "완료"],
              ["failed", "실패"],
              ["all", "전체"],
            ] as const
          ).map(([s, label]) => (
            <button
              key={s}
              type="button"
              onClick={() => setQueueView(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                queueView === s
                  ? "border-accent bg-accent text-white"
                  : "border-border text-muted-fg hover:text-foreground"
              }`}
            >
              {label}
              {summary && s !== "all" && (
                <span className="ml-1 opacity-80">({summary[s as keyof Summary]})</span>
              )}
            </button>
          ))}
        </div>

        {filteredJobs.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border py-4 text-center text-sm text-muted-fg">
            표시할 항목이 없습니다.
          </p>
        ) : (
          <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-fg">키워드</th>
                  <th className="w-20 px-3 py-2 text-left font-medium text-muted-fg">상태</th>
                  <th className="w-36 px-3 py-2 text-left font-medium text-muted-fg">등록일</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((j) => (
                  <tr key={j.id} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">
                      {j.keyword}
                      {j.error && <span className="ml-2 text-xs text-danger">{j.error}</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          j.status === "completed"
                            ? "text-accent"
                            : j.status === "failed"
                              ? "text-danger"
                              : "text-muted-fg"
                        }
                      >
                        {STATUS_LABEL[j.status] || j.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-fg">
                      {j.requested_at.slice(0, 16).replace("T", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 생성된 페이지 */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-semibold text-foreground">생성된 SEO 페이지 ({pages.length})</h2>

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
          <button
            type="button"
            onClick={copyBatchUrls}
            disabled={busy || !copyState || copyState.remaining === 0}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            도메인주소복사{copyState ? ` (다음 ${Math.min(50, copyState.remaining)}개)` : ""}
          </button>
          <span className="text-xs text-muted-fg">
            미복사 <strong className="text-foreground">{copyState?.remaining ?? 0}</strong>개 · 복사됨{" "}
            {copyState?.copied ?? 0}개 · 전체 {copyState?.total ?? 0}개
          </span>
          <button
            type="button"
            onClick={resetCopyHistory}
            disabled={busy}
            className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs text-muted-fg hover:text-foreground disabled:opacity-50"
          >
            복사기록 초기화
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-fg">
          오래된 페이지부터 한 번에 최대 50개씩, 이미 복사한 주소는 제외하고 전체 URL을 한 줄에 하나씩
          클립보드에 복사합니다.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-muted-fg">로딩 중...</p>
        ) : pages.length === 0 ? (
          <p className="mt-4 text-sm text-muted-fg">아직 생성된 페이지가 없습니다.</p>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              {paginated.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {p.title}
                      {p.copied_at && (
                        <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                          복사됨
                        </span>
                      )}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted-fg">
                      {p.keyword} · /guide/{p.slug}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/guide/${p.slug}`}
                      target="_blank"
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground"
                    >
                      보기
                    </Link>
                    <button
                      type="button"
                      onClick={() => copyLink(p.slug, p.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-fg hover:text-foreground"
                    >
                      {copiedId === p.id ? "복사됨" : "링크복사"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePage(p.id)}
                      className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs text-danger"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalListPages > 1 && (
              <div className="mt-5 flex flex-wrap justify-center gap-1">
                {Array.from({ length: totalListPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setListPage(n)}
                    className={`h-8 min-w-[32px] rounded-lg px-2 text-xs font-bold transition ${
                      listPage === n
                        ? "bg-accent text-white"
                        : "text-muted-fg hover:bg-muted"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
