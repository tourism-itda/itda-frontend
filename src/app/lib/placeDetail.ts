import { apiFetch } from "./api";

/**
 * itda-backend v2 장소 상세 API(`GET /api/places/:place_id`)를 감싸는 클라이언트.
 * TourAPI 원본 필드를 그대로 감싸는 v1 `places.ts`와 달리, 자체 DB에 저장된 장소 데이터를
 * 응답 스펙 그대로(snake_case) 반환한다. v2에서 fee(입장료) 필드는 제거되었으므로 포함하지 않는다.
 */

export interface PlaceImage {
  place_image_id: number;
  image_url: string;
  is_primary: boolean;
}

export interface Place {
  place_id: number;
  name: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  region: string;
  opening_hours: string;
  kakao_place_id: string;
  images: PlaceImage[];
  is_bookmarked: boolean;
}

// 로그인 상태면 apiFetch가 Authorization 헤더를 자동으로 붙이므로 is_bookmarked가 개인화되고,
// 비로그인 상태여도 동일하게 동작한다.
export function getPlaceDetail(placeId: number | string) {
  return apiFetch<Place>(`/api/places/${placeId}`);
}
