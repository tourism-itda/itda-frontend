import { useEffect, useState } from "react";
import { getProxiedImageUrl } from "../lib/imageProxy";
import { placeholderImageFor } from "../lib/placeholderImage";

interface PlaceImageProps {
  /** null/undefined/빈 문자열이면 바로 기본 이미지를 쓴다. */
  src: string | null | undefined;
  alt: string;
  /** 확실히 아는 경우에만 넘긴다("SPOT" | "RESTAURANT" | "CAFE"). */
  placeType?: string | null;
  category?: string | null;
  className?: string;
}

/**
 * 장소(관광지/식당/카페) 사진용 <img>. 사진이 없거나(src 없음) 실제로 불러오길 실패하면
 * (onError, 예: 카카오/관광API가 준 외부 이미지 링크가 깨진 경우) 분류별 기본 이미지로
 * 자동 대체한다. "루트 만들기"에서 검증된 패턴(placeholderImage.ts 참고)을 재사용한다.
 */
export function PlaceImage({ src, alt, placeType, category, className }: PlaceImageProps) {
  const [failed, setFailed] = useState(false);

  // src가 바뀌면(카드 재사용 등) 이전 실패 상태를 들고 있지 않도록 초기화한다.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const fallback = placeholderImageFor(placeType, category);
  const resolvedSrc = !src || failed ? fallback : getProxiedImageUrl(src);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
