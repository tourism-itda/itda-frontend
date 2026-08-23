import { apiFetch } from "./api";
import { ContentPlaceListItem, getContentRelatedPlaces } from "./contents";

/**
 * "하루 루트 만들기" 신규 흐름(권승훈 파트, 명세서 v4에 없는 신규 엔드포인트 — 팀 합의 필요 상태).
 * 기존 No.27(GET /api/itineraries/recommend, 콘텐츠 기반 단순 추천)과는 완전히 별개다.
 * 2026-08-22 dev 소스(RouteController/RoutePlanner) 기준으로 직접 확인함.
 */

// ─── 1단계: 촬영지 선택 (GET /api/contents/:content_id/places) ───
// contents.ts의 관련 촬영지 조회와 동일 엔드포인트라 그대로 재사용한다(중복 구현 방지).
export type { ContentPlaceListItem };
export const getContentPlaces = getContentRelatedPlaces;

// ⚠️ 스펙 문서(API_변경사항_프론트전달.md)는 "촬영지가 없으면 404"라고 적었지만, 실제
// ContentService.getRelatedPlaces() 소스를 보면 콘텐츠 자체가 없을 때만 404(ContentNotFoundException)이고,
// content_place가 0건이면 그냥 빈 배열 []을 200으로 반환한다. 화면에서는 두 경우를 구분해서 다뤄야 한다.

// ─── 2단계: 루트 생성 미리보기 (POST /api/itineraries/route) ───
// 인증 불필요, DB 저장 안 함. spot_place_ids를 비우면(또는 생략하면) 자동추천.

export type RoutePlaceType = "SPOT" | "RESTAURANT" | "CAFE";
export type RouteSlotFilledBy = "USER" | "CURATED" | "SCORED" | "EMPTY";

export interface RoutePlace {
  place_id: number;
  place_type: RoutePlaceType;
  name: string;
  category: string;
  address: string;
  image_url?: string;
  opening_hours: string;
  night_open: boolean;
  latitude: number;
  longitude: number;
}

export interface RouteSlot {
  visit_order: number;
  slot_type: RoutePlaceType;
  label: string;
  estimated_time: string;
  filled_by: RouteSlotFilledBy;
  // NON_NULL 응답이라 값이 없으면 키 자체가 응답에서 빠진다 — optional chaining 필수.
  place?: RoutePlace;
  reason?: string;
  segment_index?: number;
}

export interface RouteSegment {
  segment_index: number;
  start_place_id: number;
  end_place_id?: number;
  start_latitude: number;
  start_longitude: number;
  end_latitude?: number;
  end_longitude?: number;
  direct_distance_m: number;
  allowance_meters: number;
  partial_coverage: boolean;
  slot_orders: number[];
}

export interface RoutePlanResult {
  content_id: number;
  content_title: string;
  region: string;
  spot_count: number;
  allowance_meters: number;
  slots: RouteSlot[];
  segments: RouteSegment[];
}

export interface CreateRoutePayload {
  content_id: number;
  /** 사용자가 직접 고른 촬영지. 최대 3개. 비우면(또는 생략하면) 서버가 자동으로 3곳을 고른다. */
  spot_place_ids?: number[];
  /** 동선 허용거리(m). 생략 시 서버 기본값 3000. */
  allowance_meters?: number;
}

export function createRoute(payload: CreateRoutePayload) {
  return apiFetch<RoutePlanResult>("/api/itineraries/route", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── 3단계: 빈 슬롯 후보 조회 (GET /api/itineraries/route/candidates) ───
// 인증 불필요. slot_type에 SPOT을 보내면 400(InvalidRequestException) — 호출부에서 절대 안 보내야 한다.

export type RouteFillableType = "RESTAURANT" | "CAFE";

export interface RouteCandidate {
  external_id: string;
  place_type: RoutePlaceType;
  name: string;
  category: string;
  address: string;
  // NON_NULL이라 없으면 키 자체가 빠진다.
  image_url?: string;
  latitude: number;
  longitude: number;
  /** 우회거리(m), 오름차순 정렬되어 온다. */
  detour_meters: number;
  /**
   * false면 detour_meters는 우회거리가 아니라 앵커로부터의 단순 거리다(마지막 구간처럼 뒤
   * 앵커가 없을 때). 이 경우 "동선 +Nm"이라고 표시하면 안 되고 "가까운 순" 정도로만 표기한다.
   */
  detour_known: boolean;
}

export interface CandidateListResult {
  slot_type: RoutePlaceType;
  /** 실제 적용된 허용거리(m) — 요청값이 상한(20000)을 넘으면 잘려서 반영된다. */
  allowance_meters: number;
  partial_coverage: boolean;
  /** 빈 배열일 수 있다 — 에러가 아니라 "이 구간엔 후보가 없다"는 뜻. */
  candidates: RouteCandidate[];
}

export interface GetRouteCandidatesParams {
  startPlaceId: number;
  /** 하루 마지막 구간이면 없음 — 그때는 앵커 주변을 가까운 순으로 반환(detour_known=false). */
  endPlaceId?: number;
  slotType: RouteFillableType;
  /** 생략 시 서버 기본값(3000), 상한 20000(넘으면 잘림). */
  allowanceMeters?: number;
  /** 이미 보여준 후보들 — "다른 곳 보기" 재조회 시 누적해서 넘긴다. */
  excludeExternalIds?: string[];
}

export function getRouteCandidates(params: GetRouteCandidatesParams) {
  const search = new URLSearchParams();
  search.set("start_place_id", String(params.startPlaceId));
  if (params.endPlaceId !== undefined) {
    search.set("end_place_id", String(params.endPlaceId));
  }
  search.set("slot_type", params.slotType);
  if (params.allowanceMeters !== undefined) {
    search.set("allowance_meters", String(params.allowanceMeters));
  }
  for (const externalId of params.excludeExternalIds ?? []) {
    search.append("exclude_external_ids", externalId);
  }
  return apiFetch<CandidateListResult>(`/api/itineraries/route/candidates?${search.toString()}`);
}

// ─── 4단계: 고른 후보를 place로 확정 (POST /api/places/import) ───
// ⚠️ 현재 인증 불필요(PlaceController.importPlace에 @LoginUser 없음, 명세서 v4에 없는 신규
// 엔드포인트라 팀 합의 전). TODO: 나중에 인증이 걸리면 401/403 분기 추가 필요.

export interface ImportPlacePayload {
  external_id: string;
  place_type: RouteFillableType;
}

export interface ImportedPlace {
  place_id: number;
  place_type: RoutePlaceType;
  name: string;
  category: string;
  address: string;
  opening_hours: string;
  night_open: boolean;
  latitude: number;
  longitude: number;
  // ⚠️ image_url이 응답에 없다(서버가 항상 null로 내려 NON_NULL에 의해 키가 빠짐).
  // 후보 목록(RouteCandidate)에서 갖고 있던 image_url을 호출부가 들고 있다가 재사용해야 한다.
}

export function importPlace(payload: ImportPlacePayload) {
  return apiFetch<ImportedPlace>("/api/places/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
