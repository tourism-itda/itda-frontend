import { apiFetch } from "./api";

/**
 * itda-backend feat/community-review 브랜치(dev 병합됨, PR #18) 리뷰 도메인 API(No.43~45)를 감싸는 클라이언트.
 * 대상은 "공유된" itinerary에 한정된다 — 공유 안 된 itinerary_id로 조회/작성하면 404.
 * 응답은 snake_case(@JsonNaming SnakeCaseStrategy), 2026-08-22 dev 소스로 직접 확인함.
 */

export interface Review {
  review_id: number;
  author_nickname: string | null;
  author_profile_url: string | null;
  rating: number;
  content: string;
  like_count: number;
  created_at: string;
  // 비로그인 조회이거나(is_liked 계산 안 함), 방금 작성 직후 응답(null로 내려와 키 자체가 빠짐)에는 없다.
  is_liked?: boolean;
}

export interface ReviewListParams {
  /** 0부터 시작 */
  page?: number;
  limit?: number;
}

// No.43 GET /api/itineraries/:itinerary_id/reviews — 인증 선택(로그인 시에만 is_liked 계산).
export function getReviews(itineraryId: number | string, params: ReviewListParams = {}) {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiFetch<Review[]>(`/api/itineraries/${itineraryId}/reviews${qs ? `?${qs}` : ""}`);
}

// No.44 POST /api/itineraries/:itinerary_id/reviews — 인증 필요. rating은 1~5.
export function createReview(itineraryId: number | string, rating: number, content: string) {
  return apiFetch<Review>(`/api/itineraries/${itineraryId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ rating, content }),
  });
}

export interface ReviewLikeToggleResult {
  liked: boolean;
  like_count: number;
}

// No.45 POST /api/reviews/:review_id/likes — 인증 필요. 토글(이미 눌렀으면 취소).
export function toggleReviewLike(reviewId: number | string) {
  return apiFetch<ReviewLikeToggleResult>(`/api/reviews/${reviewId}/likes`, {
    method: "POST",
  });
}
