"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import DeletionRequestModal from "@/components/layout/DeletionRequestModal";
import { SITE } from "@/lib/site";

export default function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-fg sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Image
              src="/logo.png"
              alt={`${SITE.name} 로고`}
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 object-contain"
            />
            <div>
              <p className="font-medium text-foreground">{SITE.name}</p>
              <p className="mt-1 max-w-md leading-relaxed">{SITE.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:border-accent/40"
            >
              정보삭제요청
            </button>
            <Link
              href="/admin/login"
              className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-fg"
            >
              로그인
            </Link>
          </div>
        </div>
        <div className="flex gap-4 text-xs">
          <Link href="/places" className="hover:text-foreground">
            시설 목록
          </Link>
          <Link href="/rescues" className="hover:text-foreground">
            구조공고
          </Link>
          <Link href="/travel" className="hover:text-foreground">
            동반여행
          </Link>
          <Link href="/regions" className="hover:text-foreground">
            지역
          </Link>
        </div>
        <p className="flex items-start gap-1.5 border-t border-border/70 pt-4 text-xs leading-relaxed text-muted-fg">
          <svg
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path d="M4 9v6h3l5 4V5L7 9H4Z" fill="currentColor" opacity="0.9" />
            <path
              d="M16 8.5a4 4 0 0 1 0 7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span>
            {SITE.name}는 공공데이터, 관련 기관 공개자료 및 자체 검증 정보를
            바탕으로 올바른 반려문화 확산을 위해 노력합니다.
          </span>
        </p>
      </div>
      <DeletionRequestModal open={open} onClose={() => setOpen(false)} />
    </footer>
  );
}
