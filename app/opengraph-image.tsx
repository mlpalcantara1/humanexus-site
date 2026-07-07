import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

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
          justifyContent: "space-between",
          padding: "42px",
          color: "#F5F5F5",
          background:
            "radial-gradient(circle at 82% 14%, rgba(201,163,78,0.18), transparent 22%), radial-gradient(circle at 18% 18%, rgba(37,84,148,0.12), transparent 24%), linear-gradient(135deg, #050505 0%, #0D0D0D 58%, #16181C 100%)",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "18px 24px",
              borderRadius: "22px",
              border: "1px solid rgba(201,163,78,0.26)",
              background: "rgba(255,255,255,0.03)",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: "0.08em"
            }}
          >
            HUMANEXUS
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(201,163,78,0.26)",
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
            gap: "20px",
            maxWidth: "820px"
          }}
        >
          <div
            style={{
              fontSize: 60,
              lineHeight: 1.02,
              fontWeight: 700
            }}
          >
            O fator humano como infraestrutura estratégica.
          </div>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.42,
              color: "#D4D7DD",
              maxWidth: "760px"
            }}
          >
            Inteligência Regulatória Humana aplicada a ambientes operacionais de alta exigência.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: "18px",
            color: "#C9A34E",
            fontSize: 17,
            letterSpacing: "0.12em"
          }}
        >
          <div>SEGURANÇA OPERACIONAL</div>
          <div>ALTA CRITICIDADE</div>
          <div>DESENVOLVIMENTO CONTÍNUO</div>
          <div>DECISÃO EXECUTIVA</div>
        </div>
      </div>
    ),
    size
  );
}
