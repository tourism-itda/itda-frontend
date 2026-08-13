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
    <button
      onClick={() => navigate(`/app/content/${content.id}`)}
      className="group text-left w-full transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="aspect-[3/4] rounded-sm border border-border overflow-hidden mb-2 transition-shadow duration-200 group-hover:shadow-md">
        <img
          src={content.image}
          alt={content.title}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="font-heading text-sm leading-tight mb-0.5 line-clamp-1 group-hover:underline underline-offset-2">{content.title}</p>
      <p className="text-sm text-muted-foreground">{content.era}</p>
    </button>
  );
}
