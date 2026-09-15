import { apiFetch } from "./api";

export interface EventSummary {
  content_id: string;
  title: string;
  image_url: string | null;
  address: string | null;
  event_start_date: string;   // "YYYY-MM-DD"
  event_end_date: string | null;
  // 축제 사이트 링크. 관광API에 등록이 안 된 축제도 많아 null일 수 있다.
  event_homepage: string | null;
}

export function getUpcomingEvents(limit = 3) {
  return apiFetch<EventSummary[]>(`/api/events/upcoming?limit=${limit}`);
}

// 실제로 확인해보니 관광API가 축제 홈페이지(eventhomepage)를 채워주는 경우가 거의 없다
// (캐시된 행사 87건을 전수 조사해도 전부 빈 값이었다). 대한민국 구석구석(VisitKorea) 사이트도
// 리뉴얼 이후 TourAPI contentId로 바로 들어가는 안정적인 상세 URL이 없어서(직접 확인 — 옛 URL
// 패턴은 전부 404/에러 페이지) 폴백으로 쓸 수 없었다. 그래서 항상 클릭 가능하도록, 링크가 없으면
// 행사명(+지역)으로 구글 검색하는 링크로 대신한다.
export function getEventLink(event: Pick<EventSummary, "title" | "address" | "event_homepage">): string {
  if (event.event_homepage) return event.event_homepage;
  const query = event.address ? `${event.title} ${event.address}` : event.title;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
