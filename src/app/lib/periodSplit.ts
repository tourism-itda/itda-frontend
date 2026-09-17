/**
 * 하루 일정 안에서 장소를 방문 순서(visit_order) 그대로 "아침/점심/저녁" 구간으로 안내용으로
 * 나눈다. 실제 방문 시간 데이터가 없어서 순서 기반의 균등 분배일 뿐이고, 저장되는 값이 아니라
 * 화면 표시에만 쓴다(day_number/visit_order는 그대로 둔다).
 *
 * 당일치기(day_number가 하나뿐인 일정)는 "n일차" 헤더 자체가 안 뜨다 보니 장소가 쭉 나열된
 * 것처럼 보였는데, 하루 안에서도 이 구간 헤더로 흐름이 보이게 하기 위함.
 */

const PERIOD_LABELS = ["아침", "점심", "저녁"] as const;

function periodLabelsFor(count: number): string[] {
  if (count <= 1) return [];
  if (count === 2) return [PERIOD_LABELS[0], PERIOD_LABELS[2]];
  return [...PERIOD_LABELS];
}

export interface PeriodGroup<T> {
  label: string;
  items: T[];
}

export function splitIntoPeriods<T>(items: T[]): PeriodGroup<T>[] {
  const labels = periodLabelsFor(items.length);
  if (labels.length === 0) {
    return [{ label: "", items }];
  }

  const groups: T[][] = Array.from({ length: labels.length }, () => []);
  const base = Math.floor(items.length / labels.length);
  let remainder = items.length % labels.length;
  let idx = 0;
  for (let g = 0; g < labels.length; g++) {
    const size = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    for (let i = 0; i < size; i++) groups[g].push(items[idx++]);
  }

  return groups.map((group, i) => ({ label: labels[i], items: group }));
}
