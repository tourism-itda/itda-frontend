import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Bookmark, MapPin } from "lucide-react";
import { BookmarkedPlace, getBookmarks, removeBookmark } from "../lib/bookmarks";

export default function Bookmarks() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkedPlace[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  function handleRemove(id: string) {
    removeBookmark(id);
    setBookmarks((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card sticky top-0 lg:top-16 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="text-xl">내 북마크</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bookmark className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">저장한 장소가 없습니다</p>
            <p className="text-sm text-muted-foreground/70">장소 상세 정보에서 북마크 아이콘을 눌러 저장해보세요</p>
          </div>
        ) : (
          <div className="divide-y divide-border border-t border-border">
            {bookmarks.map((place) => (
              <div
                key={place.id}
                className="flex gap-3 py-4"
              >
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-20 h-20 object-cover border border-border shrink-0"
                />
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="text-xs text-muted-foreground mb-1">{place.category}</p>
                  <p className="font-heading mb-1.5 truncate">{place.name}</p>
                  {place.address && (
                    <div className="flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{place.address}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(place.id)}
                  className="self-center p-2 rounded-full hover:bg-muted transition-colors shrink-0"
                >
                  <Bookmark className="w-4 h-4 fill-primary text-primary" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
