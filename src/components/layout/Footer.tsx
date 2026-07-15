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
      </div>
      <DeletionRequestModal open={open} onClose={() => setOpen(false)} />
    </footer>
  );
}
