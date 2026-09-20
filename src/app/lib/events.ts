import { apiFetch } from "./api";

export interface EventSummary {
  content_id: string;
  title: string;
  image_url: string | null;
  address: string | null;
  event_start_date: string;   // "YYYY-MM-DD"
  event_end_date: string | null;
  latitude: number | null;
  longitude: number | null;
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

// 행사 위치를 "지도가 있는 페이지"(구글 지도)에서 열기 위한 링크. 좌표가 있으면 좌표로 핀을 찍고,
// 없으면 주소(없으면 행사명)로 지도 검색을 연다. 구글 검색(getEventLink)과 달리 항상 지도를 보여준다.
export function getEventMapLink(
  event: Pick<EventSummary, "title" | "address" | "latitude" | "longitude">,
): string {
  const base = "https://www.google.com/maps/search/?api=1&query=";
  if (event.latitude != null && event.longitude != null) {
    return base + `${event.latitude},${event.longitude}`;
  }
  const query = event.address ? `${event.title} ${event.address}` : event.title;
  return base + encodeURIComponent(query);
}
