import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import { getSupabaseService, getSupabaseServer } from "@/lib/supabase/server";
import AdminHeader from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

interface DeletionRequest {
  id: string;
  business_name: string;
  target_url: string;
  reason: string;
  status: string;
  created_at: string;
}

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

      {rows.length === 0 && !loadError ? (
        <p className="mt-10 text-sm text-muted-fg">등록된 삭제 요청이 없습니다.</p>
      ) : (
        <div className="mt-8 space-y-3">
          {rows.map((row) => (
            <article
              key={row.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-foreground">{row.business_name}</h2>
                <span className="text-xs text-muted-fg">
                  {new Date(row.created_at).toLocaleString("ko-KR")} · {row.status}
                </span>
              </div>
              <p className="mt-2 break-all text-sm text-accent">
                <a href={row.target_url} target="_blank" rel="noreferrer">
                  {row.target_url}
                </a>
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-fg">{row.reason}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
