import { notFound } from "next/navigation";
import { CockpitDemonstracaoVisual } from "@/components/cockpit-demonstracao-visual";

export const dynamic = "force-dynamic";

export default function CockpitVisualDemoPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="hx-demo-page">
      <div className="hx-module hx-module--cockpit">
        <div className="hx-module__grid" />
        <div className="hx-module__inner">
          <CockpitDemonstracaoVisual />
        </div>
      </div>
    </main>
  );
}
