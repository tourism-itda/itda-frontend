import { Landmark, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StorySource } from "../lib/contents";

const STORY_SOURCE_CAPTION: Record<StorySource, { text: string; icon: LucideIcon }> = {
  CHRONICLE: { text: "국사편찬위원회 연표 기반 · AI 정리", icon: Landmark },
  AI_GENERATED: { text: "AI가 생성한 이야기", icon: Sparkles },
};

/**
 * 역사 이야기의 줄거리 출처 라벨. source가 null(아직 재처리되지 않은 콘텐츠)이거나
 * 알 수 없는 값이면 아무것도 렌더링하지 않는다(여백도 남기지 않는다).
 */
export function StorySourceBadge({ source }: { source: StorySource | null }) {
  const caption = source ? STORY_SOURCE_CAPTION[source] : undefined;
  if (!caption) return null;

  const Icon = caption.icon;
  return (
    <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-4">
      <Icon className="w-4 h-4 shrink-0" />
      {caption.text}
    </p>
  );
}
