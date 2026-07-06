"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MasterLoginClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/master/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      setError("마스터 비밀번호가 올바르지 않습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-dark mb-2">마스터 로그인</h1>
        <p className="text-sm text-gray-500 mb-6">
          사이트 전체 설정 · 사용기간 · SEO 일일 한도 관리
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="마스터 비밀번호"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange"
            required
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dark text-white py-3 rounded-xl font-medium hover:bg-dark-light transition disabled:opacity-50"
          >
            {loading ? "확인 중..." : "마스터 로그인"}
          </button>
        </form>
        <Link
          href="/admin"
          className="block text-center text-sm text-gray-400 mt-4 hover:text-orange"
        >
          ← 관리자 페이지로
        </Link>
      </div>
    </div>
  );
}
