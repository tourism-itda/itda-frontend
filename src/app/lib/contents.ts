import { apiFetch } from "./api";

/**
 * itda-backend feat/content 브랜치 콘텐츠 도메인 API(`/api/contents/**`)를 감싸는 클라이언트.
 * API 명세서 v4는 응답 필드를 camelCase로 안내하지만, 실제 DTO(ContentDetailResponse 등)는
 * @JsonProperty로 전부 snake_case를 명시하고 있어 실제 응답 기준(snake_case)으로 타입을 정의한다.
 */

export interface ContentMediaSummary {
  type: string;
  release_year: number;
}

export interface ContentCategorySummary {
  category_id: number;
  // category 도메인 완성 전까지는 type/name이 "정보 준비중" 같은 placeholder로 내려온다.
  type: string;
  name: string;
}

export interface ContentCharacter {
  content_character_id: number;
  character_name: string;
  actor_name: string;
  is_historical: boolean;
  sort_order: number;
}

export interface ContentStorySection {
  content_story_section_id: number;
  keyword: string;
  body: string;
  sort_order: number;
}

export interface ContentFactCheck {
  content_fact_check_id: number;
  topic: string;
  fact: string;
  fiction: string;
  sort_order: number;
}

// place 도메인 완성 전까지 name/category는 "정보 준비중"/"미분류" 같은 placeholder로 채워진다.
export interface ContentDetailRelatedPlace {
  place_id: number;
  name: string;
  category: string;
  region: string | null;
}

export interface ContentDetail {
  content_id: number;
  title: string;
  // DB에 아직 스토리텔링 데이터가 채워지지 않은 콘텐츠(예: TMDB에서 막 가져온 직후)는
  // null로 내려온다(실제로 확인함, 예: content_id=101 응답 전부 null).
  summary: string | null;
  story_intro: string | null;
  story_body: string | null;
  media: ContentMediaSummary | null;
  categories: ContentCategorySummary[];
  characters: ContentCharacter[];
  story_sections: ContentStorySection[];
  fact_checks: ContentFactCheck[];
  // 현재 백엔드(ContentService.buildDetailResponse)는 항상 배열(빈 배열 포함)을 반환하지만,
  // place 도메인 PR 병합 전까지 null이 내려올 수 있다는 스펙 문서 안내에 따라 null도 방어적으로 허용한다.
  related_places: ContentDetailRelatedPlace[] | null;
}

// contentId는 TMDB movieId 그대로 사용한다. DB에 없으면 서버가 TMDB에서 가져와 저장 후 반환하므로
// 유효한 TMDB 영화 id라면 사실상 404가 나지 않는다. 인증 여부와 무관하게 조회 가능하다.
export function getContentDetail(contentId: number | string) {
  return apiFetch<ContentDetail>(`/api/contents/${contentId}`);
}

export interface ContentPlaceListItem {
  place_id: number;
  // place 도메인 완성 전까지 name/category는 placeholder("정보 준비중"/"미분류")이고
  // image_url/description은 null로 내려온다.
  name: string;
  category: string;
  recommend_order: number;
  image_url: string | null;
  description: string | null;
  // 비로그인 시 항상 false로 내려온다.
  is_bookmarked: boolean;
}

// recommend_order 기준으로 정렬되어 온다. 인증 선택(비로그인도 조회 가능).
export function getContentRelatedPlaces(contentId: number | string) {
  return apiFetch<ContentPlaceListItem[]>(`/api/contents/${contentId}/places`);
}

// ─── 콘텐츠 목록 (GET /api/contents, No.15) ───
// 2026-08-21 dev 브랜치(PR #14) 기준 ContentController.list()/ContentRepository.search()
// 실제 소스로 검증한 내용:
// - 쿼리 파라미터는 camelCase가 아니라 snake_case다: q, media_type, category_id, sort, page, limit
//   (@RequestParam(name = "media_type") 등으로 명시돼 있음. media/place 도메인과 달리
//   이 엔드포인트는 쿼리 파라미터까지 snake_case인 게 특이점이다.)
// - page는 0부터 시작한다(Spring PageRequest, default 0). limit default는 20, sort default는 "recent".
// - category_id 필터는 SQL(WHERE cc.id.categoryId = :categoryId)로는 이미 동작하지만,
//   category_id는 다연 카테고리 도메인 작업 의존성 때문에 실제로는 "미분류" placeholder로만 이름이 나오고
//   현재 로컬 DB의 content_category 테이블이 비어 있어(0 rows) 어떤 categoryId로 필터해도 항상 빈 결과가
//   나온다. → UI에서는 카테고리 필터를 노출하지 않는다(다연 작업 완료 후 활성화).
// - category, media, thumbnail_url은 전부 null 가능(콘텐츠에 연결된 row/필드가 없으면 null).

export type ContentMediaType = "DRAMA" | "MOVIE" | "DOCUMENTARY";
export type ContentSort = "popular" | "recent";

export interface ContentListParams {
  q?: string;
  mediaType?: ContentMediaType;
  categoryId?: number;
  sort?: ContentSort;
  /** 0부터 시작 (백엔드 PageRequest 기준) */
  page?: number;
  limit?: number;
}

export interface ContentListItem {
  content_id: number;
  title: string;
  thumbnail_url: string | null;
  media: { type: string; release_year: number } | null;
  // name은 category 도메인 완성 전까지 항상 "미분류" placeholder.
  category: { category_id: number; name: string } | null;
  view_count: number;
  // 2026-08-26 기준 백엔드 ContentListItemResponse에는 아직 없는 필드(요청함, PersonResponse의
  // description과 동일한 역할). 백엔드가 내려주기 시작하면 카드에 자동으로 노출된다.
  summary?: string | null;
}

export interface ContentListResponse {
  data: ContentListItem[];
  total: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function getContents(params: ContentListParams = {}) {
  return apiFetch<ContentListResponse>(
    `/api/contents${buildQuery({
      q: params.q,
      media_type: params.mediaType,
      category_id: params.categoryId,
      sort: params.sort,
      page: params.page,
      limit: params.limit,
    })}`
  );
}
