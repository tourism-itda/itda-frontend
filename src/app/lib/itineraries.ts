import { apiFetch } from "./api";
import { ItineraryPlaceStatus } from "./itineraryRecommend";

export type { ItineraryPlaceStatus };

/**
 * itda-backend 플래너 도메인 API(No.29~32, ItineraryController)를 감싸는 클라이언트.
 * 전부 인증 필요, snake_case(@JsonNaming SnakeCaseStrategy), 2026-08-22 dev 소스로 직접 확인함.
 * 본인 소유가 아닌 itinerary_id에 접근하면 403(ForbiddenException), 없으면 404.
 */

// ─── No.29 GET /api/itineraries — 내 플래너 목록 ───

export interface ItinerarySummary {
  itinerary_id: number;
  title: string;
  content_title: string | null;
  travel_date: string | null;
  region: string | null;
  duration_label: string | null;
  is_shared: boolean;
  place_count: number;
  thumbnail_url: string | null;
}

export function getMyItineraries() {
  return apiFetch<ItinerarySummary[]>("/api/itineraries");
}

// ─── No.30 GET /api/itineraries/:id — 저장 일정 상세 ───

export interface ItineraryDetailPlace {
  itinerary_place_id: number;
  place_id: number;
  day_number: number;
  visit_order: number;
  status: ItineraryPlaceStatus;
  // 같은 day 안에서 다음 장소까지의 값. 그날의 마지막 장소면 null.
  to_next_distance_m: number | null;
  to_next_duration_min: number | null;
  memo: string | null;
  name: string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  opening_hours: string | null;
  latitude: number;
  longitude: number;
}

export interface ItineraryDetail {
  itinerary_id: number;
  title: string;
  content_id: number | null;
  content_title: string | null;
  travel_date: string | null;
  region: string | null;
  duration_label: string | null;
  description: string | null;
  is_shared: boolean;
  places: ItineraryDetailPlace[];
}

export function getItineraryDetail(itineraryId: number | string) {
  return apiFetch<ItineraryDetail>(`/api/itineraries/${itineraryId}`);
}

// ─── No.31 PATCH /api/itineraries/:id — 일정 수정 ───
// 모든 필드 optional(생략 = 미변경). places를 보내면 해당 일정의 장소 전체가 교체된다 —
// 이번 화면에서는 장소 재배치까지는 다루지 않아 places는 항상 생략한다.

export interface UpdateItineraryPlacePayload {
  place_id: number;
  day_number?: number;
  visit_order: number;
  status?: ItineraryPlaceStatus;
  memo?: string;
}

export interface UpdateItineraryPayload {
  title?: string;
  travel_date?: string;
  region?: string;
  duration_label?: string;
  // TODO: 장소 순서 재배치/추가·삭제 UI (범위 밖 — places를 채우면 전체 교체되므로 여기서는 사용 안 함)
  places?: UpdateItineraryPlacePayload[];
}

export interface UpdateItineraryResult {
  itinerary_id: number;
}

export function updateItinerary(itineraryId: number | string, payload: UpdateItineraryPayload) {
  return apiFetch<UpdateItineraryResult>(`/api/itineraries/${itineraryId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ─── No.32 DELETE /api/itineraries/:id — soft delete ───

export interface DeleteItineraryResult {
  success: boolean;
}

export function deleteItinerary(itineraryId: number | string) {
  return apiFetch<DeleteItineraryResult>(`/api/itineraries/${itineraryId}`, {
    method: "DELETE",
  });
}
