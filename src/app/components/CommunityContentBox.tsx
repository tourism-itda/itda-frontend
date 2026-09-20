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
 * 커뮤니티 루트가 "어떤 작품으로 만든 것인지" 보여주는 가로형 카드.
 * 왼쪽에 4:3 사진을 크게 두고, 그 옆에 작품 제목/안내를 둔다.
 * 커뮤니티 상세(모바일: 작성자 아래 / 데스크톱: 우측 프로필 카드 아래)에서 쓴다.
 */
export function CommunityContentBox({ title, thumbnailUrl, caption, onClick }: CommunityContentBoxProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-4 text-left rounded-2xl border border-border bg-card/60 backdrop-blur-md hanji-noise hover:bg-card/80 p-3 transition-colors"
    >
      <div className="w-28 aspect-[4/5] rounded-lg overflow-hidden bg-muted shrink-0">
        {thumbnailUrl && (
          <img
            src={getProxiedImageUrl(thumbnailUrl)}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading text-[16px] font-black line-clamp-2 leading-snug">{title}</p>
        <p className="text-[13px] text-muted-foreground mt-0.5">{caption}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
