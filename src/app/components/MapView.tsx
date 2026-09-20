import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { loadKakaoMaps } from "../lib/kakaoMaps";

interface Place {
  id: string;
  order: number;
  name: string;
  lat: number;
  lng: number;
  image: string;
  confirmed?: boolean;
}

interface MapViewProps {
  places: Place[];
  selectedPlace: string | null;
  // 마커를 눌렀을 때 place.id를 알려준다. 부모가 넘기지 않으면 마커는 그냥 표시만 된다
  // (list 쪽 onSelect와 동일한 패턴 — ItineraryDetail.tsx/ItineraryRecommendation.tsx 참고).
  onSelectPlace?: (placeId: string) => void;
}

// 선택/확정 상태에 따른 핀 색상. 기존 mock 지도의 배지 스타일(primary/success 등 CSS 변수)을
// 그대로 재사용해 카카오맵으로 바뀌어도 디자인이 달라 보이지 않게 한다.
function pinBackground(isSelected: boolean, isConfirmed: boolean): string {
  if (isSelected) return "var(--primary)";
  if (isConfirmed) return "var(--primary)";
  return "var(--card)";
}

function pinColor(isSelected: boolean, isConfirmed: boolean): string {
  if (isSelected || isConfirmed) return "var(--primary-foreground)";
  return "var(--foreground)";
}

export function MapView({ places, selectedPlace, onSelectPlace }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<Map<string, any>>(new Map());
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  // SDK 로드 + 지도 최초 1회 생성.
  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const kakao = window.kakao;
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978), // 서울시청 — 아래 마커 effect가 실제 장소로 재조정
          level: 7,
        });
        mapRef.current.addControl(
          new kakao.maps.ZoomControl(),
          kakao.maps.ControlPosition.TOPRIGHT
        );
        setSdkReady(true);
      })
      .catch((err) => {
        if (!cancelled) setSdkError(err instanceof Error ? err.message : "지도를 불러오지 못했어요.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 장소가 바뀔 때마다 커스텀 오버레이(핀)를 다시 그리고, 모든 장소가 보이도록 범위를 맞춘다.
  useEffect(() => {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!sdkReady || !kakao?.maps || !map) return;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current.clear();

    const validPlaces = places.filter(
      (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
    );
    if (validPlaces.length === 0) return;

    const bounds = new kakao.maps.LatLngBounds();

    validPlaces.forEach((place) => {
      const position = new kakao.maps.LatLng(place.lat, place.lng);
      bounds.extend(position);

      const isSelected = selectedPlace === place.id;
      const pin = document.createElement("div");
      pin.style.cursor = onSelectPlace ? "pointer" : "default";
      pin.style.transform = isSelected ? "scale(1.25)" : "scale(1)";
      pin.style.transition = "transform 0.15s ease";
      pin.innerHTML = `
        <div style="
          position: relative;
          width: 2.5rem; height: 2.5rem;
          border-radius: 9999px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.875rem; font-weight: 600;
          background: ${pinBackground(isSelected, !!place.confirmed)};
          color: ${pinColor(isSelected, !!place.confirmed)};
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          ${isSelected ? "box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 30%, transparent), 0 4px 12px rgba(0,0,0,0.25);" : ""}
          ${!isSelected && !place.confirmed ? "border: 2px solid var(--primary);" : ""}
        ">${place.order}${
          place.confirmed
            ? `<div style="position:absolute;top:-0.25rem;right:-0.25rem;width:1rem;height:1rem;border-radius:9999px;background:var(--success-500);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px var(--card);">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4"><path d="M20 6 9 17l-5-5"/></svg>
              </div>`
            : ""
        }</div>
      `;

      if (isSelected) {
        const label = document.createElement("span");
        label.textContent = place.name;
        label.style.cssText = `
          position: absolute;
          left: 50%;
          top: 3rem;
          transform: translateX(-50%);
          max-width: 12rem;
          padding: 0.35rem 0.6rem;
          border: 1px solid var(--primary);
          border-radius: 0.5rem;
          background: var(--card);
          color: var(--foreground);
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-shadow: 0 3px 10px rgba(0,0,0,0.18);
          pointer-events: none;
        `;
        pin.appendChild(label);
      }

      if (onSelectPlace) {
        pin.addEventListener("click", () => onSelectPlace(place.id));
      }

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content: pin,
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: isSelected ? 10 : 1,
      });
      overlay.setMap(map);
      overlaysRef.current.set(place.id, overlay);
    });

    if (validPlaces.length === 1) {
      map.setCenter(bounds.getSouthWest());
      map.setLevel(5);
    } else {
      map.setBounds(bounds, 60, 60, 60, 60);
    }
  }, [places, selectedPlace, sdkReady, onSelectPlace]);

  // 선택된 장소로 지도 중심을 부드럽게 이동.
  useEffect(() => {
    const kakao = window.kakao;
    const map = mapRef.current;
    const place = places.find((p) => p.id === selectedPlace);
    if (!sdkReady || !kakao?.maps || !map || !place) return;
    map.panTo(new kakao.maps.LatLng(place.lat, place.lng));
  }, [selectedPlace, places, sdkReady]);

  if (sdkError) {
    return (
      <div className="relative w-full h-full bg-muted flex flex-col items-center justify-center gap-2 text-center px-4">
        <MapPin className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{sdkError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-muted">
      <div ref={containerRef} className="absolute inset-0" />

      {/* 지도 범례 */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm hanji-noise border border-border rounded-lg p-3 shadow-sm pointer-events-none">
        <p className="text-xs text-muted-foreground mb-2">총 {places.length}개 장소</p>
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="w-4 h-4 text-primary" />
          <span>추천 루트</span>
        </div>
      </div>
    </div>
  );
}
