import Link from "next/link";
import type { ComponentProps } from "react";

type ExternalLinkProps = Omit<ComponentProps<typeof Link>, "rel" | "target"> & {
  href: string;
};

/** 외부(아웃바운드) 링크 — 보안·SEO 표준: noopener noreferrer */
export default function ExternalLink({
  href,
  children,
  ...props
}: ExternalLinkProps) {
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </Link>
  );
}
