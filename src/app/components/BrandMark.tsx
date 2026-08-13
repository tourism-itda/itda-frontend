interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = "w-8 h-8 text-base" }: BrandMarkProps) {
  return (
    <img
      src="/images/logo.png"
      alt="잇다 관광 로고"
      className={`inline-block shrink-0 rounded-[10px] object-contain ${className}`}
    />
  );
}
