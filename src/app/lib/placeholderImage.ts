/**
 * 사진이 없거나(image_url null) 못 불러온(onError) 장소에 붙일 분류별 기본 이미지.
 *
 * itda-backend의 PlaceholderImages(place/service/PlaceholderImages.java)가 "루트 만들기"
 * 응답(RoutePlace)에서만 채워주는 로직을 그대로 옮겨왔다 — 카카오 후보(image_url 필드 자체가
 * 없음), 북마크/콘텐츠 관련 장소(place 도메인 미완성으로 image_url이 null) 등 백엔드가 아직
 * 기본 이미지를 채워주지 않는 응답에서도 같은 규칙으로 보여주기 위함이다.
 * 이미지 파일은 백엔드가 static/images/place-types/에서 서빙하는 것과 동일한 경로를 쓴다.
 * 백엔드 쪽 분류 규칙이 바뀌면 이 파일도 같이 맞춰야 한다.
 */

const BASE = "/images/place-types/";

const SPOT = BASE + "spot.svg";
const CAFE = BASE + "cafe.svg";
const RESTAURANT = BASE + "restaurant.svg";
const KOREAN = BASE + "restaurant-korean.svg";
const CHINESE = BASE + "restaurant-chinese.svg";
const JAPANESE = BASE + "restaurant-japanese.svg";
const WESTERN = BASE + "restaurant-western.svg";

function containsAny(source: string, fragments: string[]): boolean {
  return fragments.some((fragment) => source.includes(fragment));
}

function restaurantImageFor(category: string): string {
  if (containsAny(category, ["중식", "중국"])) return CHINESE;
  if (containsAny(category, ["일식", "일본", "초밥", "돈까스", "라멘", "우동"])) return JAPANESE;
  if (containsAny(category, ["양식", "이탈리", "프랑스", "스테이크", "피자", "파스타", "햄버거"])) return WESTERN;
  if (containsAny(category, ["한식", "분식", "국밥", "백반", "고기", "찌개", "칼국수"])) return KOREAN;
  return RESTAURANT;
}

/**
 * @param placeType "SPOT" | "RESTAURANT" | "CAFE" 중 확실히 아는 값이 있으면 넘긴다(예: 루트
 *   후보 응답). 모르면 생략 — category 텍스트만으로 카페/음식 여부를 추정하고, 그마저 못
 *   가리면 관광지(spot) 기본 이미지로 대체한다.
 * @param category place.category. null이어도 된다.
 */
export function placeholderImageFor(placeType: string | undefined | null, category: string | null | undefined): string {
  const c = category ?? "";

  if (placeType === "CAFE") return CAFE;
  if (placeType === "SPOT") return SPOT;
  if (placeType === "RESTAURANT") return restaurantImageFor(c);

  // place_type을 모를 때: category 텍스트로만 추정한다.
  if (containsAny(c, ["카페", "cafe", "Cafe", "CAFE"])) return CAFE;
  if (containsAny(c, ["중식", "중국", "일식", "일본", "초밥", "돈까스", "라멘", "우동", "양식", "이탈리", "프랑스", "스테이크", "피자", "파스타", "햄버거", "한식", "분식", "국밥", "백반", "고기", "찌개", "칼국수", "음식점", "식당"])) {
    return restaurantImageFor(c);
  }
  return SPOT;
}
