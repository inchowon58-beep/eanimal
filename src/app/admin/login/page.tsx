"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "로그인 실패");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-foreground">관리자 로그인</h1>
      <p className="mt-2 text-sm text-muted-fg">정보삭제요청 관리를 위해 로그인해 주세요.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <label className="block text-xs font-medium text-muted-fg">
          아이디
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            autoComplete="username"
            required
          />
        </label>
        <label className="block text-xs font-medium text-muted-fg">
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="h-10 w-full rounded-lg bg-accent text-sm font-semibold text-accent-fg disabled:opacity-60"
        >
          {loading ? "확인 중…" : "로그인"}
        </button>
      </form>
    </div>
  );
}
