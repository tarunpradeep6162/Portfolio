import { ImageResponse } from "next/og";
import { site, hero } from "@/content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        overflow: "hidden",
        padding: 68,
        background: "#06090d",
        color: "#f8f8f3",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          opacity: 0.12,
          background: "linear-gradient(125deg, #111d2a 0%, #06090d 58%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          right: -40,
          top: 52,
          display: "flex",
          border: "1px solid rgba(216,255,79,.25)",
          borderRadius: 999,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 340,
          height: 340,
          right: 50,
          top: 142,
          display: "flex",
          border: "1px dashed rgba(116,140,255,.35)",
          borderRadius: 999,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 150,
          height: 150,
          right: 145,
          top: 237,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(216,255,79,.55)",
          borderRadius: 999,
          color: "#d8ff4f",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 3,
        }}
      >
        CORE
      </div>

      <div
        style={{
          position: "relative",
          width: 760,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#d8ff4f",
            fontSize: 13,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 34,
              height: 2,
              background: "#d8ff4f",
            }}
          />
          {hero.eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: -6,
              textTransform: "uppercase",
            }}
          >
            Tarun
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: -6,
              textTransform: "uppercase",
              color: "#d8ff4f",
            }}
          >
            Pradeep
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              maxWidth: 660,
              fontSize: 28,
              lineHeight: 1.2,
              color: "#8996a3",
            }}
          >
            {hero.primaryLine}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 12,
            letterSpacing: 2,
            color: "#8996a3",
            textTransform: "uppercase",
          }}
        >
          {site.location} / Infrastructure atlas v4
        </div>
      </div>
    </div>,
    { ...size },
  );
}
