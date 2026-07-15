import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import AdminHeader from "@/components/admin/AdminHeader";
import BannerManager from "@/components/admin/BannerManager";
import { listAllBanners } from "@/lib/banners/queries";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const banners = await listAllBanners();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <AdminHeader active="banners" subtitle="배너 등록 · 노출영역/기간 설정" />
      <BannerManager initialBanners={banners} />
    </div>
  );
}
