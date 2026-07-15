import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import AdminHeader from "@/components/admin/AdminHeader";
import SeoPageManager from "@/components/admin/SeoPageManager";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <AdminHeader active="seo" subtitle="키워드 SEO 페이지 생성 · 대량등록 · VM 발행" />
      <SeoPageManager />
    </div>
  );
}
