import type { NextConfig } from "next";

const emHomologacao = process.env.HUMANEXUS_ENVIRONMENT === "homologacao";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: []
  },
  async redirects() {
    return [
      {
        source: "/anamnese/:token",
        destination: "/anamnese/convite/:token",
        permanent: false
      }
    ];
  },
  async headers() {
    const seguranca = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()"
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains"
      }
    ];
    if (emHomologacao) {
      seguranca.push({ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" });
    }
    return [{ source: "/(.*)", headers: seguranca }];
  }
};

export default nextConfig;
