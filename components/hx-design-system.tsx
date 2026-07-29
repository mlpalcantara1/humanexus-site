import type { HTMLAttributes, ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  accent?: ReactNode;
  className?: string;
  eyebrowClassName?: string;
  descriptionAs?: "p" | "span";
};

type SectionHeaderProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "aside" | "div" | "section";
};

function classes(...names: Array<string | undefined>) {
  return names.filter(Boolean).join(" ");
}

export function HxPageHeader({
  eyebrow,
  title,
  description,
  aside,
  accent,
  className,
  eyebrowClassName,
  descriptionAs: Description = "p"
}: PageHeaderProps) {
  return (
    <header className={classes("hx-ds-page-head", className)}>
      {accent}
      <div className="hx-ds-page-head__copy">
        <p className={classes("hx-ds-eyebrow", eyebrowClassName)}>{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <Description className="hx-ds-page-head__description">{description}</Description> : null}
      </div>
      {aside}
    </header>
  );
}

export function HxSectionHeader({
  eyebrow,
  title,
  description,
  aside,
  className
}: SectionHeaderProps) {
  return (
    <header className={classes("hx-ds-section-head", className)}>
      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
        {description ? <span>{description}</span> : null}
      </div>
      {aside}
    </header>
  );
}

export function HxSurface({
  as: Element = "section",
  className,
  ...props
}: SurfaceProps) {
  return <Element className={classes("hx-ds-surface", className)} {...props} />;
}
