import { useEffect, useState } from "react";
import { getProxiedImageUrl } from "../lib/imageProxy";

interface PosterImageProps {
  /** null/빈 문자열이면 바로 로고 플레이스홀더를 쓴다. */
  src: string | null | undefined;
  alt: string;
  className?: string;
}

/**
 * 콘텐츠(작품) 포스터·썸네일용 이미지. src가 없거나 실제로 못 불러오면(onError, 예: TMDB 링크가
 * 깨진 경우) 깨진 이미지 아이콘 대신 "잇다" 로고 플레이스홀더로 대체한다.
 * 장소 사진은 분류별 기본 이미지가 따로 있으므로 PlaceImage를 쓴다(이 컴포넌트는 작품 이미지 전용).
 */
export function PosterImage({ src, alt, className }: PosterImageProps) {
  const [failed, setFailed] = useState(false);

  // src가 바뀌면 이전 실패 상태를 초기화한다.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className ?? ""}`}>
        <img
          src="/images/logo.png"
          alt={alt}
          className="w-1/3 max-w-[72px] opacity-40 object-contain"
        />
      </div>
    );
  }

  return (
    <img
      src={getProxiedImageUrl(src)}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
