import type { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  suffix?: ReactNode;
  className?: string;
}

export function PageTitle({ title, suffix, className = "" }: PageTitleProps) {
  return (
    <div className={className}>
      <div className="flex items-baseline gap-3">
        <h1 className="font-heading text-2xl">{title}</h1>
        {suffix}
      </div>
    </div>
  );
}
