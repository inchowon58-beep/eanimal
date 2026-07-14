"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-fg"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
    >
      로그아웃
    </button>
  );
}
