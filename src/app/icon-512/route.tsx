import { ImageResponse } from "next/og";

const INK = "#16161D";
const IVORY = "#FAF9F7";
const s = 512;

export async function GET() {
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
        <svg
          width={s * 0.6}
          height={s * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          stroke={IVORY}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="6.5" r="2.6" />
          <circle cx="6" cy="17.5" r="2.6" />
          <path d="M20 4 L8.3 15.5" />
          <path d="M8.3 8.5 L20 20" />
        </svg>
      </div>
    ),
    { width: s, height: s },
  );
}
