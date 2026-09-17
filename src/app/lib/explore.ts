import { apiFetch } from "./api";

/**
 * itda-backend explore 도메인(KingdomController/PersonController, No.21~25)을 감싸는 클라이언트.
 *
 * 2026-08-22 dev 브랜치 기준, 로컬 백엔드에 curl로 직접 확인한 실제 동작(명세서와 다른 점):
 *
 * 1) 응답 필드는 대부분 camelCase다(Jackson 기본 규칙, @JsonProperty 없음). 다만 PersonResponse의
 *    id 필드만은 예외로, 실제로는 person_id로 내려온다(2026-08-26 실제 응답으로 확인 — 프론트가
 *    이전에 personId로 잘못 가정해서 목록/상세 이동 링크가 "/app/person/undefined"로 깨졌었다).
 *
 * 2) explore 도메인은 permitAll이 최종 정책으로 확정됐다(SecurityConfig.java의
 *    "/api/explore/**" permitAll 규칙, KingdomController/PersonController 둘 다
 *    @RequestMapping("api/explore/...")로 매핑돼 있음을 2026-09-06 재확인) — 비로그인도
 *    200이 오므로 401/403을 "로그인 필요"로 분기하지 않는다.
 *
 * 3) GET /api/explore/kingdoms/{kingdom}의 {kingdom}은 Kingdom enum 값 그대로(대문자, 예: GORYEO)를
 *    요구한다. 소문자 등 매칭 안 되는 값을 주면 404가 아니라 400
 *    ({"message":"No enum constant ..."})이 온다.
 *
 * 4) GET /api/explore/persons/{personId}도 존재하지 않는 id면 404가 아니라 400
 *    ({"message":"존재하지 않는 인물입니다."})이 온다(PersonService.getPerson이
 *    IllegalArgumentException을 던지고 GlobalExceptionHandler가 400으로 매핑).
 *
 * 5) KingdomDetailResponse는 kingdom/name/time_period/description/image_url을 내려준다
 *    (2026-08-26 기준 KingdomDetailResponse.java 확인, No.22 "나라 상세 정보" 반영). 값은
 *    HistoricalKingdomData.KINGDOMS에서 오는데 전체 Kingdom enum이 다 채워져 있어 실제로는
 *    null이 오지 않지만, DTO 필드 자체가 nullable 아님을 보장하지 않으므로 화면에서는 방어적으로
 *    다룬다. 주요 사실·관련 사극·관련 장소 같은 필드는 여전히 백엔드에 없다(디자인 목업에만 있던
 *    데이터). PersonResponse는 name/description 외에 업적·관련 사극·관련 장소는 없지만,
 *    2026-09-17에 start_year/end_year(개인 재위·생몰 연도, Person 엔티티에는 원래 있었으나
 *    DTO에 안 실려 있던 값)를 추가했다 — 전에는 인물 카드에 나라 전체의 time_period를 대신
 *    붙였는데(kingdomEra.ts), 그러면 같은 나라 인물이 전부 똑같은 연도로 보이는 문제가 있어서
 *    바로잡았다. 화면에서 이 값들을 지어내지 않는다.
 *
 * 6) 로컬 DB의 person 테이블은 이제 시드돼 있다(2026-09-15 기준 GET /explore/persons에서 71건
 *    확인 — 예전엔 0 rows였다는 메모가 있었는데 더 이상 사실이 아니다). 다만 그 시드는
 *    918년(고려 건국) 이전 인물(고구려 주몽·광개토대왕, 백제 온조왕 등)도 포함한 옛 버전 기준이라,
 *    "고려 이전 제외"로 바뀐 현재의 HistoricalPersonData.java(고려부터 시작)와 어긋나 있다.
 *    itda-backend는 읽기 전용이라 DB를 다시 시드해 고칠 수 없으므로, 팀 결정대로 고려 이전은
 *    getPersons()/getPersonsByKingdom()에서 프론트가 걸러낸다(PRE_GORYEO_KINGDOMS 참고).
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

// 918년(고려 건국) 이전 왕조는 서비스 대상에서 제외한다(팀 결정, HistoricalPersonData.java의
// 동일 주석·ContentClassifier의 분류 규칙과 같은 결정). itda-backend의 explore/enums/Kingdom.java와
// HistoricalKingdomData.java는 읽기 전용 참고 폴더(itda-backend) 소속이라 프론트에서 직접 고칠 수
// 없고, 여전히 GET /explore/kingdoms가 이 왕조들을 내려주므로 프론트에서 걸러낸다.
const PRE_GORYEO_KINGDOMS = new Set([
  "GOGURYEO",
  "BAEKJE",
  "SILLA",
  "GAYA",
  "UNIFIED_SILLA",
  "BALHAE",
  "LATER_GOGURYEO",
  "LATER_BAEKJE",
]);

export function isPreGoryeoKingdom(kingdomCode: string | undefined | null): boolean {
  return !!kingdomCode && PRE_GORYEO_KINGDOMS.has(kingdomCode);
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
  // 개인 재위/생몰 연도(PersonResponse.start_year/end_year, 2026-09-17 추가). 인물 카드의
  // "시대" 표시에 쓴다 — 나라 전체 time_period가 아니라 이 값을 우선 써야 한다.
  start_year?: number | null;
  end_year?: number | null;
}

// 인물 카드/상세에 표시할 "시대" 텍스트. person.start_year/end_year가 있으면 그걸 쓰고(개인
// 연도), 없으면 undefined를 반환한다 — 나라 전체 time_period로 대신 채우지 않는다(그러면 같은
// 나라 인물이 전부 같은 연도로 보이는 문제가 재발한다).
export function formatPersonEra(person: Pick<Person, "start_year" | "end_year">): string | undefined {
  if (person.start_year == null || person.end_year == null) return undefined;
  return `${person.start_year}년 ~ ${person.end_year}년`;
}

// No.21 — 나라 목록. 고려 이전 왕조는 응답에서 걸러낸다(위 PRE_GORYEO_KINGDOMS 참고).
export function getKingdoms() {
  return apiFetch<Kingdom[]>("/api/explore/kingdoms").then((kingdoms) =>
    kingdoms.filter((k) => !isPreGoryeoKingdom(k.kingdom)),
  );
}

// No.22 — 나라 상세
export function getKingdomDetail(kingdom: string) {
  return apiFetch<Kingdom>(`/api/explore/kingdoms/${encodeURIComponent(kingdom)}`);
}

// No.23 — 나라별 인물. kingdom 자체가 고려 이전이면 호출부(useDynastyDetail)에서 이미 걸러내지만,
// 방어적으로 여기서도 한 번 더 거른다.
export function getPersonsByKingdom(kingdom: string) {
  return apiFetch<Person[]>(`/api/explore/kingdoms/${encodeURIComponent(kingdom)}/persons`).then((persons) =>
    persons.filter((p) => !isPreGoryeoKingdom(p.kingdom)),
  );
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

// No.24 — 전체 인물 목록. 고려 이전 인물은 응답에서 걸러낸다(위 PRE_GORYEO_KINGDOMS 참고).
export function getPersons() {
  return apiFetch<Person[]>("/api/explore/persons").then((persons) =>
    persons.filter((p) => !isPreGoryeoKingdom(p.kingdom)),
  );
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
