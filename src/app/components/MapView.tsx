import { MapPin } from "lucide-react";

interface Place {
  id: string;
  order: number;
  name: string;
  lat: number;
  lng: number;
  image: string;
}

interface MapViewProps {
  places: Place[];
  selectedPlace: string | null;
}

export function MapView({ places, selectedPlace }: MapViewProps) {
  // Mock 지도 - 실제로는 카카오맵 API를 사용
  const selectedPlaceData = places.find((p) => p.id === selectedPlace);

  return (
    <div className="relative w-full h-full bg-muted">
      {/* Mock 지도 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-card to-muted">
        {/* 격자 패턴 */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* 장소 핀들 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[90%] h-[80%]">
          {places.map((place, idx) => (
            <div
              key={place.id}
              className="absolute"
              style={{
                left: `${20 + idx * 20}%`,
                top: `${30 + (idx % 2) * 20}%`,
              }}
            >
              {/* 핀 */}
              <div
                className={`relative transition-all ${
                  selectedPlace === place.id ? "scale-125" : "scale-100"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                    selectedPlace === place.id
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                      : "bg-card text-foreground border-2 border-primary"
                  }`}
                >
                  <span className="text-sm">{place.order}</span>
                </div>
                
                {/* 연결선 */}
                {idx < places.length - 1 && (
                  <svg
                    className="absolute top-5 left-10 pointer-events-none"
                    width="120"
                    height="60"
                  >
                    <path
                      d="M 0 0 Q 60 30, 120 0"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-primary opacity-30"
                      strokeDasharray="5,5"
                    />
                  </svg>
                )}
              </div>

              {/* 선택된 핀의 미니 카드 */}
              {selectedPlace === place.id && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 bg-card border border-border rounded-lg shadow-xl p-3 z-10">
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                  <p className="text-sm font-medium">{place.name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 지도 컨트롤 */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button className="w-10 h-10 bg-card border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
          +
        </button>
        <button className="w-10 h-10 bg-card border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
          −
        </button>
      </div>

      {/* 지도 범례 */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-sm">
        <p className="text-xs text-muted-foreground mb-2">총 {places.length}개 장소</p>
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="w-4 h-4 text-primary" />
          <span>추천 루트</span>
        </div>
      </div>
    </div>
  );
}
