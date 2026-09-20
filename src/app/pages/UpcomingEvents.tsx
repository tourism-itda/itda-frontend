import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, MapPinOff } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { MapView } from "../components/MapView";
import { getUpcomingEvents, getEventLink, EventSummary } from "../lib/events";
import { getProxiedImageUrl } from "../lib/imageProxy";
import { loadKakaoMaps } from "../lib/kakaoMaps";

// 백엔드 EventService.FETCH_ROWS(관광API 캐시 크기)와 맞춘 값. 이보다 더 달라고 해도
// 캐시에 없는 건 못 받아오므로 사실상 이게 상한이다.
const FETCH_LIMIT = 100;

// "앞으로 한 달"까지만 보여준다(요청 사항). 화면에서 오늘 날짜 기준으로 자른다 —
// 백엔드는 limit 개수 기준으로만 잘라 주고 기간 필터는 없어서 프론트에서 처리한다.
const MONTHS_AHEAD = 1;

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
  const [eventCoordinates, setEventCoordinates] = useState<Record<string, { lat: number; lng: number }>>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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
  const visibleEvents = useMemo(
    () => events.filter((e) => e.event_start_date <= cutoff),
    [events, cutoff],
  );

  // 행사 API는 좌표 대신 주소만 내려주므로 카카오 지오코더로 지도용 좌표를 보강한다.
  useEffect(() => {
    if (visibleEvents.length === 0) return;
    let cancelled = false;

    loadKakaoMaps()
      .then(() => {
        if (cancelled) return;
        const geocoder = new window.kakao.maps.services.Geocoder();
        visibleEvents.forEach((event) => {
          if (!event.address || eventCoordinates[event.content_id]) return;
          geocoder.addressSearch(event.address, (result: Array<{ x: string; y: string }>, code: string) => {
            if (cancelled || code !== window.kakao.maps.services.Status.OK || result.length === 0) return;
            setEventCoordinates((prev) => ({
              ...prev,
              [event.content_id]: { lat: Number(result[0].y), lng: Number(result[0].x) },
            }));
          });
        });
      })
      .catch(() => {
        // 지도 키가 없거나 지오코딩에 실패해도 행사 목록은 정상적으로 사용할 수 있다.
      });

    return () => {
      cancelled = true;
    };
  }, [visibleEvents, eventCoordinates]);

  const mapEvents = useMemo(
    () =>
      visibleEvents.flatMap((event, index) => {
        const coordinates = eventCoordinates[event.content_id];
        if (!coordinates) return [];
        return [{
          id: event.content_id,
          order: index + 1,
          name: event.title,
          lat: coordinates.lat,
          lng: coordinates.lng,
          image: event.image_url ?? "",
        }];
      }),
    [visibleEvents, eventCoordinates],
  );

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
            <p className="text-sm">예정된 행사가 없어요</p>
          </div>
        )}

        {status === "done" && groups.length > 0 && (
          <div className="space-y-8">
            {visibleEvents.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-sm font-bold text-muted-foreground">행사 위치</h2>
                  <span className="text-xs text-muted-foreground">
                    {mapEvents.length > 0 ? `${mapEvents.length}곳 표시` : "위치를 불러오는 중"}
                  </span>
                </div>
                <div className="h-64 lg:h-80 overflow-hidden rounded-xl border border-border">
                  <MapView
                    places={mapEvents}
                    selectedPlace={selectedEventId}
                    onSelectPlace={setSelectedEventId}
                  />
                </div>
              </section>
            )}
            {groups.map(([month, items]) => (
              <section key={month}>
                <h2 className="text-sm font-bold text-muted-foreground mb-3">{monthLabel(month)}</h2>
                <div className="divide-y divide-border bg-card rounded-[20px] border border-border shadow-sm px-4">
                  {items.map((item) => (
                    <a
                      key={item.content_id}
                      href={getEventLink(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 py-3.5 hover:bg-muted/40 transition-colors -mx-2 px-2 rounded-xl"
                    >
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
                      <div className="min-w-0 flex-1">
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
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
