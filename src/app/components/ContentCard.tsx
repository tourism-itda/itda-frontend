import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

interface ContentCardProps {
  content: {
    id: string;
    title: string;
    genre: string;
    era: string;
    image?: string | null;
  };
}

export function ContentCard({ content }: ContentCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/app/content/${content.id}`)}
      className="group text-left bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {content.image && (
          <img
            src={content.image}
            alt={content.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {content.genre && (
          <div className="absolute left-2 bottom-2 flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full bg-neutral-900/70 backdrop-blur-sm text-white text-[10px] font-bold tracking-wide">
              {content.genre}
            </span>
          </div>
        )}
      </div>
      <div className="px-3 pt-3 pb-3">
        <p className="font-heading text-[14px] font-black mb-1 line-clamp-1">{content.title}</p>
        {content.era && <p className="text-xs text-muted-foreground mb-2">{content.era}</p>}
        <span className="inline-flex items-center gap-0.5 text-xs text-primary font-bold group-hover:gap-1.5 transition-all">
          상세 정보 보기
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}
