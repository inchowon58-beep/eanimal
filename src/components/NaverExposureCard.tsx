"use client";

import { useState } from "react";

interface Props {
  exposureId: string;
  exposurePassword?: string;
  editable?: boolean;
  onIdChange?: (value: string) => void;
  onPasswordChange?: (value: string) => void;
}

export default function NaverExposureCard({
  exposureId,
  exposurePassword = "",
  editable = false,
  onIdChange,
  onPasswordChange,
}: Props) {
  const [copiedField, setCopiedField] = useState<"id" | "password" | null>(null);

  const handleCopy = async (field: "id" | "password", value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-[#03C75A]/20 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-[#03C75A] px-4 py-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-sm font-black text-[#03C75A]">
          N
        </span>
        <span className="text-sm font-bold text-white tracking-tight">네이버 노출작업</span>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-[#03C75A] mb-1">노출작업 아이디</p>
          {editable ? (
            <input
              type="text"
              value={exposureId}
              onChange={(e) => onIdChange?.(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:border-[#03C75A]"
            />
          ) : (
            <p className="text-lg font-bold text-[#111] tracking-wide font-mono break-all">
              {exposureId}
            </p>
          )}
          <button
            type="button"
            onClick={() => handleCopy("id", exposureId)}
            className="mt-2 text-xs font-semibold text-[#03A94A] hover:underline"
          >
            {copiedField === "id" ? "복사됨 ✓" : "아이디 복사"}
          </button>
        </div>
        <div>
          <p className="text-xs font-medium text-[#03C75A] mb-1">노출작업 비밀번호</p>
          {editable ? (
            <input
              type="text"
              value={exposurePassword}
              onChange={(e) => onPasswordChange?.(e.target.value)}
              placeholder="비밀번호"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:border-[#03C75A]"
            />
          ) : (
            <p className="text-lg font-bold text-[#111] tracking-wide font-mono break-all">
              {exposurePassword || "—"}
            </p>
          )}
          {exposurePassword && (
            <button
              type="button"
              onClick={() => handleCopy("password", exposurePassword)}
              className="mt-2 text-xs font-semibold text-[#03A94A] hover:underline"
            >
              {copiedField === "password" ? "복사됨 ✓" : "비밀번호 복사"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
