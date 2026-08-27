import type { Kingdom } from "./explore";

/**
 * 인물 카드에 표시할 "시대" 텍스트를 구한다.
 *
 * 백엔드에 새 필드를 추가하는 대신, 이미 호출 중인 GET /explore/kingdoms(No.21) 응답의
 * time_period(예: "918년 ~ 1392년")를 그대로 재사용한다. 하드코딩한 별도 상수 테이블은
 * 두지 않는다 — kingdoms 목록 데이터가 있으면 항상 이 함수로 조회한다.
 *
 * 매칭되는 kingdom이 없거나 time_period가 비어 있으면 undefined를 반환하므로,
 * 호출부에서는 값이 없을 때 안전하게 생략하면 된다(에러 없음).
 */
export function getKingdomEra(kingdoms: Kingdom[], kingdomCode: string | undefined): string | undefined {
  if (!kingdomCode) return undefined;
  const match = kingdoms.find((k) => k.kingdom === kingdomCode);
  return match?.time_period ?? undefined;
}
