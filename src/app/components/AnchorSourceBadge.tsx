import { Film, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AnchorSource } from "../lib/itineraryRecommend";

const ANCHOR_SOURCE_BADGE: Record<
  AnchorSource,
  { label: string; icon: LucideIcon; className: string } | null
> = {
  // 사람이 승인한 작품–장소 매핑. "작품의 장소"라고 말해도 되는 유일한 등급이다.
  CONTENT_PLACE: {
    label: "작품의 장소",
    icon: Film,
    className: "bg-primary/10 text-primary",
  },
  // 작품 속 실존 인물의 연고지. 근거가 "인물이 같다"뿐이라 촬영지가 아니다 —
  // 라벨에 "촬영지"를 쓰지 않는 것이 이 배지의 존재 이유다.
  PERSON_CHAIN: {
    label: "작품 속 인물과 연결된 곳",
    icon: User,
    className: "bg-accent/10 text-accent",
  },
  // 근거가 없으면 등급도 없다. 빈 배지를 만들어 붙이지 않는다.
  NONE: null,
};

/**
 * 장소가 작품과 어떤 근거로 연결됐는지를 나타내는 근거 등급 배지.
 *
 * <p>작품 관련 명소에만 붙인다. 같은 루트에 섞여 있는 주변 일반 명소(SlotFilledBy.GENERAL)와
 * 식당·카페에는 붙이지 않는다 — 호출부가 골라서 넘겨야 한다.
 *
 * <p>쓰는 곳은 "하루 루트 만들기"(RouteBuilder) 뿐이다. 추천 일정 화면(No.27)은 이 표기를
 * 쓰지 않기로 했다.
 *
 * <p>백엔드가 새 등급을 추가해 모르는 값이 와도 아무것도 렌더링하지 않는다(여백도 남기지 않는다).
 */
export function AnchorSourceBadge({
  source,
  className = "",
}: {
  source: AnchorSource | null | undefined;
  className?: string;
}) {
  const badge = source ? ANCHOR_SOURCE_BADGE[source] : null;
  if (!badge) return null;

  const Icon = badge.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0 ${badge.className} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {badge.label}
    </span>
  );
}
