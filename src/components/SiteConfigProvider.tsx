"use client";

import { createContext, useContext } from "react";
import type { SiteConfig } from "@/lib/site-config-types";
import { phoneToTel } from "@/lib/site-config-types";

export type ClientSiteConfig = SiteConfig & { phoneTel: string };

const SiteConfigContext = createContext<ClientSiteConfig | null>(null);

export function SiteConfigProvider({
  config,
  children,
}: {
  config: SiteConfig;
  children: React.ReactNode;
}) {
  const value: ClientSiteConfig = {
    ...config,
    phoneTel: phoneToTel(config.phone),
  };
  return (
    <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>
  );
}

export function useSiteConfig(): ClientSiteConfig {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) throw new Error("useSiteConfig must be used within SiteConfigProvider");
  return ctx;
}
