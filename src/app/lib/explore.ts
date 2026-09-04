import { apiFetch } from "./api";

/**
 * itda-backend explore 도메인(KingdomController/PersonController, No.21~25)을 감싸는 클라이언트.
 *
 * 2026-08-22 dev 브랜치 기준, 로컬 백엔드에 curl로 직접 확인한 실제 동작(명세서와 다른 점):
 *
 * 1) 경로에 "/api" 프리픽스가 없다. 다른 도메인은 전부 @RequestMapping("/api/...")인데
 *    KingdomController/PersonController만 "/explore/kingdoms", "/explore/persons"로 매핑돼 있다
 *    (KingdomController.java:14, PersonController.java:11 실제 확인). vite.config.ts에
 *    "/explore" 프록시를 별도로 추가해야 로컬에서 호출이 된다.
 *
 * 2) 응답 필드는 대부분 camelCase다(Jackson 기본 규칙, @JsonProperty 없음). 다만 PersonResponse의
 *    id 필드만은 예외로, 실제로는 person_id로 내려온다(2026-08-26 실제 응답으로 확인 — 프론트가
 *    이전에 personId로 잘못 가정해서 목록/상세 이동 링크가 "/app/person/undefined"로 깨졌었다).
 *
 * 3) 인증이 필요하다(비로그인 시 403). SecurityConfig.filterChain()의 requestMatchers가 전부
 *    "/api/..." 패턴이라 "/explore/**"는 어떤 permitAll 규칙에도 안 걸리고 anyRequest().authenticated()로
 *    떨어진다. 나라별/인물별 "둘러보기"라는 기능 성격상 의도된 동작인지는 불명확하고, 백엔드 팀 확인이
 *    필요해 보인다(SecurityConfig에 "/explore/**" permitAll 추가 여부). 프론트는 우선 401/403을
 *    "로그인 필요" 상태로 처리한다.
 *
 * 4) GET /explore/kingdoms/{kingdom}의 {kingdom}은 Kingdom enum 값 그대로(대문자, 예: GORYEO)를
 *    요구한다. 소문자 등 매칭 안 되는 값을 주면 404가 아니라 400
 *    ({"message":"No enum constant ..."})이 온다.
 *
 * 5) GET /explore/persons/{personId}도 존재하지 않는 id면 404가 아니라 400
 *    ({"message":"존재하지 않는 인물입니다."})이 온다(PersonService.getPerson이
 *    IllegalArgumentException을 던지고 GlobalExceptionHandler가 400으로 매핑).
 *
 * 6) KingdomDetailResponse는 kingdom/name/time_period/description/image_url을 내려준다
 *    (2026-08-26 기준 KingdomDetailResponse.java 확인, No.22 "나라 상세 정보" 반영). 값은
 *    HistoricalKingdomData.KINGDOMS에서 오는데 전체 Kingdom enum이 다 채워져 있어 실제로는
 *    null이 오지 않지만, DTO 필드 자체가 nullable 아님을 보장하지 않으므로 화면에서는 방어적으로
 *    다룬다. 주요 사실·관련 사극·관련 장소 같은 필드는 여전히 백엔드에 없다(디자인 목업에만 있던
 *    데이터). PersonResponse도 name/description 외에 role·연도·업적·관련 사극·관련 장소는 없다.
 *    화면에서 이 값들을 지어내지 않는다.
 *
 * 7) 로컬 DB의 person 테이블은 현재 0 rows다(HistoricalPersonData.PEOPLE는 시드 러너에 연결돼 있지
 *    않은 죽은 코드). 그래서 GET /explore/persons, GET /explore/kingdoms/{kingdom}/persons는
 *    지금 항상 빈 배열을 반환한다 — 화면에서 반드시 빈 상태 UI를 갖춰야 한다.
 */

export interface Kingdom {
  kingdom: string;
  name: string;
  // KingdomResponse(목록, No.21)에는 있지만 null은 아니고, KingdomDetailResponse(상세, No.22)에만
  // 있는 필드는 목록 응답엔 아예 안 온다(undefined) — 그래서 description은 optional로 둔다.
  time_period: string | null;
  description?: string | null;
  image_url: string | null;
}

export interface Person {
  person_id: number;
  name: string;
  description: string | null;
  // 카드용 1~2줄 짧은 소개(PersonResponse.summary, 2026-08-27 백엔드에 추가됨). 구버전 캐시 등
  // 아직 값이 없는 응답을 대비해 optional로 두고, 카드에서는 summary ?? description으로 폴백한다.
  summary?: string | null;
  kingdom: string;
  type: string;
  // 상세(GET /explore/persons/{id})는 항상 채워 주지만, 목록 응답에서는 아직 비어있는 경우가
  // 있어 방어적으로 optional로 둔다.
  image_url?: string | null;
}

// No.21 — 나라 목록
export function getKingdoms() {
  return apiFetch<Kingdom[]>("/api/explore/kingdoms");
}

// No.22 — 나라 상세
export function getKingdomDetail(kingdom: string) {
  return apiFetch<Kingdom>(`/api/explore/kingdoms/${encodeURIComponent(kingdom)}`);
}

// No.23 — 나라별 인물
export function getPersonsByKingdom(kingdom: string) {
  return apiFetch<Person[]>(`/api/explore/kingdoms/${encodeURIComponent(kingdom)}/persons`);
}

// 나라별 관련 콘텐츠 — GET /explore/kingdoms/{kingdom}/contents. KingdomController.getContentsByKingdom가
// 반환하는 KingdomContentResponse는 인물별 관련 콘텐츠(getPersonContents)와 완전히 동일한 DTO다
// (explore/dto/KingdomContentResponse.java 실제 확인 — @JsonProperty 없는 record라 camelCase 그대로
// 내려온다). 그래서 별도 타입을 만들지 않고 PersonContent를 그대로 재사용한다.
export function getKingdomContents(kingdom: string) {
  return apiFetch<PersonContent[]>(`/api/explore/kingdoms/${encodeURIComponent(kingdom)}/contents`);
}

// RelatedPlaceResponse(explore/dto/RelatedPlaceResponse.java) 실제 확인: place_id만
// @JsonProperty("place_id")로 snake_case이고, 나머지는 필드명이 전부 한 단어라 camelCase/snake_case
// 표기가 같아 보일 뿐 별도 매핑이 없다(name/category/description/latitude/longitude/address/region).
// description은 Place.ofTourApi()가 값을 채우지 않는 경로가 있어 null이 내려올 수 있다.
export interface RelatedPlace {
  place_id: number;
  name: string;
  category: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string;
  region: string;
}

// 나라별 관련 장소 — GET /explore/kingdoms/{kingdom}/places.
export function getKingdomPlaces(kingdom: string) {
  return apiFetch<RelatedPlace[]>(`/api/explore/kingdoms/${encodeURIComponent(kingdom)}/places`);
}

// No.24 — 전체 인물 목록
export function getPersons() {
  return apiFetch<Person[]>("/api/explore/persons");
}

// No.25 — 인물 상세
export function getPersonDetail(personId: number | string) {
  return apiFetch<Person>(`/api/explore/persons/${personId}`);
}

// 인물 관련 콘텐츠 — GET /explore/persons/{personId}/contents.
// 명세서/작업 지시서는 응답을 { content_id, title, thumbnail_url, view_count }(snake_case)로
// 안내하지만, 실제 PersonController.getContentsByPerson()이 반환하는 KingdomContentResponse는
// @JsonProperty 지정이 없는 record라(2026-08-28 기준 PersonController.java:33-38,
// KingdomContentResponse.java 실제 확인) camelCase 필드 이름 그대로 내려오고, view_count 자체가
// 없다(썸네일은 posterUrl, 대신 releaseYear/mediaType/overview가 있다). 실제 응답 기준으로 타입을 둔다.
export interface PersonContent {
  contentId: number;
  title: string;
  releaseYear: number | null;
  mediaType: string | null;
  posterUrl: string | null;
  overview: string | null;
}

export function getPersonContents(personId: number | string) {
  return apiFetch<PersonContent[]>(`/api/explore/persons/${personId}/contents`);
}

// 인물 관련 장소 — GET /explore/persons/{personId}/places. 나라별 관련 장소(getKingdomPlaces)와
// 동일한 RelatedPlaceResponse를 반환하므로(PersonController.java:40-45 실제 확인) RelatedPlace
// 타입을 그대로 재사용한다.
export function getPersonPlaces(personId: number | string) {
  return apiFetch<RelatedPlace[]>(`/api/explore/persons/${personId}/places`);
}
