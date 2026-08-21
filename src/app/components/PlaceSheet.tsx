import { useEffect, useState } from "react";
import { X, MapPin, Clock, Navigation, Bookmark, Loader2 } from "lucide-react";
import { isBookmarked, toggleBookmark } from "../lib/bookmarks";
import { usePlaceLookup } from "../lib/usePlaceLookup";
import { usePlaceDetail } from "../lib/usePlaceDetail";

export interface PlaceSheetData {
  id: string;
  // 백엔드 장소 PK. 있으면 GET /api/places/:place_id로 실제 상세 정보를 조회한다.
  // 없는 큐레이션 콘텐츠(인물/왕조 등)는 기존처럼 이름 기반 조회로 보강한다.
  placeId?: number;
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
  // place는 큐레이션된 시드 데이터(이름/카테고리 등)이고, 실제 주소·운영시간·이미지·설명은
  // placeId가 있으면 장소 상세 API로, 없으면 이름으로 관광정보 API를 조회해 보강한다.
  // 조회 실패 시 시드 데이터로 자연스럽게 대체된다.
  const lookup = usePlaceLookup(place?.placeId ? undefined : place?.name);
  const detail = usePlaceDetail(place?.placeId);
  const status = place?.placeId ? detail.status : lookup.status;
  const primaryImage =
    detail.data?.images.find((img) => img.is_primary) ?? detail.data?.images[0];

  useEffect(() => {
    setSaved(place ? isBookmarked(place.id) : false);
  }, [place?.id]);

  // is_bookmarked는 로그인 시에만 개인화되어 내려오므로, 이미 로컬에 저장된 상태는 유지하고
  // 서버가 true를 알려주는 경우에만 반영한다.
  useEffect(() => {
    if (detail.data?.is_bookmarked) setSaved(true);
  }, [detail.data]);

  if (!place) return null;

  const address = detail.data?.address ?? lookup.data?.address ?? place.address;
  const hours = detail.data?.opening_hours ?? lookup.data?.hours ?? place.hours;
  const image = primaryImage?.image_url ?? lookup.data?.image ?? place.image;
  const description = detail.data?.description ?? lookup.data?.description ?? place.description;
  const category = detail.data?.category ?? place.category;
  const mapHref = detail.data
    ? `https://maps.google.com/?q=${detail.data.latitude},${detail.data.longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent(address)}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hanji-noise" onClick={onClose} />

      <div className="relative bg-card w-full max-w-lg max-h-[85vh] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* 북마크 + 닫기 */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() =>
              setSaved(
                toggleBookmark({
                  id: place.id,
                  name: place.name,
                  category,
                  image,
                  address,
                  hours,
                })
              )
            }
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
            <p className="text-xs text-muted-foreground mb-0.5">{category}</p>
            <h3 className="text-lg font-semibold">{place.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>

          {status === "loading" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              실시간 정보를 불러오는 중...
            </div>
          )}
          {(status === "error" || status === "not-found") && (
            <p className="text-xs text-muted-foreground">
              실시간 정보를 불러오지 못해 안내된 정보로 표시하고 있어요.
            </p>
          )}

          <div className="divide-y divide-border">
            <div className="flex items-start gap-3 py-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm">{address}</p>
            </div>
            <div className="flex items-center gap-3 py-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-sm">{hours}</p>
            </div>
          </div>

          <a
            href={mapHref}
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
