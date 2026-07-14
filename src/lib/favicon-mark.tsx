import type { ReactNode } from "react";

/**
 * 협회·위원회 엠블럼 (발바닥 없음)
 * — 이중 링 + 중앙 한글 모노그램 + 하단 리본
 */
export function FaviconMark({ size }: { size: number }): ReactNode {
  const r = size;
  const ring = Math.max(1, Math.round(r * 0.045));
  const fontSize = Math.round(r * 0.42);

  return (
    <div
      style={{
        width: r,
        height: r,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "linear-gradient(160deg, #0b3d3a 0%, #0f5c56 55%, #0a4a45 100%)",
        borderRadius: Math.round(r * 0.18),
        border: `${Math.max(1, Math.round(r * 0.02))}px solid #c9a86a`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: Math.round(r * 0.1),
          borderRadius: Math.round(r * 0.12),
          border: `${ring}px solid rgba(201,168,106,0.55)`,
          display: "flex",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f5f0e6",
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          lineHeight: 1,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        반
      </div>
      <div
        style={{
          position: "absolute",
          bottom: Math.round(r * 0.12),
          width: Math.round(r * 0.38),
          height: Math.max(2, Math.round(r * 0.04)),
          background: "rgba(201,168,106,0.85)",
          borderRadius: 2,
        }}
      />
    </div>
  );
}
