import { useNavigate } from "react-router";

interface ContentCardProps {
  content: {
    id: string;
    title: string;
    genre: string;
    era: string;
    image?: string | null;
    // 인물 카드(ExploreCard)의 description과 동일한 역할의 한 줄 소개. 백엔드가 아직 안 내려주면
    // undefined/null이라 자연히 숨겨진다.
    summary?: string | null;
  };
}

export function ContentCard({ content }: ContentCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/app/content/${content.id}`)}
      className="group text-left w-full transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="aspect-[3/4] rounded-sm border border-border overflow-hidden mb-2 bg-muted transition-shadow duration-200 group-hover:shadow-md">
        {content.image && (
          <img
            src={content.image}
            alt={content.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <p className="font-heading text-sm leading-tight mb-0.5 line-clamp-1 group-hover:underline underline-offset-2">{content.title}</p>
      <p className="text-sm text-muted-foreground">{content.era}</p>
      {content.summary && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{content.summary}</p>
      )}
    </button>
  );
}
