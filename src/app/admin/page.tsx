import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site-config";
import { buildPageMetadata } from "@/lib/metadata";
import AdminClient from "./AdminClient";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return buildPageMetadata(config, {
    title: "관리자",
    description: `${config.brandName} 관리자 페이지`,
    path: "/admin",
    noIndex: true,
  });
}

export default async function AdminPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/");
  return <AdminClient />;
}
