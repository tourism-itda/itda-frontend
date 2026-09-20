import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, ChevronRight, Footprints, MapPinOff, Search } from "lucide-react";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { ContentCard } from "../components/ContentCard";
import { useContents } from "../lib/useContents";
import { getUpcomingEvents, getEventLink, EventSummary } from "../lib/events";
import { getProxiedImageUrl } from "../lib/imageProxy";

const mediaTypeLabel: Record<string, string> = {
  MOVIE: "영화",
  DRAMA: "드라마",
  DOCUMENTARY: "다큐",
};

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // 검색어는 API 쿼리(q)로 나가므로, 매 타이핑마다 요청하지 않도록 디바운스한다.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const popular = useContents({ sort: "popular", limit: 8, q: debouncedQuery || undefined });

  const [upcomingStatus, setUpcomingStatus] = useState<"loading" | "done" | "error">("loading");
  const [upcomingEvents, setUpcomingEvents] = useState<EventSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    setUpcomingStatus("loading");

    getUpcomingEvents(3)
      .then((result) => {
        if (cancelled) return;
        setUpcomingEvents(result);
        setUpcomingStatus("done");
      })
      .catch(() => {
        if (!cancelled) setUpcomingStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">

        {/* 히어로 섹션 */}
        <section className="pt-10 lg:pt-16 pb-8">
          <div className="flex flex-col gap-8">
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-[34px] leading-[38.08px] tracking-[-0.04em] lg:text-[64px] lg:leading-[71.68px] mb-3 lg:max-w-[764px]">
                역사 속 이야기를
                <br />
                여행으로 이어보세요
              </h1>
              <p className="text-[16px] font-medium leading-[28px] lg:text-[18px] lg:leading-[32px] text-muted-foreground mt-5 mb-7 lg:whitespace-nowrap">
                드라마·영화 속 배경지를 실제 여행 코스로,
                <br className="lg:hidden" />
                {" "}잇다가 시대와 인물의 발자취를 안내합니다.
              </p>

              {/* 검색바 (pill) */}
              <div className="flex items-center gap-2 bg-card/70 backdrop-blur-md hanji-noise border border-border rounded-full shadow-sm h-[52px] p-1.5 lg:h-16 lg:p-2 max-w-3xl mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="영화 제목을 검색해보세요"
                  className="border-0 shadow-none bg-transparent h-9 px-1 text-[16px] font-semibold focus-visible:ring-0"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 타이틀 + 개수 + 전체보기 */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="font-heading text-[24px] font-black">콘텐츠 둘러보기</h2>
                <span className="text-sm text-muted-foreground">총 {popular.data?.total ?? 0}개</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/app/popular")}
              className="text-base text-primary font-bold hover:underline flex items-center gap-0.5 shrink-0"
            >
              전체보기
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {popular.status === "loading" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-7">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[3/4] rounded-sm mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-1.5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          )}
          {popular.status === "error" && (
            <div className="text-center py-16 text-muted-foreground">
              <MapPinOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">콘텐츠를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
            </div>
          )}
          {popular.status === "done" && (popular.data?.data.length ?? 0) === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          )}
          {popular.status === "done" && (popular.data?.data.length ?? 0) > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-7">
              {popular.data!.data.slice(0, 8).map((item) => (
                <ContentCard
                  key={item.content_id}
                  content={{
                    id: String(item.content_id),
                    title: item.title,
                    genre: item.media ? mediaTypeLabel[item.media.type] ?? item.media.type : "",
                    era: item.media?.release_year ? String(item.media.release_year) : "",
                    image: item.thumbnail_url,
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* 하단 2단 그리드 */}
        <section className="grid lg:grid-cols-3 gap-5 mb-10">
          <div className="lg:col-span-2 rounded-[28px] border border-border/40 bg-card/15 backdrop-blur-md hanji-noise p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-black">다가오는 일정</h3>
              {upcomingStatus === "done" && upcomingEvents.length > 0 && (
                <button
                  onClick={() => navigate("/app/events")}
                  className="text-sm text-primary font-bold hover:underline flex items-center gap-0.5 shrink-0"
                >
                  전체보기
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {upcomingStatus === "loading" && (
              <div className="space-y-3">
                {[0, 1].map((i) => (
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

            {upcomingStatus === "error" && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">행사 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
              </div>
            )}

            {upcomingStatus === "done" && upcomingEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">예정된 행사가 없어요</p>
              </div>
            )}

            {upcomingStatus === "done" && upcomingEvents.length > 0 && (
              <div className="divide-y divide-border">
                {upcomingEvents.map((item) => (
                  <a
                    key={item.content_id}
                    href={getEventLink(item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 hover:bg-muted/40 rounded-xl transition-colors -mx-2 px-2"
                  >
                    <div className="w-16 h-16 shrink-0 rounded-sm overflow-hidden bg-muted flex items-center justify-center">
                      {item.image_url ? (
                        <img src={getProxiedImageUrl(item.image_url)} alt={item.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <Calendar className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{item.event_start_date.replaceAll("-", ".")}</span>
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
            )}
          </div>

          <div
            className="rounded-[28px] border border-primary/15 bg-card/5 backdrop-blur-md hanji-noise p-8 flex flex-col justify-between text-foreground shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--terracotta) 10%, transparent), color-mix(in srgb, var(--gold) 8%, transparent))",
            }}
          >
            <div>
              <Footprints className="w-7 h-7 mb-3 text-primary" />
              <h3 className="font-heading text-2xl lg:text-[28px] font-black mb-2">나만의 역사 여행 코스 만들기</h3>
              <p className="text-base text-muted-foreground">관심 시대와 인물을 고르면 잇다가 여행 코스를 추천해드려요.</p>
            </div>
            <button
              onClick={() => navigate("/app/planner")}
              className="mt-6 self-start h-12 px-5 rounded-lg border border-primary bg-transparent text-primary text-sm font-black hover:bg-primary hover:text-primary-foreground transition-colors flex items-center"
            >
              플래너 시작하기
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
