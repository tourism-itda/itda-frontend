import type { ReactNode } from "react";

interface PageTitleProps {
  eyebrow: string;
  title: string;
  suffix?: ReactNode;
  className?: string;
}

export function PageTitle({ eyebrow, title, suffix, className = "" }: PageTitleProps) {
  return (
    <div className={className}>
      <p className="text-xs tracking-[0.2em] text-gold font-medium uppercase mb-1">{eyebrow}</p>
      <div className="flex items-baseline gap-3">
        <h1 className="font-heading text-2xl">{title}</h1>
        {suffix}
      </div>
    </div>
  );
}
