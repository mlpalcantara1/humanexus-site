import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        pitch: "#050505",
        graphite: "#0D0D0D",
        carbon: "#1A1A1A",
        gold: "#C9A34E",
        bone: "#F5F5F5",
        mist: "#B8B8B8"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(201,163,78,0.18), transparent 34%), linear-gradient(115deg, rgba(255,255,255,0.04), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 60%)",
        "mesh-dark":
          "radial-gradient(circle at 20% 20%, rgba(201,163,78,0.10), transparent 20%), radial-gradient(circle at 80% 0%, rgba(61,61,61,0.32), transparent 26%), linear-gradient(140deg, rgba(255,255,255,0.04), transparent 25%)"
      },
      boxShadow: {
        gold: "0 24px 80px rgba(201,163,78,0.16)",
        panel: "0 24px 60px rgba(0,0,0,0.38)"
      }
    }
  },
  plugins: []
};

export default config;
