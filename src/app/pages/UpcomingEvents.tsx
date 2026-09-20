import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, MapPinOff, Search, X } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { MapView } from "../components/MapView";
import { getUpcomingEvents, getEventLink, EventSummary } from "../lib/events";
import { getProxiedImageUrl } from "../lib/imageProxy";

// 백엔드 EventService.FETCH_ROWS(관광API 캐시 크기)와 맞춘 값. 이보다 더 달라고 해도
// 캐시에 없는 건 못 받아오므로 사실상 이게 상한이다.
const FETCH_LIMIT = 100;

// "앞으로 한 달"까지만 보여준다(요청 사항). 화면에서 오늘 날짜 기준으로 자른다 —
// 백엔드는 limit 개수 기준으로만 잘라 주고 기간 필터는 없어서 프론트에서 처리한다.
const MONTHS_AHEAD = 1;
const INITIAL_MAP_EVENT_LIMIT = 5;

function addMonthsToToday(months: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-");
  return `${y}년 ${Number(m)}월`;
}

export default function UpcomingEvents() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [regionQuery, setRegionQuery] = useState("");
  const eventItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getUpcomingEvents(FETCH_LIMIT)
      .then((result) => {
        if (cancelled) return;
        setEvents(result);
        setStatus("done");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // event_start_date가 "YYYY-MM-DD" ISO 형식이라 문자열 비교로도 날짜 순서가 그대로 유지된다.
  const cutoff = useMemo(() => toIsoDate(addMonthsToToday(MONTHS_AHEAD)), []);
  const visibleEvents = useMemo(() => {
    const query = regionQuery.trim().toLowerCase();
    return events.filter((event) => {
      if (event.event_start_date > cutoff) return false;
      if (!query) return true;
      return event.address?.toLowerCase().includes(query) ?? false;
    });
  }, [events, cutoff, regionQuery]);

  useEffect(() => {
    if (selectedEventId && !visibleEvents.some((event) => event.content_id === selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [selectedEventId, visibleEvents]);

  const mapEvents = useMemo(
    () =>
      visibleEvents.flatMap((event, index) => {
        if (index >= INITIAL_MAP_EVENT_LIMIT && event.content_id !== selectedEventId) return [];
        if (!Number.isFinite(event.latitude) || !Number.isFinite(event.longitude)) return [];
        return [{
          id: event.content_id,
          order: index + 1,
          name: event.title,
          lat: event.latitude,
          lng: event.longitude,
          image: event.image_url ?? "",
        }];
      }),
    [visibleEvents, selectedEventId],
  );

  useEffect(() => {
    if (!selectedEventId) return;
    eventItemRefs.current[selectedEventId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedEventId]);

  // 월별로 묶어서 보여준다(정렬은 백엔드에서 이미 event_start_date 오름차순으로 옴).
  const groups = useMemo(() => {
    const map = new Map<string, EventSummary[]>();
    for (const event of visibleEvents) {
      const key = event.event_start_date.slice(0, 7);
      const list = map.get(key);
      if (list) list.push(event);
      else map.set(key, [event]);
    }
    return Array.from(map.entries());
  }, [visibleEvents]);

  return (
    <div className="min-h-screen pb-8">
      {/* 상단 헤더 */}
      <div className="sticky top-0 lg:top-16 z-40 bg-background/95 backdrop-blur-sm hanji-noise border-b border-border">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 -ml-1.5 rounded-full hover:bg-muted flex items-center justify-center transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="leading-tight">다가오는 일정</h1>
              <p className="text-sm text-muted-foreground">예정된 축제·공연·행사</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 mt-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">지역별 행사 찾기</h2>
            <p className="text-sm text-muted-foreground">지역을 입력하면 해당 지역의 행사만 지도와 목록에 표시돼요.</p>
          </div>
          <div className="relative w-full sm:w-[560px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={regionQuery}
              onChange={(event) => setRegionQuery(event.target.value)}
              placeholder="예: 서울, 부산, 제주"
              aria-label="지역 검색"
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {regionQuery && (
              <button
                type="button"
                onClick={() => setRegionQuery("")}
                aria-label="지역 검색 지우기"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {status === "loading" && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-1">
                <Skeleton className="w-16 h-16 rounded-sm shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-16 text-muted-foreground">
            <MapPinOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">행사 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
          </div>
        )}

        {status === "done" && visibleEvents.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{regionQuery ? "검색한 지역의 예정된 행사가 없어요" : "예정된 행사가 없어요"}</p>
          </div>
        )}

        {status === "done" && groups.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_560px] lg:items-start">
            <section className="w-full h-[360px] lg:h-[520px] overflow-hidden rounded-xl border border-border flex flex-col">
              <div className="flex items-baseline justify-between px-4 py-3 border-b border-border shrink-0">
                <h2 className="text-sm font-bold text-muted-foreground">행사 위치</h2>
                <span className="text-xs text-muted-foreground">{mapEvents.length}곳 표시</span>
              </div>
              <div className="flex-1 min-h-0">
                  <MapView
                    places={mapEvents}
                    selectedPlace={selectedEventId}
                    onSelectPlace={setSelectedEventId}
                  />
              </div>
            </section>

            <aside className="min-w-0 h-[360px] lg:h-[520px] overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-baseline justify-between px-4 py-3 border-b border-border">
                <h2 className="text-sm font-bold text-muted-foreground">다가오는 축제 일정</h2>
                <span className="text-xs text-muted-foreground">{visibleEvents.length}개</span>
              </div>
              <div className="h-[calc(100%-49px)] overflow-y-auto px-4 py-3">
                <div className="space-y-6">
                {groups.map(([month, items]) => (
                  <section key={month}>
                    <h2 className="text-sm font-bold text-muted-foreground mb-3">{monthLabel(month)}</h2>
                    <div className="divide-y divide-border bg-card rounded-[20px] border border-border shadow-sm px-4">
                      {items.map((item) => {
                        const mapOrder = visibleEvents.findIndex((event) => event.content_id === item.content_id) + 1;
                        return (
                        <div
                          key={item.content_id}
                          ref={(element) => {
                            eventItemRefs.current[item.content_id] = element;
                          }}
                          onClick={() => setSelectedEventId(item.content_id)}
                          className={`flex items-center gap-4 py-3.5 -mx-2 px-2 rounded-xl cursor-pointer transition-colors ${
                            selectedEventId === item.content_id
                              ? "bg-primary/10 ring-1 ring-primary"
                              : "hover:bg-muted/40"
                          }`}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            selectedEventId === item.content_id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}>
                            {mapOrder > 0 ? mapOrder : "-"}
                          </span>
                          <div className="w-16 h-16 shrink-0 rounded-sm overflow-hidden bg-muted flex items-center justify-center">
                            {item.image_url ? (
                              <img
                                src={getProxiedImageUrl(item.image_url)}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Calendar className="w-5 h-5 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 self-stretch flex flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{item.title}</p>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                  <Calendar className="w-3 h-3 shrink-0" />
                                  <span>
                                    {item.event_start_date.replaceAll("-", ".")}
                                    {item.event_end_date && item.event_end_date !== item.event_start_date
                                      ? ` ~ ${item.event_end_date.replaceAll("-", ".")}`
                                      : ""}
                                  </span>
                                </div>
                              </div>
                              {item.address && (
                                <span className="shrink-0 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                                  {item.address.split(" ")[0]}
                                </span>
                              )}
                            </div>
                            <a
                              href={getEventLink(item)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="mt-auto self-end px-0.5 py-1 text-xs font-semibold text-primary hover:underline transition-colors"
                            >
                              {item.event_homepage ? "행사 사이트" : "Google에서 찾아보기"}
                            </a>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
