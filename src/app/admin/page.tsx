import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { getSupabaseService, getSupabaseServer } from "@/lib/supabase/server";
import AdminHeader from "@/components/admin/AdminHeader";
import DeletionRequestManager, {
  type DeletionRequestRow,
} from "@/components/admin/DeletionRequestManager";

export const dynamic = "force-dynamic";

type DeletionRequest = DeletionRequestRow;

export default async function AdminPage() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const supabase = getSupabaseService() || getSupabaseServer();
  let rows: DeletionRequest[] = [];
  let loadError: string | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from("deletion_requests")
      .select("id, business_name, target_url, reason, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) loadError = error.message;
    else rows = (data ?? []) as DeletionRequest[];
  } else {
    loadError = "Supabase가 설정되지 않았습니다.";
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <AdminHeader active="requests" subtitle="정보삭제요청 목록" />

      {loadError && (
        <p className="mt-6 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {loadError}
          <span className="mt-1 block text-xs text-muted-fg">
            Supabase에서 migration_20260714.sql 실행 여부를 확인해 주세요.
          </span>
        </p>
      )}

      {!loadError && <DeletionRequestManager initialRows={rows} />}
    </div>
  );
}
