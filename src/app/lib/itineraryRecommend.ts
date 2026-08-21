import { apiFetch } from "./api";

/**
 * itda-backend 일정 추천 미리보기 API(`GET /api/itineraries/recommend`)를 감싸는 클라이언트.
 * 이 응답은 DB에 저장되지 않는 미리보기용 결과다. slot.place는 placeDetail.ts의 Place와
 * 필드 구성이 달라(단일 image_url, 다음 장소까지 거리/시간 포함, address/kakao_place_id 없음)
 * 별도 타입으로 정의한다. v2에서 fee(입장료) 필드는 제거되었으므로 포함하지 않는다.
 */

export interface ItineraryRecommendPlace {
  place_id: number;
  name: string;
  category: string;
  description: string;
  image_url: string;
  opening_hours: string;
  to_next_distance_m: number | null;
  to_next_duration_min: number | null;
  latitude: number;
  longitude: number;
}

export interface ItineraryRecommendSlot {
  visit_order: number;
  place: ItineraryRecommendPlace;
}

export interface ItineraryRecommendResponse {
  content_id: number;
  content_title: string;
  region: string;
  slots: ItineraryRecommendSlot[];
}

export function getItineraryRecommendation(contentId: number | string) {
  return apiFetch<ItineraryRecommendResponse>(
    `/api/itineraries/recommend?content_id=${contentId}`
  );
}

// ─── 일정 저장 (POST /api/itineraries) ───
// 미리보기(recommend)와 달리 로그인이 필요하다. apiFetch가 accessToken을 자동으로 붙이므로
// 비로그인 상태면 백엔드가 401을 반환하고, 호출부에서 이를 구분해 처리한다.

export type ItineraryPlaceStatus = "PENDING" | "CONFIRMED" | "CHANGED";

export interface ItinerarySavePlace {
  place_id: number;
  day_number?: number;
  visit_order: number;
  status: ItineraryPlaceStatus;
  memo?: string;
}

export interface ItinerarySavePayload {
  content_id?: number;
  title: string;
  travel_date: string;
  region?: string;
  duration_label?: string;
  places: ItinerarySavePlace[];
}

export interface ItinerarySaveResponse {
  itinerary_id: number;
}

export function saveItinerary(payload: ItinerarySavePayload) {
  return apiFetch<ItinerarySaveResponse>("/api/itineraries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
