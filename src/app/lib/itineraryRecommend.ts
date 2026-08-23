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

// ─── "다른 곳 추천" (GET /api/places/alternative) ───
// 인증 불필요. 슬롯의 place만 바꿔치기하는 용도라 저장(POST /api/itineraries)과는 무관하다.
// v2: fee 필드 없음. 응답이 { place: {...} } 로 한 번 감싸져 있다(AlternativePlaceResponse).
//
// ⚠️ 백엔드 구현(PlaceQueryService.getAlternative)은 "같은 슬롯의 다른 후보"가 아니라
// "이 콘텐츠에서 recommend_order가 visit_order보다 큰 것 중 exclude_place_id가 아닌 첫 번째"를
// 반환한다. 즉 클릭할 때마다 항상 "현재 슬롯의 place_id"를 exclude_place_id로 넘기면 콘텐츠의
// 다음 추천 순번으로 자연스럽게 넘어간다. 더 넘길 후보가 없으면 404("더 이상 추천할 대안
// 장소가 없습니다")가 온다 — 에러가 아니라 정상적인 "마지막 후보" 신호로 다뤄야 한다.

export interface AlternativePlace {
  place_id: number;
  name: string;
  category: string;
  description: string;
  image_url: string | null;
  opening_hours: string;
  latitude: number;
  longitude: number;
}

export interface AlternativePlaceResult {
  place: AlternativePlace;
}

export interface GetAlternativePlaceParams {
  contentId: number;
  visitOrder: number;
  excludePlaceId?: number;
}

export function getAlternativePlace(params: GetAlternativePlaceParams) {
  const search = new URLSearchParams();
  search.set("content_id", String(params.contentId));
  search.set("visit_order", String(params.visitOrder));
  if (params.excludePlaceId !== undefined) {
    search.set("exclude_place_id", String(params.excludePlaceId));
  }
  return apiFetch<AlternativePlaceResult>(`/api/places/alternative?${search.toString()}`);
}

// 내 플래너 목록/상세/수정/삭제(No.29~32)는 lib/itineraries.ts 참고.
