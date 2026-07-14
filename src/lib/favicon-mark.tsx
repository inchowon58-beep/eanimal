import type { ReactNode } from "react";

/** 반려문화증진위원회 — 틸 실(seal) + 발바닥 마크 */
export function FaviconMark({ size }: { size: number }): ReactNode {
  const r = size;
  const pad = Math.round(r * 0.08);
  const inner = r - pad * 2;
  const cx = r / 2;
  const cy = r / 2;

  // 발가락·발바닥 (비율 고정)
  const toe = Math.max(2, Math.round(r * 0.13));
  const soleW = Math.round(r * 0.34);
  const soleH = Math.round(r * 0.28);
  const toeY = cy - Math.round(r * 0.18);
  const soleY = cy + Math.round(r * 0.08);

  const toes = [
    { x: cx - Math.round(r * 0.22), y: toeY + Math.round(r * 0.04) },
    { x: cx - Math.round(r * 0.08), y: toeY - Math.round(r * 0.02) },
    { x: cx + Math.round(r * 0.08), y: toeY - Math.round(r * 0.02) },
    { x: cx + Math.round(r * 0.22), y: toeY + Math.round(r * 0.04) },
  ];

  return (
    <div
      style={{
        width: r,
        height: r,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "linear-gradient(145deg, #134e4a 0%, #0f766e 45%, #0d9488 100%)",
        borderRadius: Math.round(r * 0.22),
      }}
    >
      {/* 위원회 실 느낌의 내부 링 */}
      <div
        style={{
          position: "absolute",
          width: inner,
          height: inner,
          borderRadius: Math.round(inner * 0.5),
          border: `${Math.max(1, Math.round(r * 0.04))}px solid rgba(255,255,255,0.28)`,
          display: "flex",
        }}
      />
      {/* 발가락 */}
      {toes.map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: t.x - toe / 2,
            top: t.y - toe / 2,
            width: toe,
            height: toe,
            borderRadius: toe,
            background: "#f8faf9",
          }}
        />
      ))}
      {/* 발바닥 */}
      <div
        style={{
          position: "absolute",
          left: cx - soleW / 2,
          top: soleY - soleH / 2,
          width: soleW,
          height: soleH,
          borderRadius: `${Math.round(soleW * 0.45)}px ${Math.round(soleW * 0.45)}px ${Math.round(soleW * 0.55)}px ${Math.round(soleW * 0.55)}px`,
          background: "#f8faf9",
        }}
      />
    </div>
  );
}
