import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
