import { ImageResponse } from "next/og";
import { LOGO_COMPACT } from "@/lib/brand/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon (iOS adds its own rounded mask). */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 42%, #121f2c 0%, #06090d 70%)",
      }}
    >
      <svg viewBox={LOGO_COMPACT.viewBox} width={104} height={133}>
        <path fill="#d8ff4f" fillRule="evenodd" d={LOGO_COMPACT.d} />
      </svg>
    </div>,
    { ...size },
  );
}
