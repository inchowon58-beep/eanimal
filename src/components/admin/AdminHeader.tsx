import Link from "next/link";
import AdminLogoutButton from "@/app/admin/AdminLogoutButton";

const TABS = [
  { id: "requests", label: "정보삭제요청", href: "/admin" },
  { id: "banners", label: "배너 설정", href: "/admin/banners" },
  { id: "seo", label: "SEO 페이지", href: "/admin/seo" },
] as const;

export type AdminTab = (typeof TABS)[number]["id"];

export default function AdminHeader({
  active,
  subtitle,
}: {
  active: AdminTab | null;
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
            href="/admin/master"
            className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/15"
          >
            마스터설정
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium"
          >
            사이트로
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <nav className="mt-6 flex gap-1.5 border-b border-border">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`-mb-px rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "border border-b-0 border-accent bg-accent text-white"
                  : "border border-border bg-muted/40 text-muted-fg hover:bg-muted hover:text-foreground"
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
