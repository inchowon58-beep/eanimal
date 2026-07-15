import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { getSupabaseService, getSupabaseServer } from "@/lib/supabase/server";
import AdminHeader from "@/components/admin/AdminHeader";
import ConsultationRequestManager, {
  type ConsultationRow,
} from "@/components/admin/ConsultationRequestManager";

export const dynamic = "force-dynamic";

export default async function AdminConsultationsPage() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const supabase = getSupabaseService() || getSupabaseServer();
  let rows: ConsultationRow[] = [];
  let loadError: string | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from("consultation_requests")
      .select(
        "id, category, name, phone, answers, source_keyword, source_slug, page_url, referrer, status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) loadError = error.message;
    else rows = (data ?? []) as ConsultationRow[];
  } else {
    loadError = "Supabase가 설정되지 않았습니다.";
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <AdminHeader active="consultations" subtitle="상담·인도 신청 접수 목록" />

      {loadError && (
        <p className="mt-6 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {loadError}
          <span className="mt-1 block text-xs text-muted-fg">
            Supabase에서 migration_consultation.sql 실행 여부를 확인해 주세요.
          </span>
        </p>
      )}

      {!loadError && <ConsultationRequestManager initialRows={rows} />}
    </div>
  );
}
