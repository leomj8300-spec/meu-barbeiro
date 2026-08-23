import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const INK = "#17171B";
const GOLD = "#F0A63C";

function stripeGradient(pairs: number, angle: number): string {
  const step = 100 / pairs;
  const stops: string[] = [];
  for (let i = 0; i < pairs; i++) {
    const start = i * step;
    const mid = start + step * 0.55;
    const end = start + step;
    stops.push(`${GOLD} ${start}%`, `${GOLD} ${mid}%`, `${INK} ${mid}%`, `${INK} ${end}%`);
  }
  return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
}

export default function Icon() {
  const s = size.width;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: INK,
          borderRadius: s * 0.22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: s * 0.5, height: s * 0.08, background: GOLD, borderRadius: s * 0.04 }} />
          <div
            style={{
              width: s * 0.26,
              height: s * 0.56,
              marginTop: s * 0.02,
              borderRadius: s * 0.13,
              background: stripeGradient(6, 55),
            }}
          />
          <div
            style={{
              width: s * 0.5,
              height: s * 0.08,
              marginTop: s * 0.02,
              background: GOLD,
              borderRadius: s * 0.04,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
