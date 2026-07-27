import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import AdminHeader from "@/components/admin/AdminHeader";
import BaseSeoPublisher from "@/components/admin/BaseSeoPublisher";

export const dynamic = "force-dynamic";

export default async function AdminBaseSeoPage() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <AdminHeader
        active="base-seo"
        subtitle="카테고리 기본 양식 SEO · 1건 발행 (대량은 로컬 도구)"
      />
      <BaseSeoPublisher />
    </div>
  );
}
