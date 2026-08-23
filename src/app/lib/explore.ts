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
 * 2) 응답 필드가 camelCase다. 다른 도메인(ContentDetailResponse 등)은 @JsonProperty로 snake_case를
 *    명시하지만 KingdomResponse/PersonResponse는 그런 어노테이션이 없어 Jackson 기본 규칙대로
 *    personId/kingdom/type이 camelCase 그대로 나간다.
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
 * 6) KingdomDetailResponse는 kingdom/name 두 필드뿐이다. 시대 설명·연도·주요 사실·관련 사극·관련 장소
 *    같은 필드는 백엔드에 아예 없다(디자인 목업에만 있던 데이터). PersonResponse도 name/description
 *    외에 role·연도·업적·관련 사극·관련 장소는 없다. 화면에서 이 값들을 지어내지 않는다.
 *
 * 7) 로컬 DB의 person 테이블은 현재 0 rows다(HistoricalPersonData.PEOPLE는 시드 러너에 연결돼 있지
 *    않은 죽은 코드). 그래서 GET /explore/persons, GET /explore/kingdoms/{kingdom}/persons는
 *    지금 항상 빈 배열을 반환한다 — 화면에서 반드시 빈 상태 UI를 갖춰야 한다.
 */

export interface Kingdom {
  kingdom: string;
  name: string;
}

export interface Person {
  personId: number;
  name: string;
  description: string | null;
  kingdom: string;
  type: string;
}

// No.21 — 나라 목록
export function getKingdoms() {
  return apiFetch<Kingdom[]>("/explore/kingdoms");
}

// No.22 — 나라 상세
export function getKingdomDetail(kingdom: string) {
  return apiFetch<Kingdom>(`/explore/kingdoms/${encodeURIComponent(kingdom)}`);
}

// No.23 — 나라별 인물
export function getPersonsByKingdom(kingdom: string) {
  return apiFetch<Person[]>(`/explore/kingdoms/${encodeURIComponent(kingdom)}/persons`);
}

// No.24 — 전체 인물 목록
export function getPersons() {
  return apiFetch<Person[]>("/explore/persons");
}

// No.25 — 인물 상세
export function getPersonDetail(personId: number | string) {
  return apiFetch<Person>(`/explore/persons/${personId}`);
}
