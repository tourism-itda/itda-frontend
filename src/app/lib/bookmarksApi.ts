import { apiFetch } from "./api";

/**
 * itda-backend feat/content 브랜치 북마크 API(`/api/bookmarks/**`)를 감싸는 클라이언트.
 * 콘텐츠가 아니라 "장소" 기준 북마크다(place_id). 인증이 필요하며, 토큰이 없으면 401이 아니라
 * 403으로 내려오는 경우가 있어(Spring Security 기본 동작) 호출부에서 401/403을 함께 체크해야 한다
 * (ItineraryRecommendation.tsx의 saveItinerary 에러 처리 참고).
 * 기존 lib/bookmarks.ts는 로그인 없이 쓰는 로컬(localStorage) 북마크라 별도 파일로 분리했다.
 */

export interface BookmarkListItem {
  bookmark_id: number;
  place_id: number;
  // place 도메인 완성 전까지 name/category는 placeholder이고 region/image_url은 null로 내려온다.
  name: string;
  category: string;
  region: string | null;
  image_url: string | null;
  created_at: string;
}

export function getMyBookmarks() {
  return apiFetch<BookmarkListItem[]>("/api/bookmarks");
}

export interface CreateBookmarkResponse {
  bookmark_id: number;
}

export function createBookmark(placeId: number) {
  return apiFetch<CreateBookmarkResponse>("/api/bookmarks", {
    method: "POST",
    body: JSON.stringify({ place_id: placeId }),
  });
}

export interface DeleteBookmarkResponse {
  success: boolean;
}

export function deleteBookmark(bookmarkId: number) {
  return apiFetch<DeleteBookmarkResponse>(`/api/bookmarks/${bookmarkId}`, {
    method: "DELETE",
  });
}

// 서버가 장소 상세/목록 응답에 bookmark_id를 내려주지 않는 경우가 있어(is_bookmarked만 옴),
// 해제하려면 내 북마크 목록에서 place_id로 역으로 찾아야 한다.
export async function findBookmarkId(placeId: number): Promise<number | undefined> {
  const mine = await getMyBookmarks();
  return mine.find((b) => b.place_id === placeId)?.bookmark_id;
}
