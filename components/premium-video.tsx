import { existsSync } from "node:fs";
import { join } from "node:path";

type PremiumVideoProps = {
  src: string;
  poster?: string;
  title?: string;
  eyebrow?: string;
  description?: string;
  className?: string;
  priority?: boolean;
};

function buildSources(src: string) {
  const root = join(process.cwd(), "public");
  const normalized = src.startsWith("/") ? src : `/${src}`;
  const base = normalized.replace(/\.(mov|mp4|m4v)$/i, "");
  const candidates = [
    { src: `${base}.mp4`, type: "video/mp4" },
    { src: `${base}.m4v`, type: "video/mp4" },
    { src: `${base}.mov`, type: "video/quicktime" }
  ];

  return candidates.filter((item) => existsSync(join(root, item.src.replace(/^\//, ""))));
}

export function PremiumVideo({
  src,
  poster,
  title,
  eyebrow,
  description,
  className = "",
  priority = false
}: PremiumVideoProps) {
  const sources = buildSources(src);

  return (
    <div className={`relative overflow-hidden rounded-[34px] border border-white/10 bg-[#050505] shadow-panel ${className}`}>
      <video
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload={priority ? "auto" : "metadata"}
        poster={poster}
        disablePictureInPicture
      >
        {sources.map((item) => (
          <source key={item.src} src={item.src} type={item.type} />
        ))}
      </video>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,24,0.18),rgba(5,5,5,0.82))]" />
      {(eyebrow || title || description) ? (
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <div className="max-w-2xl rounded-[28px] border border-white/10 bg-[#050505]/66 p-5 backdrop-blur-xl">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-[0.3em] text-[#C9A34E]">{eyebrow}</p>
            ) : null}
            {title ? <h3 className="mt-3 text-2xl font-semibold text-[#F5F5F5]">{title}</h3> : null}
            {description ? <p className="mt-3 text-sm leading-7 text-[#B8B8B8]">{description}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
