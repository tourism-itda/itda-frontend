import { useEffect, useState } from "react";
import { X, MapPin, Clock, Navigation, Bookmark } from "lucide-react";
import { isBookmarked, toggleBookmark } from "../lib/bookmarks";

export interface PlaceSheetData {
  id: string;
  name: string;
  category: string;
  address: string;
  hours: string;
  image: string;
  description: string;
}

interface PlaceSheetProps {
  place: PlaceSheetData | null;
  onClose: () => void;
}

export function PlaceSheet({ place, onClose }: PlaceSheetProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(place ? isBookmarked(place.id) : false);
  }, [place?.id]);

  if (!place) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card w-full max-w-lg max-h-[85vh] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* 북마크 + 닫기 */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setSaved(toggleBookmark(place))}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 지도 플레이스홀더 */}
        <div
          className="relative h-44 overflow-hidden shrink-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            backgroundColor: "#e8e4d8",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center shadow-lg">
                <MapPin className="w-5 h-5 text-background fill-background" />
              </div>
              <div className="w-2 h-2 rounded-full bg-foreground/20 mt-1 blur-sm" />
            </div>
          </div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card rounded-xl px-3 py-1.5 shadow-md border border-border whitespace-nowrap">
            <p className="text-xs font-medium">{place.name}</p>
          </div>
        </div>

        {/* 장소 정보 */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{place.category}</p>
            <h3 className="text-lg font-semibold">{place.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{place.description}</p>
          </div>

          <div className="divide-y divide-border">
            <div className="flex items-start gap-3 py-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm">{place.address}</p>
            </div>
            <div className="flex items-center gap-3 py-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-sm">{place.hours}</p>
            </div>
          </div>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(place.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            지도 앱에서 열기
          </a>

          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
