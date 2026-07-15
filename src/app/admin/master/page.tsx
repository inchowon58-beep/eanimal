import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import AdminHeader from "@/components/admin/AdminHeader";
import MasterSettings from "@/components/admin/MasterSettings";

export const dynamic = "force-dynamic";

export default async function AdminMasterPage() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <AdminHeader active={null} subtitle="마스터 설정 · 사용가능일/발행수량" />
      <MasterSettings />
    </div>
  );
}
