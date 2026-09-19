import { ChevronRight } from "lucide-react";
import { getProxiedImageUrl } from "../lib/imageProxy";

interface CommunityContentBoxProps {
  title: string;
  thumbnailUrl?: string | null;
  /** 제목 아래 한 줄 안내 — 눌렀을 때 무슨 일이 일어나는지 알려준다. */
  caption: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * 커뮤니티 루트가 "어떤 작품으로 만든 것인지" 보여주는 작은 가로형 박스(작은 포스터 + 제목).
 * 메인 페이지의 ContentCard(3:4 큰 카드)를 목록 카드 안에 그대로 넣으면 카드가 두 배로 길어져서
 * 같은 정보만 가로형으로 줄였다. 목록 카드(작품 루트만 모아보기)와 상세(작품 페이지로 이동)가 함께 쓴다.
 */
export function CommunityContentBox({ title, thumbnailUrl, caption, onClick }: CommunityContentBoxProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 text-left rounded-xl border border-border bg-muted/40 hover:bg-muted p-2 transition-colors"
    >
      <div className="w-9 h-12 rounded-md overflow-hidden bg-muted shrink-0">
        {thumbnailUrl && (
          <img
            src={getProxiedImageUrl(thumbnailUrl)}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading text-[13px] font-black line-clamp-1">{title}</p>
        <p className="text-[11px] text-muted-foreground">{caption}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
