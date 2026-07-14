"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** 카드용 고정 비율 */
  fill?: boolean;
}

export default function RemoteImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority,
  fill = true,
}: Props) {
  const [failed, setFailed] = useState(false);
  const valid = Boolean(src && /^https?:\/\//i.test(src) && !failed);

  if (!valid) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-muted to-border/60 ${className || ""}`}
        aria-label={alt || "이미지 없음"}
      >
        <div className="text-center px-3">
          <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-accent/15" />
          <p className="text-[11px] font-medium text-muted-fg">이미지 준비 중</p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src!}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className || ""}`}
      onError={() => setFailed(true)}
      unoptimized={false}
    />
  );
}
