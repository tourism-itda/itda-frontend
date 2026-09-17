import { ChevronRight, MapPin, User } from "lucide-react";
import { getProxiedImageUrl } from "../lib/imageProxy";

// DynastyPersons(나라별 인물 전체보기) 페이지에서만 쓰는 카드 UI. 예전에는 Home의 나라별/인물별
// 탭에서도 재사용했지만, 그 탭들은 콘텐츠 목록의 나라/인물 필터로 대체되며 사라졌다.
export interface ExploreItem {
  id: string;
  title: string;
  tag: string;
  /** 나라 카드: 없음. 인물 카드: 소속 나라 한글 이름(예: "조선"). */
  subtitle?: string;
  /** 인물 카드에서만 쓰는 한 줄 소개(person.summary, 없으면 person.description으로 폴백). */
  description?: string | null;
  /** 인물 카드에서만 쓰는 시대 텍스트(예: "918년 ~ 943년"). person.start_year/end_year(개인
   *  재위·생몰 연도)로 채운다 — 값이 없으면 undefined로 두고 카드에서 생략한다. */
  era?: string;
  /** 나라 카드: kingdom.image_url. 인물 카드: person.image_url. */
  image?: string | null;
  /** 인물 카드에서만 쓰는 소속 나라 enum 코드(예: "GORYEO"). 나라별 그룹핑에 쓴다. */
  kingdomCode?: string;
  href: string;
}

// PersonResponse.type(enum 코드)의 한글 라벨. 백엔드가 라벨을 안 내려주므로 프론트에서 관리한다
// (explore/enums/PersonType.java 기준).
export const personTypeLabel: Record<string, string> = {
  KING: "왕",
  GENERAL: "장군",
  SCHOLAR: "학자",
  MONK: "승려",
  POLITICIAN: "정치가",
  INVENTOR: "과학자·발명가",
  INDEPENDENCE_ACTIVIST: "독립운동가",
};

export function ExploreCard({ item, onClick }: { item: ExploreItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {item.image && (
          <img
            src={getProxiedImageUrl(item.image)}
            alt={item.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              item.tag === "인물" ? "object-[50%_20%]" : ""
            }`}
          />
        )}
        <div className="absolute left-2 bottom-2 flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-full bg-neutral-900/70 backdrop-blur-sm text-white text-[10px] font-bold tracking-wide">
            {item.tag}
          </span>
          {item.subtitle && (
            <span className="px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-sm text-neutral-900 text-[10px] font-bold tracking-wide">
              {item.subtitle}
            </span>
          )}
        </div>
      </div>
      <div className="px-3 pt-3 pb-3">
        <p className="font-heading text-[14px] font-black mb-1 line-clamp-1">{item.title}</p>
        {(item.subtitle || item.era) && item.tag === "인물" && (
          <p className="text-[11px] text-muted-foreground/80 font-semibold mb-1 truncate">
            {[item.subtitle, item.era].filter(Boolean).join(" · ")}
          </p>
        )}
        {item.description && (
          <div className="flex items-start gap-1 text-xs text-muted-foreground mb-2">
            {item.tag === "인물" ? (
              <User className="w-3 h-3 shrink-0 mt-0.5" />
            ) : (
              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
            )}
            <span className="line-clamp-2">{item.description}</span>
          </div>
        )}
        <span className="inline-flex items-center gap-0.5 text-xs text-primary font-bold group-hover:gap-1.5 transition-all">
          상세 정보 보기
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}
