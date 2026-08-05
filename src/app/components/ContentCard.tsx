import { useNavigate } from "react-router";

interface ContentCardProps {
  content: {
    id: string;
    title: string;
    genre: string;
    era: string;
    image: string;
  };
}

export function ContentCard({ content }: ContentCardProps) {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(`/app/content/${content.id}`)} className="group text-left w-full">
      <div className="aspect-[3/4] rounded-sm border border-border overflow-hidden mb-2">
        <img
          src={content.image}
          alt={content.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <p className="font-heading text-sm leading-tight mb-0.5 line-clamp-1">{content.title}</p>
      <p className="text-xs text-muted-foreground">{content.era}</p>
    </button>
  );
}
