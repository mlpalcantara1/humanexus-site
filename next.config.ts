import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
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
  }
};

export default nextConfig;
