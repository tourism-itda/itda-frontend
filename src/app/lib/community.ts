import { apiFetch } from "./api";

/**
 * itda-backend feat/community-review 브랜치(dev 병합됨, PR #18) 커뮤니티 도메인 API를 감싸는 클라이언트.
 * No.40/41(CommunityController) + No.38/39/42(ItineraryController의 share/import)를 다룬다.
 * 커뮤니티 "글"의 실체는 자유 작성 게시물이 아니라 "공유된 itinerary"다 — 즉 id는 전부 itinerary_id.
 * 응답은 전부 snake_case(@JsonNaming SnakeCaseStrategy), 2026-08-22 dev 소스로 직접 확인함.
 */

export interface CommunityPostSummary {
  itinerary_id: number;
  title: string;
  author_nickname: string | null;
  author_profile_url: string | null;
  // 리뷰가 하나도 없으면 null (평균을 낼 수 없어서).
  rating: number | null;
  review_count: number;
  place_count: number;
  region: string | null;
  duration_label: string | null;
  thumbnail_url: string | null;
  tags: string[];
}

export type CommunitySort = "recent" | "popular" | "rating";

export interface CommunityPostListParams {
  q?: string;
  sort?: CommunitySort;
  /** 0부터 시작 (백엔드 PageRequest 기준) */
  page?: number;
  limit?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// No.40 GET /api/community/posts — 인증 불필요.
export function getCommunityPosts(params: CommunityPostListParams = {}) {
  return apiFetch<CommunityPostSummary[]>(
    `/api/community/posts${buildQuery({
      q: params.q,
      sort: params.sort,
      page: params.page,
      limit: params.limit,
    })}`
  );
}

export interface CommunityStop {
  itinerary_place_id: number;
  visit_order: number;
  name: string | null;
  category: string | null;
  image_url: string | null;
  description: string | null;
  address: string | null;
  opening_hours: string | null;
  latitude: number;
  longitude: number;
}

export interface CommunityPostAuthor {
  nickname?: string;
  profile_url?: string;
}

export interface CommunityPostDetail {
  itinerary_id: number;
  title: string;
  description: string | null;
  // author 자체는 항상 내려오지만(NON_NULL은 그 안의 필드에만 적용), 유저가 삭제된 경우 등엔
  // nickname/profile_url 키가 통째로 빠질 수 있어 옵셔널로 잡는다.
  author: CommunityPostAuthor;
  rating: number | null;
  review_count: number;
  place_count: number;
  region: string | null;
  duration_label: string | null;
  tags: string[];
  thumbnail_url: string | null;
  stops: CommunityStop[];
}

// No.41 GET /api/community/posts/:itinerary_id — 인증 불필요.
// 공유되지 않았거나 존재하지 않는 itinerary_id면 404.
export function getCommunityPostDetail(itineraryId: number | string) {
  return apiFetch<CommunityPostDetail>(`/api/community/posts/${itineraryId}`);
}

export interface ShareItineraryPayload {
  region?: string;
  tags?: string[];
}

export interface ShareItineraryResult {
  itinerary_id: number;
  is_shared: boolean;
}

// No.38 POST /api/itineraries/:id/share — 인증 필요, 본인 소유만(403).
export function shareItinerary(itineraryId: number | string, payload?: ShareItineraryPayload) {
  return apiFetch<ShareItineraryResult>(`/api/itineraries/${itineraryId}/share`, {
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

// No.39 DELETE /api/itineraries/:id/share — 인증 필요, 본인 소유만(403).
export function unshareItinerary(itineraryId: number | string) {
  return apiFetch<ShareItineraryResult>(`/api/itineraries/${itineraryId}/share`, {
    method: "DELETE",
  });
}

export interface ImportItineraryResult {
  itinerary_id: number;
}

// No.42 POST /api/itineraries/import — 인증 필요. 공유 안 된 원본이면 403.
export function importItinerary(sourceItineraryId: number | string) {
  return apiFetch<ImportItineraryResult>("/api/itineraries/import", {
    method: "POST",
    body: JSON.stringify({ source_itinerary_id: Number(sourceItineraryId) }),
  });
}
