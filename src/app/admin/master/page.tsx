import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated, isMasterAuthenticated } from "@/lib/auth";
import MasterLoginClient from "./MasterLoginClient";
import MasterSettingsClient from "./MasterSettingsClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "마스터 설정",
    robots: { index: false, follow: false, nocache: true, noimageindex: true },
  };
}

export default async function MasterPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/");

  const master = await isMasterAuthenticated();
  if (!master) return <MasterLoginClient />;

  return <MasterSettingsClient />;
}
