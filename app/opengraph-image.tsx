import { ImageResponse } from "next/og";
import { site, hero } from "@/content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#071015",
          color: "#f1f0e8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 20, letterSpacing: 4, color: "#ff6b45", textTransform: "uppercase" }}>
          {hero.eyebrow}
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 60, fontWeight: 700, lineHeight: 1.1, maxWidth: 960 }}>
          {hero.primaryLine}
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 24, color: "#8797a5" }}>{site.name}</div>
      </div>
    ),
    { ...size },
  );
}
