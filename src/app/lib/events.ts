import { apiFetch } from "./api";

export interface EventSummary {
  content_id: string;
  title: string;
  image_url: string | null;
  address: string | null;
  event_start_date: string;   // "YYYY-MM-DD"
  event_end_date: string | null;
}

export function getUpcomingEvents(limit = 3) {
  return apiFetch<EventSummary[]>(`/api/events/upcoming?limit=${limit}`);
}
