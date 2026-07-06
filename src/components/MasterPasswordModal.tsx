"use client";

import { useState } from "react";

interface MasterPasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function MasterPasswordModal({
  onClose,
  onSuccess,
}: MasterPasswordModalProps) {
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
      onSuccess();
    } else {
      setError("마스터 비밀번호가 올바르지 않습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-dark mb-2">마스터 비밀번호</h2>
        <p className="text-sm text-gray-500 mb-6">SEO 페이지 생성을 위해 마스터 비밀번호를 입력하세요.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="마스터 비밀번호"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange/20 focus:border-orange outline-none"
            required
            autoFocus
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dark text-white py-3 rounded-xl font-medium hover:bg-dark-light transition disabled:opacity-50"
          >
            {loading ? "확인 중..." : "확인"}
          </button>
        </form>
      </div>
    </div>
  );
}
