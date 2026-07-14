import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-muted-fg sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-medium text-foreground">{SITE.name}</p>
          <p className="mt-1 max-w-md leading-relaxed">{SITE.description}</p>
        </div>
        <div className="flex gap-4">
          <Link href="/places" className="hover:text-foreground">
            시설 목록
          </Link>
          <Link href="/robots.txt" className="hover:text-foreground">
            robots
          </Link>
        </div>
      </div>
    </footer>
  );
}
