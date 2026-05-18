import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  const board = readFileSync(join(process.cwd(), "public/brand/brand-board.jpg")).toString("base64");
  const logo = readFileSync(join(process.cwd(), "public/brand/logo-official.png")).toString("base64");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #050505 0%, #0D0D0D 60%, #1A1A1A 100%)",
          color: "#F5F5F5",
          padding: "36px",
          fontFamily: "sans-serif"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            border: "1px solid rgba(201,163,78,0.22)",
            borderRadius: "34px",
            overflow: "hidden",
            background: "rgba(255,255,255,0.02)"
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              flex: 1,
              padding: "42px"
            }}
          >
            <img
              src={`data:image/jpeg;base64,${board}`}
              alt="Identidade visual oficial HUMANEXUS"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.26
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, rgba(5,5,5,0.94) 0%, rgba(5,5,5,0.82) 42%, rgba(5,5,5,0.52) 100%)"
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                width: "100%"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <img
                  src={`data:image/png;base64,${logo}`}
                  alt="Logo HUMANEXUS"
                  style={{ width: 250, height: 146, objectFit: "contain", objectPosition: "left center" }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(201,163,78,0.28)",
                    borderRadius: 999,
                    padding: "10px 18px",
                    background: "rgba(5,5,5,0.48)",
                    color: "#C9A34E",
                    fontSize: 16,
                    letterSpacing: "0.24em"
                  }}
                >
                  INSTITUTO HUMANEXUS
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  maxWidth: "760px"
                }}
              >
                <div style={{ fontSize: 56, lineHeight: 1.04, fontWeight: 700 }}>
                  O HUMANEXUS operacionaliza a Inteligência Regulatória Humana em ambientes de elevada exigência.
                </div>
                <div style={{ fontSize: 22, lineHeight: 1.42, color: "#D5D5D5" }}>
                  Neurociência aplicada, fatores humanos e performance operacional integrados em uma
                  experiência premium para organizações críticas.
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "16px 28px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(5,5,5,0.84)",
              color: "#C9A34E",
              fontSize: 17
            }}
          >
            <div>TEORIA</div>
            <div>HUMANEXUS</div>
            <div>APLICAÇÕES OPERACIONAIS</div>
            <div>TECNOLOGIA APLICADA</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
