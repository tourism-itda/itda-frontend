/** 사진이 없거나 불러오지 못한 장소에 보여줄 잇다 기본 이미지. */
const ITDA_LOGO = "/images/logo.png";

/**
 * @param placeType "SPOT" | "RESTAURANT" | "CAFE" 중 확실히 아는 값이 있으면 넘긴다(예: 루트
 *   후보 응답). 모르면 생략 — category 텍스트만으로 카페/음식 여부를 추정하고, 그마저 못
 *   가리면 관광지(spot) 기본 이미지로 대체한다.
 * @param category place.category. null이어도 된다.
 */
export function placeholderImageFor(placeType: string | undefined | null, category: string | null | undefined): string {
  return ITDA_LOGO;
}
