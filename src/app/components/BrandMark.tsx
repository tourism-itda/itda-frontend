interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = "w-8 h-8 text-base" }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center shrink-0 rounded-[10px] bg-primary text-primary-foreground font-bold ${className}`}
    >
      역
    </span>
  );
}
