import { ImageResponse } from "next/og";

export const alt = "Smart Battery Calculator – solar PV battery sizing decision-support tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 82px",
          background: "#f7fbf8",
          color: "#0c1830",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 34 }}>
          <div style={{ width: 68, height: 68, borderRadius: 18, background: "#0b9e45", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 38 }}>⚡</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#087a38" }}>SMART BATTERY CALCULATOR</div>
        </div>
        <div style={{ fontSize: 64, lineHeight: 1.08, fontWeight: 800, letterSpacing: -2, maxWidth: 980 }}>
          Solar PV battery sizing and energy-cost decision support
        </div>
        <div style={{ marginTop: 28, fontSize: 28, lineHeight: 1.4, color: "#52647d", maxWidth: 940 }}>
          Use annual household load, solar PV and tariff information to compare battery sizing and estimated savings.
        </div>
        <div style={{ marginTop: 48, display: "flex", gap: 22, fontSize: 22, color: "#30445f" }}>
          <span>Annual load profiles</span><span>•</span><span>Solar PV</span><span>•</span><span>Battery optimisation</span>
        </div>
      </div>
    ),
    size,
  );
}
