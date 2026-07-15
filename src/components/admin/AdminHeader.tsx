import Link from "next/link";
import AdminLogoutButton from "@/app/admin/AdminLogoutButton";

const TABS = [
  { id: "requests", label: "정보삭제요청", href: "/admin" },
  { id: "banners", label: "배너 설정", href: "/admin/banners" },
] as const;

export type AdminTab = (typeof TABS)[number]["id"];

export default function AdminHeader({
  active,
  subtitle,
}: {
  active: AdminTab;
  subtitle: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">관리자</h1>
          <p className="mt-1 text-sm text-muted-fg">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium"
          >
            사이트로
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <nav className="mt-5 flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-fg hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
